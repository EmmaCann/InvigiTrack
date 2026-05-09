/**
 * Email Reminders — Resend
 * Invia email di promemoria per eventi calendario.
 */

import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

function formatEventDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("it-IT", {
    weekday: "long",
    day:     "numeric",
    month:   "long",
  })
}

function formatTime(timeStr: string | null | undefined): string {
  if (!timeStr) return ""
  return timeStr.slice(0, 5)  // "09:00:00" → "09:00"
}

function formatTiming(minutesBefore: number): string {
  if (minutesBefore < 60)   return `${minutesBefore} minuti`
  if (minutesBefore < 1440) return `${minutesBefore / 60} ${minutesBefore / 60 === 1 ? "ora" : "ore"}`
  if (minutesBefore < 2880) return "1 giorno"
  if (minutesBefore < 7200) return `${Math.round(minutesBefore / 1440)} giorni`
  return "1 settimana"
}

export async function sendEmailReminder(
  to: string,
  event: {
    title:       string
    event_date:  string
    start_time?: string | null
    location?:   string | null
  },
  minutesBefore: number,
): Promise<{ error?: string }> {
  const from   = process.env.RESEND_FROM ?? "InvigiTrack <onboarding@resend.dev>"
  const timing = formatTiming(minutesBefore)
  const date   = formatEventDate(event.event_date)
  const time   = formatTime(event.start_time)

  const subject = minutesBefore >= 1440
    ? `📅 Reminder: "${event.title}" — ${date}`
    : `⏰ Tra ${timing}: "${event.title}"`

  const timeHtml = time
    ? `<p style="margin:4px 0;color:#6b7280;font-size:14px;">🕐 Ore <strong>${time}</strong></p>`
    : ""
  const locationHtml = event.location
    ? `<p style="margin:4px 0;color:#6b7280;font-size:14px;">📍 ${event.location}</p>`
    : ""

  const html = `
    <!DOCTYPE html>
    <html lang="it">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
        <tr><td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;max-width:560px;">
            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:28px 32px;">
                <p style="margin:0;color:rgba(255,255,255,0.8);font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">InvigiTrack · Reminder</p>
                <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:700;line-height:1.3;">${event.title}</h1>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding:28px 32px;">
                <p style="margin:0 0 16px;font-size:15px;color:#374151;">
                  ${minutesBefore < 1440
                    ? `Hai un evento <strong>tra ${timing}</strong>.`
                    : `Hai un evento <strong>${minutesBefore === 1440 ? "domani" : `tra ${timing}`}</strong>.`
                  }
                </p>
                <div style="background:#f3f4f6;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
                  <p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#111827;">${event.title}</p>
                  <p style="margin:4px 0;color:#6b7280;font-size:14px;">📅 ${date}</p>
                  ${timeHtml}
                  ${locationHtml}
                </div>
                <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://invigitrack.vercel.app"}/dashboard/calendar"
                   style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:600;">
                  Apri il calendario →
                </a>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding:16px 32px 24px;border-top:1px solid #f3f4f6;">
                <p style="margin:0;font-size:12px;color:#9ca3af;">
                  Ricevi questa email perché hai abilitato i reminder su InvigiTrack.
                  Puoi disattivarli in <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://invigitrack.vercel.app"}/dashboard/settings#notifiche" style="color:#6366f1;">Impostazioni → Notifiche</a>.
                </p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `

  const { error } = await resend.emails.send({ from, to, subject, html })
  if (error) return { error: (error as { message?: string }).message ?? "Errore invio email" }
  return {}
}
