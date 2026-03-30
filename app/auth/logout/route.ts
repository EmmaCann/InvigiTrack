import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

/**
 * GET /auth/logout
 * Route di emergenza — fa il logout e cancella la sessione.
 * Funziona anche quando il Server Action di logout non è raggiungibile.
 */
export async function GET() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/auth/login")
}
