/**
 * PAGINA DASHBOARD — Server Component.
 *
 * Flusso:
 * 1. Prende l'utente autenticato da Supabase
 * 2. Cerca il profilo nel DB tramite email
 * 3. Se il profilo NON esiste → mostra OnboardingDialog (primo login)
 * 4. Se il profilo ESISTE → mostra "Ciao nome!"
 *
 * Analogia Laravel:
 *   public function index() {
 *     $user = auth()->user();
 *     $profile = Profile::where('email', $user->email)->first();
 *     return view('dashboard', compact('user', 'profile'));
 *   }
 */

import { createClient } from "@/lib/supabase/server"
import { OnboardingDialog } from "@/components/auth/onboarding-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { logout } from "@/app/actions/auth"
import type { Profile } from "@/types/database"

export default async function DashboardPage() {
  const supabase = await createClient()

  // 1. Utente autenticato (garantito dal layout, ma lo riprendiamo)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 2. Cerca il profilo nel DB per email
  // Analogia Laravel: Profile::where('email', $user->email)->first()
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", user!.email!)
    .single<Profile>()

  // 3. Nessun profilo = primo login → mostra onboarding
  if (!profile) {
    return <OnboardingDialog />
  }

  // 4. Profilo trovato → saluta l'utente
  const displayName = profile.full_name ?? profile.email

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">
            Ciao, {displayName}! 👋
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground">
            Ruolo:{" "}
            <span className="font-medium text-foreground capitalize">
              {profile.role_type}
            </span>
          </p>
          <p className="text-muted-foreground">
            Tariffa oraria:{" "}
            <span className="font-medium text-foreground">
              £{profile.default_hourly_rate}/h
            </span>
          </p>
          {/* form per la Server Action logout — senza JavaScript funziona lo stesso */}
          <form action={logout}>
            <Button variant="outline" type="submit" className="mt-2">
              Esci
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
