/**
 * Telegram Bot Webhook
 *
 * Telegram chiama questo endpoint ogni volta che un utente manda un messaggio al bot.
 * Quando riceve /start, risponde con il Chat ID dell'utente — così non ha bisogno
 * di cercare @userinfobot.
 *
 * Setup (una tantum dopo il deploy):
 * Chiama da browser o curl:
 *   GET /api/telegram/register-webhook?secret=CRON_SECRET
 */

import { NextResponse } from "next/server"

const TOKEN = process.env.TELEGRAM_BOT_TOKEN

async function sendMessage(chatId: number | string, text: string) {
  if (!TOKEN) return
  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  })
}

export async function POST(request: Request) {
  if (!TOKEN) return NextResponse.json({ ok: true })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ ok: true })

  const message = body?.message
  if (!message) return NextResponse.json({ ok: true })

  const chatId  = message.chat?.id
  const text    = (message.text ?? "") as string

  if (!chatId) return NextResponse.json({ ok: true })

  if (text.startsWith("/start")) {
    await sendMessage(
      chatId,
      `✅ *Bot InvigiTrack collegato!*\n\nIl tuo Chat ID è:\n\`${chatId}\`\n\nCopialo e incollalo in *Impostazioni → Notifiche → Telegram* per ricevere i reminder degli eventi.`,
    )
  } else {
    await sendMessage(
      chatId,
      `Il tuo Chat ID è: \`${chatId}\``,
    )
  }

  return NextResponse.json({ ok: true })
}
