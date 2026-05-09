/**
 * API Route — Push Subscription
 *
 * POST   { endpoint, keys: { p256dh, auth } }  → salva la subscription
 * DELETE { endpoint }                           → rimuove la subscription
 */

import { NextResponse }              from "next/server"
import { createClient }              from "@/lib/supabase/server"
import { savePushSubscription, deletePushSubscription } from "@/lib/data/push-subscriptions"

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

export async function POST(request: Request) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 })

  const body = await request.json()
  const { endpoint, keys } = body ?? {}

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "Parametri mancanti" }, { status: 400 })
  }

  const result = await savePushSubscription(user.id, {
    endpoint,
    p256dh: keys.p256dh,
    auth:   keys.auth,
  })

  if (result.error) return NextResponse.json({ error: result.error }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 })

  const body = await request.json()
  const { endpoint } = body ?? {}

  if (!endpoint) return NextResponse.json({ error: "endpoint mancante" }, { status: 400 })

  const result = await deletePushSubscription(user.id, endpoint)
  if (result.error) return NextResponse.json({ error: result.error }, { status: 500 })
  return NextResponse.json({ ok: true })
}
