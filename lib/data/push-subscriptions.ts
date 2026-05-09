/**
 * DAL — Push Subscriptions
 * Query sulla tabella `push_subscriptions`.
 */

import { createClient }     from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { PushSubscriptionRecord } from "@/types/database"

// --- READ ---------------------------------------------------------------------

/** Tutte le sottoscrizioni push di un utente (una per browser/dispositivo). */
export async function getPushSubscriptionsByUser(userId: string): Promise<PushSubscriptionRecord[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", userId)
  if (error || !data) return []
  return data as PushSubscriptionRecord[]
}

/**
 * Tutte le sottoscrizioni push di tutti gli utenti.
 * Solo per il cron job — usa admin client per bypassare RLS.
 */
export async function getAllPushSubscriptions(): Promise<PushSubscriptionRecord[]> {
  const admin = createAdminClient()
  if (!admin) return []
  const { data, error } = await admin
    .from("push_subscriptions")
    .select("*")
  if (error || !data) return []
  return data as PushSubscriptionRecord[]
}

// --- WRITE --------------------------------------------------------------------

/**
 * Salva (upsert) una sottoscrizione push.
 * endpoint è UNIQUE — se già esiste aggiorna i valori.
 */
export async function savePushSubscription(
  userId: string,
  sub: { endpoint: string; p256dh: string; auth: string },
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(
      { user_id: userId, endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
      { onConflict: "endpoint" },
    )
  if (error) return { error: error.message }
  return {}
}

/**
 * Rimuove una sottoscrizione push per endpoint.
 */
export async function deletePushSubscription(
  userId: string,
  endpoint: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", userId)
    .eq("endpoint", endpoint)
  if (error) return { error: error.message }
  return {}
}
