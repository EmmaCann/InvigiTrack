/**
 * Web Push Reminders — web-push library (VAPID)
 * Invia notifiche push al browser tramite le subscription salvate nel DB.
 */

import webpush from "web-push"

// Configura VAPID una volta sola (Node module-level scope)
if (process.env.VAPID_SUBJECT && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  )
}

function formatTiming(minutesBefore: number): string {
  if (minutesBefore < 60)   return `${minutesBefore} min`
  if (minutesBefore < 1440) return `${minutesBefore / 60}h`
  if (minutesBefore < 2880) return "domani"
  return `${Math.round(minutesBefore / 1440)} giorni`
}

export async function sendPushReminder(
  subscription: { endpoint: string; p256dh: string; auth: string },
  event: {
    title:       string
    event_date:  string
    start_time?: string | null
  },
  minutesBefore: number,
): Promise<{ error?: string; expired?: boolean }> {
  if (!process.env.VAPID_PRIVATE_KEY) {
    return { error: "VAPID keys non configurate" }
  }

  const timing = formatTiming(minutesBefore)
  const time   = event.start_time ? ` alle ${event.start_time.slice(0, 5)}` : ""

  const title  = minutesBefore < 1440
    ? `⏰ Tra ${timing}: ${event.title}`
    : `📅 ${event.title}`
  const body   = minutesBefore < 1440
    ? `Hai un evento${time}`
    : `${timing}${time} · ricordati di prepararti`

  const payload = JSON.stringify({
    title,
    body,
    tag: `reminder-${event.event_date}`,
    url: "/dashboard/calendar",
  })

  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth:   subscription.auth,
    },
  }

  try {
    await webpush.sendNotification(pushSubscription, payload)
    return {}
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string }
    // 410 Gone = subscription non più valida (browser disinstallato/rimosso)
    if (e.statusCode === 410 || e.statusCode === 404) {
      return { expired: true }
    }
    return { error: e.message ?? "Errore invio push" }
  }
}
