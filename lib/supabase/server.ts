import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Client Supabase per Server Components, Server Actions e Route Handlers.
 * In Next.js 15+, cookies() è async — quindi questa funzione è async.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Se chiamato da un Server Component (non da un'Action),
            // non può scrivere cookie — ignorare è sicuro perché
            // il middleware provvede al refresh della sessione.
          }
        },
      },
    }
  )
}
