/**
 * LAYOUT PROTETTO della dashboard.
 *
 * In Next.js App Router, un layout.tsx avvolge tutte le pagine
 * nella stessa cartella — come un @extends('layouts.app') in Blade.
 *
 * Qui facciamo un secondo controllo di sicurezza: anche se il middleware
 * protegge già le route, è buona pratica verificare l'utente anche
 * nel layout server-side. "Defense in depth" — difesa a più livelli.
 */

import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/data/auth"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Doppio controllo: se per qualche motivo il middleware non ha rediretto
  // Passiamo dal DAL invece di chiamare Supabase direttamente
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  return <>{children}</>
}
