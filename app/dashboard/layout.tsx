/**
 * LAYOUT DELLA DASHBOARD — Server Component.
 *
 * Gestisce due layout distinti:
 *
 *  DESKTOP (≥ md / 768px):
 *    [Sidebar fissa | Header + contenuto scrollabile]
 *
 *  MOBILE (< md):
 *    [MobileHeader in alto | contenuto | BottomNav in basso]
 *
 * Responsabilità:
 *  1. Verifica autenticazione
 *  2. Fetcha profilo una sola volta per tutta la dashboard
 *  3. Se nessun profilo → mostra solo i children (OnboardingDialog)
 *  4. Se profilo trovato → layout completo responsive
 */

import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/data/auth"
import { getProfileById } from "@/lib/data/profiles"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { MobileHeader } from "@/components/layout/mobile-header"
import { BottomNav } from "@/components/layout/bottom-nav"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 1. Autenticazione
  const user = await getCurrentUser()
  if (!user) redirect("/auth/login")

  // 2. Profilo
  const profile = await getProfileById(user.id)

  // 3. Nessun profilo = primo login.
  //    NON facciamo redirect (sarebbe un loop): la page.tsx
  //    mostrerà l'OnboardingDialog. Renderizziamo solo i children
  //    centrati sullo schermo.
  if (!profile) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background p-4">
        {children}
      </div>
    )
  }

  // 4. Layout completo
  return (
    /*
     * h-[100dvh] invece di h-screen:
     * "dvh" = Dynamic Viewport Height — si adatta alla barra
     * dell'indirizzo del browser mobile che può comparire/sparire.
     * "vh" è statico e causa overflow su mobile.
     */
    <div className="flex h-[100dvh] overflow-hidden bg-background">

      {/* ── Sidebar — solo desktop ─────────────────────────────────── */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* ── Colonna destra ────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* Header desktop */}
        <div className="hidden md:block">
          <Header profile={profile} />
        </div>

        {/* Header mobile (logo + hamburger) */}
        <div className="md:hidden">
          <MobileHeader profile={profile} />
        </div>

        {/* Contenuto pagina scrollabile.
            Su mobile: pb-0 perché BottomNav è fuori dal flusso scroll.
            Su desktop: padding uniforme. */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>

        {/* Bottom nav — solo mobile */}
        <div className="md:hidden">
          <BottomNav />
        </div>

      </div>
    </div>
  )
}
