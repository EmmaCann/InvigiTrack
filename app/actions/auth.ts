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
  const supabase = await createClient()

  // Recuperiamo l'utente autenticato
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: "Utente non autenticato" }
  }

  // Inseriamo il profilo nella tabella "profiles"
  // Analogia Laravel: Profile::create([...])
  const { error } = await supabase.from("profiles").insert({
    email: user.email!,
    full_name: data.full_name,
    role_type: data.role_type,
    default_hourly_rate: data.default_hourly_rate,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
