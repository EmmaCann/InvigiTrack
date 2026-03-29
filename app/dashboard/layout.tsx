/**
 * LAYOUT DELLA DASHBOARD — Server Component.
 *
 * Questo layout avvolge TUTTE le pagine dentro /dashboard/*.
 * Analogia Blade: @extends('layouts.dashboard')
 *
 * Responsabilità:
 *  1. Verifica che l'utente sia loggato (defense in depth)
 *  2. Fetcha il profilo UNA volta sola per tutta la dashboard
 *  3. Renderizza la struttura visiva: Sidebar | Header + contenuto
 *
 * Il profilo viene passato come prop all'Header (Client Component).
 * In questo modo l'Header conosce il nome dell'utente
 * senza dover fare un'altra chiamata al DB.
 */

import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/data/auth"
import { getProfileByEmail } from "@/lib/data/profiles"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 1. Utente autenticato?
  const user = await getCurrentUser()
  if (!user) redirect("/auth/login")

  // 2. Profilo nel DB?
  //    Lo fetchiamo qui così non dobbiamo rifarlo in ogni pagina figlia
  //    solo per mostrare nome/avatar nell'header.
  const profile = await getProfileByEmail(user.email!)
  if (!profile) redirect("/dashboard") // torna alla page.tsx che gestisce l'onboarding

  return (
    // Contenitore a tutta altezza diviso in due colonne:
    // [sidebar fissa | area principale scrollabile]
    <div className="flex h-screen overflow-hidden bg-background">

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <Sidebar />

      {/* ── Area destra: header + contenuto ──────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Header fisso in cima, riceve il profilo come prop */}
        <Header profile={profile} />

        {/* Contenuto della pagina — scrollabile */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>

      </div>
    </div>
  )
}
