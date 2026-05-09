/**
 * Telegram Reminders — Bot API (fetch diretto, nessun npm)
 * Invia messaggi di promemoria via Telegram Bot.
 */

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("it-IT", {
    weekday: "long",
    day:     "numeric",
    month:   "long",
  })
}

function formatTiming(minutesBefore: number): string {
  if (minutesBefore < 60)   return `${minutesBefore} minuti`
  if (minutesBefore < 1440) return `${minutesBefore / 60} ${minutesBefore / 60 === 1 ? "ora" : "ore"}`
  if (minutesBefore < 2880) return "1 giorno"
  if (minutesBefore < 7200) return `${Math.round(minutesBefore / 1440)} giorni`
  return "1 settimana"
}

export async function sendTelegramReminder(
  chatId: string,
  event: {
    title:       string
    event_date:  string
    start_time?: string | null
    location?:   string | null
  },
  minutesBefore: number,
): Promise<{ error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return { error: "TELEGRAM_BOT_TOKEN non configurato" }

  const timing = formatTiming(minutesBefore)
  const date   = formatDate(event.event_date)
  const time   = event.start_time ? event.start_time.slice(0, 5) : null

  const lines: string[] = []

  if (minutesBefore < 1440) {
    lines.push(`⏰ *Tra ${timing}:* ${escapeMarkdown(event.title)}`)
  } else {
    lines.push(`📅 *Reminder:* ${escapeMarkdown(event.title)}`)
  }

  lines.push("")
  lines.push(`📆 ${escapeMarkdown(date)}`)
  if (time) lines.push(`🕐 Ore ${time}`)
  if (event.location) lines.push(`📍 ${escapeMarkdown(event.location)}`)

  const text = lines.join("\n")

  const url = `https://api.telegram.org/bot${token}/sendMessage`
  const res  = await fetch(url, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    return { error: (body as { description?: string }).description ?? `Telegram API error ${res.status}` }
  }

  return {}
}

/** Escape caratteri speciali per Markdown v1 di Telegram */
function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&")
}
