import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

/**
 * Il middleware gira su OGNI richiesta (lato edge, prima del rendering).
 * Qui facciamo due cose:
 *   1. Refresh automatico del token di sessione Supabase (via cookie)
 *   2. Protezione delle route: redirect se non loggati / già loggati
 *
 * Analogia Laravel: è come il gruppo di middleware "auth" su Route::middleware('auth')
 */
export async function middleware(request: NextRequest) {
  // Partiamo con una risposta "vai avanti" di default
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Prima aggiorniamo i cookie nella request...
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // ...poi nella response (così il browser li riceve aggiornati)
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANTE: usa getUser() (non getSession()) — verifica il token con Supabase
  // getSession() legge solo il cookie locale e può essere falsificato
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Utente NON loggato che tenta di accedere alla dashboard → redirect al login
  if (!user && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  // Utente GIÀ loggato che va su /auth/* → redirect alla dashboard
  if (user && pathname.startsWith("/auth")) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Passa la risposta con i cookie aggiornati
  return supabaseResponse
}

export const config = {
  // Applica il middleware a tutte le route TRANNE asset statici
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
