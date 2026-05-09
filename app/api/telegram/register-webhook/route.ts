/**
 * Registra il webhook Telegram (una tantum dopo ogni deploy).
 *
 * Chiamata: GET /api/telegram/register-webhook?secret=CRON_SECRET
 *
 * Questo dice a Telegram dove inviare i messaggi ricevuti dal bot.
 * Deve essere ripetuto solo se cambia il dominio dell'app.
 */

import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get("secret")

  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const token   = process.env.TELEGRAM_BOT_TOKEN
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL

  if (!token)   return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN non configurato" }, { status: 500 })
  if (!siteUrl) return NextResponse.json({ error: "NEXT_PUBLIC_SITE_URL non configurato" }, { status: 500 })

  const webhookUrl = `${siteUrl}/api/telegram/webhook`

  const res  = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ url: webhookUrl }),
  })
  const data = await res.json()

  return NextResponse.json({ ok: data.ok, description: data.description, webhookUrl })
}
