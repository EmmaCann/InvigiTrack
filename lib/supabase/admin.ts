import { createClient as createSupabaseClient } from "@supabase/supabase-js"

/**
 * Client Supabase con service role key.
 * Bypassa RLS — usare SOLO in server actions/route handlers mai esposti al client.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    console.error("[createAdminClient] SUPABASE_SERVICE_ROLE_KEY non configurata — aggiungi la chiave al .env.local")
    return null
  }

  return createSupabaseClient(url, key, {
    auth: { persistSession: false },
  })
}
