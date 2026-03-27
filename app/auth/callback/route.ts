/**
 * ROUTE HANDLER — cosa è?
 * È l'equivalente di una route API in Laravel (Route::get('/callback', ...)).
 * In Next.js App Router, un file "route.ts" in app/ definisce endpoint HTTP.
 *
 * Questo endpoint gestisce il redirect di Google OAuth:
 * 1. Google reindirizza l'utente qui con un "code" nell'URL
 * 2. Noi scambiamo il code con una sessione Supabase
 * 3. Redirect alla dashboard
 */

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  // "next" permette di reindirizzare a una pagina specifica dopo il login
  const next = searchParams.get("next") ?? "/dashboard"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Se qualcosa è andato storto, redirect al login con un errore
  return NextResponse.redirect(`${origin}/auth/login?error=oauth_error`)
}
