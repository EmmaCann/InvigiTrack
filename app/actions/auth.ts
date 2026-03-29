"use server"

/**
 * SERVER ACTIONS — cosa sono?
 * Sono funzioni che girano SOLO sul server, ma puoi chiamarle dal client
 * come se fossero normali funzioni JS. Next.js le espone via POST HTTP
 * in modo trasparente. Analogia Laravel: come un Controller method,
 * ma senza dover definire la route manualmente.
 *
 * Il "use server" in cima al file indica che TUTTE le funzioni qui
 * sono Server Actions.
 */

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/data/auth"
import { insertProfile } from "@/lib/data/profiles"
import type { OnboardingData } from "@/types/database"

// ─── LOGIN con email e password ─────────────────────────────────────────────

export async function login(formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  })

  if (error) {
    // Restituiamo l'errore al client invece di fare redirect
    return { error: error.message }
  }

  // redirect() lancia internamente un'eccezione speciale di Next.js —
  // non va chiamato dentro un try/catch
  redirect("/dashboard")
}

// ─── REGISTRAZIONE con email e password ─────────────────────────────────────

export async function register(formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  })

  if (error) {
    return { error: error.message }
  }

  // Dopo la registrazione Supabase manda una mail di conferma.
  // Se hai disabilitato la conferma email nelle impostazioni Supabase,
  // l'utente è già loggato e redirect("/dashboard") funziona subito.
  redirect("/dashboard")
}

// ─── LOGOUT ─────────────────────────────────────────────────────────────────

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/auth/login")
}

// ─── CREA PROFILO (onboarding primo login) ───────────────────────────────────

export async function createProfile(data: OnboardingData) {
  // Chi è loggato? → DAL auth
  const user = await getCurrentUser()

  if (!user) {
    return { error: "Utente non autenticato" }
  }

  // Inserisce nel DB → DAL profiles
  // Questa action non sa nulla di Supabase: sa solo che chiede
  // di salvare un profilo e riceve ok o errore.
  const result = await insertProfile(user.email!, data)

  if (result.error) {
    return { error: result.error }
  }

  return { success: true }
}
