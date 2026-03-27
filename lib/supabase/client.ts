import { createBrowserClient } from "@supabase/ssr"

/**
 * Client Supabase per i Client Components (browser).
 * Viene ricreato ad ogni chiamata - @supabase/ssr gestisce internamente il singleton.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
