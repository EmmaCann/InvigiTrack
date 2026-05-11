/**
 * Dispatch di notifiche via canali configurati dall'utente.
 *
 * Usato per notifiche piattaforma (admin → utenti) e feedback (utente → super_admin).
 * Diverso dai reminder calendario: non c'è una finestra temporale né anti-duplicati,
 * viene inviato subito come evento puntuale.
 */

import { createAdminClient }           from "@/lib/supabase/admin"
import { getPushSubscriptionsByUser }  from "@/lib/data/push-subscriptions"
import { Resend }                      from "resend"
import webpush                         from "web-push"
import type { NotificationsPrefs }     from "@/types/database"

// --- VAPID setup (una sola volta) ---------------------------------------------

if (
  process.env.VAPID_SUBJECT &&
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
  process.env.VAPID_PRIVATE_KEY
) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  )
}

// --- Email -------------------------------------------------------------------

async function sendEmailNotification(
  to: string,
  title: string,
  message: string,
  url: string,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return

  const resend  = new Resend(apiKey)
  const from    = process.env.RESEND_FROM ?? "InvigiTrack <onboarding@resend.dev>"
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://invigi-track.vercel.app"
  const fullUrl = url.startsWith("http") ? url : `${siteUrl}${url}`

  await resend.emails.send({
    from,
    to,
    subject: title,
    html: `
      <!DOCTYPE html>
      <html lang="it">
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
      <body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
          <tr><td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;max-width:560px;">
              <tr>
                <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:24px 32px;">
                  <p style="margin:0;color:rgba(255,255,255,0.8);font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">InvigiTrack</p>
                  <h1 style="margin:6px 0 0;color:#fff;font-size:20px;font-weight:700;line-height:1.3;">${title}</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:24px 32px;">
                  <p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.6;">${message}</p>
                  <a href="${fullUrl}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:11px 22px;border-radius:10px;font-size:13px;font-weight:600;">
                    Apri InvigiTrack →
                  </a>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 32px 22px;border-top:1px solid #f3f4f6;">
                  <p style="margin:0;font-size:11px;color:#9ca3af;">
                    Ricevi questa notifica perché hai abilitato le notifiche su InvigiTrack.
                    <a href="${siteUrl}/dashboard/settings#notifiche" style="color:#6366f1;">Gestisci impostazioni</a>
                  </p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  }).catch(() => {}) // fire-and-forget
}

// --- Push --------------------------------------------------------------------

async function sendPushNotification(
  sub: { endpoint: string; p256dh: string; auth: string },
  title: string,
  message: string,
  url: string,
): Promise<{ expired?: boolean }> {
  if (!process.env.VAPID_PRIVATE_KEY) return {}

  const payload = JSON.stringify({ title, body: message, tag: "platform-notification", url })
  const pushSub = { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }

  try {
    await webpush.sendNotification(pushSub, payload)
    return {}
  } catch (err: unknown) {
    const e = err as { statusCode?: number }
    if (e.statusCode === 410 || e.statusCode === 404) return { expired: true }
    return {}
  }
}

// --- Telegram ----------------------------------------------------------------

async function sendTelegramNotification(
  chatId: string,
  title: string,
  message: string,
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return

  const text = `🔔 *${escapeMarkdown(title)}*\n\n${escapeMarkdown(message)}`

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  }).catch(() => {})
}

function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&")
}

// --- Funzione principale -----------------------------------------------------

/**
 * Invia una notifica via i canali configurati dall'utente.
 * Fire-and-forget: non blocca la risposta HTTP, non lancia eccezioni.
 *
 * @param userId  - ID dell'utente destinatario
 * @param title   - Titolo della notifica
 * @param message - Corpo del messaggio
 * @param url     - URL relativo a cui punta il CTA (es. "/dashboard/admin")
 */
export async function sendViaChannels(
  userId: string,
  title: string,
  message: string,
  url = "/dashboard",
): Promise<void> {
  try {
    const admin = createAdminClient()
    if (!admin) return

    // Leggi prefs + email dal profilo
    const { data: profile } = await admin
      .from("profiles")
      .select("email, notifications_prefs")
      .eq("id", userId)
      .single()

    if (!profile) return

    const prefs = profile.notifications_prefs as NotificationsPrefs | null
    if (!prefs) return

    const tasks: Promise<unknown>[] = []

    // Email
    if (prefs.email?.enabled) {
      const to = prefs.email.address || profile.email
      tasks.push(sendEmailNotification(to, title, message, url))
    }

    // Web Push
    if (prefs.push?.enabled) {
      const subs = await getPushSubscriptionsByUser(userId)
      for (const sub of subs) {
        tasks.push(
          sendPushNotification(sub, title, message, url).then(async (r) => {
            if (r.expired) {
              // Subscription scaduta — rimuovi dal DB
              await admin.from("push_subscriptions").delete().eq("endpoint", sub.endpoint)
            }
          }),
        )
      }
    }

    // Telegram
    if (prefs.telegram?.enabled && prefs.telegram.chat_id) {
      tasks.push(sendTelegramNotification(prefs.telegram.chat_id, title, message))
    }

    await Promise.all(tasks)
  } catch {
    // Fire-and-forget: non blocca mai
  }
}

/**
 * Invia a più utenti in parallelo.
 * Usato per notifiche "all" e "role".
 */
export async function sendViaChannelsToMany(
  userIds: string[],
  title: string,
  message: string,
  url = "/dashboard",
): Promise<void> {
  await Promise.all(userIds.map((id) => sendViaChannels(id, title, message, url)))
}
