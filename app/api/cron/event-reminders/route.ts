/**
 * Cron Job — Event Reminders (ogni ora: 0 * * * *)
 *
 * Per ogni utente con notifiche abilitate:
 *   1. Calcola i "target time" = now + remind_minutes per ogni minuto configurato
 *   2. Cerca eventi che iniziano nella finestra [target - 30min, target + 30min]
 *   3. Per ogni evento non ancora loggato → invia reminder via canali abilitati
 *   4. Logga in reminder_logs (UNIQUE previene duplicati anche in race condition)
 */

import { NextResponse }             from "next/server"
import { createAdminClient }         from "@/lib/supabase/admin"
import { getAllPushSubscriptions, deletePushSubscription } from "@/lib/data/push-subscriptions"
import { hasReminderBeenSent, logReminder } from "@/lib/data/reminder-logs"
import { sendEmailReminder }         from "@/lib/email/reminders"
import { sendPushReminder }          from "@/lib/push/reminders"
import { sendTelegramReminder }      from "@/lib/telegram/reminders"
import type { NotificationsPrefs }   from "@/types/database"

// Finestra di tolleranza (ms) intorno al target time
const WINDOW_MS = 30 * 60 * 1000  // ±30 minuti

export const dynamic  = "force-dynamic"
export const maxDuration = 60  // secondi (Vercel Pro: 60s, Hobby: 10s)

export async function GET(request: Request) {
  // 1. Verifica il segreto Vercel cron
  const authHeader = request.headers.get("Authorization")
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const admin = createAdminClient()
  if (!admin) {
    return NextResponse.json({ error: "Admin client non disponibile" }, { status: 500 })
  }

  const now = new Date()
  let totalSent = 0

  // 2. Leggi tutti i profili con almeno un canale di notifiche abilitato
  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("id, email, notifications_prefs")

  if (profilesError || !profiles) {
    return NextResponse.json({ error: profilesError?.message ?? "Errore lettura profili" }, { status: 500 })
  }

  // 3. Leggi tutte le push subscriptions una sola volta (evita N query)
  const allPushSubs = await getAllPushSubscriptions()
  const pushSubsByUser = new Map<string, typeof allPushSubs>()
  for (const sub of allPushSubs) {
    const list = pushSubsByUser.get(sub.user_id) ?? []
    list.push(sub)
    pushSubsByUser.set(sub.user_id, list)
  }

  // 4. Processa ogni utente in parallelo
  await Promise.all(profiles.map(async (profile) => {
    const prefs = profile.notifications_prefs as NotificationsPrefs | null
    if (!prefs) return

    const emailEnabled    = prefs.email?.enabled    === true
    const pushEnabled     = prefs.push?.enabled     === true
    const telegramEnabled = prefs.telegram?.enabled === true

    if (!emailEnabled && !pushEnabled && !telegramEnabled) return

    // Raccoglie tutti i remind_minutes distinti tra i canali abilitati
    const allMinutes = new Set<number>()
    if (emailEnabled)    prefs.email.remind_minutes?.forEach(m => allMinutes.add(m))
    if (pushEnabled)     prefs.push.remind_minutes?.forEach(m => allMinutes.add(m))
    if (telegramEnabled) prefs.telegram.remind_minutes?.forEach(m => allMinutes.add(m))

    if (allMinutes.size === 0) return

    // Per ogni minutesBefore, cerca eventi nella finestra corrispondente
    await Promise.all(Array.from(allMinutes).map(async (minutesBefore) => {
      const targetTime = new Date(now.getTime() + minutesBefore * 60 * 1000)
      const windowStart = new Date(targetTime.getTime() - WINDOW_MS)
      const windowEnd   = new Date(targetTime.getTime() + WINDOW_MS)

      // Costruisci intervallo di date e orari per la query
      // Gli eventi senza start_time vengono trattati come ore 09:00 locali
      // Qui lavoriamo in UTC — Supabase restituisce event_date come stringa "YYYY-MM-DD"
      // Filtriamo per event_date nell'intervallo e combiniamo con start_time

      // Date coinvolte (possono essere 1 o 2 se la finestra attraversa la mezzanotte)
      const startDateStr = windowStart.toISOString().split("T")[0]
      const endDateStr   = windowEnd.toISOString().split("T")[0]

      const { data: events, error: eventsError } = await admin
        .from("calendar_events")
        .select("id, user_id, event_date, start_time, title, location")
        .eq("user_id", profile.id)
        .eq("is_converted", false)  // solo eventi non ancora convertiti in sessione
        .gte("event_date", startDateStr)
        .lte("event_date", endDateStr)

      if (eventsError || !events || events.length === 0) return

      // Filtra gli eventi il cui datetime è nella finestra
      const matchingEvents = events.filter((ev) => {
        const timeStr    = ev.start_time ?? "09:00:00"
        const eventDt    = new Date(`${ev.event_date}T${timeStr}`)
        return eventDt >= windowStart && eventDt <= windowEnd
      })

      if (matchingEvents.length === 0) return

      // Per ogni evento che matcha, invia i reminder abilitati
      await Promise.all(matchingEvents.map(async (ev) => {
        const eventData = {
          title:      ev.title as string,
          event_date: ev.event_date as string,
          start_time: ev.start_time as string | null,
          location:   ev.location  as string | null,
        }

        // --- Email ---
        if (emailEnabled && prefs.email.remind_minutes?.includes(minutesBefore)) {
          const alreadySent = await hasReminderBeenSent(profile.id, ev.id, "email", minutesBefore)
          if (!alreadySent) {
            const to      = prefs.email.address || profile.email
            const result  = await sendEmailReminder(to, eventData, minutesBefore)
            if (!result.error) {
              await logReminder(profile.id, ev.id, "email", minutesBefore)
              totalSent++
            }
          }
        }

        // --- Web Push ---
        if (pushEnabled && prefs.push.remind_minutes?.includes(minutesBefore)) {
          const alreadySent = await hasReminderBeenSent(profile.id, ev.id, "push", minutesBefore)
          if (!alreadySent) {
            const userSubs = pushSubsByUser.get(profile.id) ?? []
            let anySent    = false

            await Promise.all(userSubs.map(async (sub) => {
              const result = await sendPushReminder(sub, eventData, minutesBefore)
              if (result.expired) {
                // Subscription scaduta — rimuovi dal DB
                await deletePushSubscription(profile.id, sub.endpoint)
              } else if (!result.error) {
                anySent = true
              }
            }))

            if (anySent) {
              await logReminder(profile.id, ev.id, "push", minutesBefore)
              totalSent++
            }
          }
        }

        // --- Telegram ---
        if (telegramEnabled && prefs.telegram.remind_minutes?.includes(minutesBefore)) {
          const chatId = prefs.telegram.chat_id
          if (chatId) {
            const alreadySent = await hasReminderBeenSent(profile.id, ev.id, "telegram", minutesBefore)
            if (!alreadySent) {
              const result = await sendTelegramReminder(chatId, eventData, minutesBefore)
              if (!result.error) {
                await logReminder(profile.id, ev.id, "telegram", minutesBefore)
                totalSent++
              }
            }
          }
        }
      }))
    }))
  }))

  return NextResponse.json({ ok: true, sent: totalSent, timestamp: now.toISOString() })
}
