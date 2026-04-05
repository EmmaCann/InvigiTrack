"use server"

/**
 * SERVER ACTIONS — Auth
 *
 * Funzioni che girano sul server, chiamabili dal client come normali funzioni.
 * Analogia Laravel: Controller methods, senza dover definire le route.
 */

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/data/auth"
import { insertProfile } from "@/lib/data/profiles"
import { getCategoryBySlug, grantCategoryAccess } from "@/lib/data/categories"
import type { OnboardingData } from "@/types/database"

// ─── LOGIN ────────────────────────────────────────────────────────────────────

export async function login(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email:    formData.get("email") as string,
    password: formData.get("password") as string,
  })
  if (error) return { error: error.message }
  redirect("/dashboard")
}

// ─── REGISTRAZIONE ────────────────────────────────────────────────────────────

export async function register(formData: FormData) {
  const supabase = await createClient()

  // Controlla la secret key sul server — mai esposta al client
  const secretKey = (formData.get("secret_key") as string | null) ?? ""
  const isAdmin = secretKey.trim() !== "" && secretKey.trim() === process.env.ADMIN_SECRET_KEY

  const { error } = await supabase.auth.signUp({
    email:    formData.get("email") as string,
    password: formData.get("password") as string,
    options: {
      // Salviamo il ruolo nei metadata dell'utente Supabase Auth.
      // Questo valore viene letto durante l'onboarding per decidere
      // quale form mostrare e quale platform_role assegnare al profilo.
      data: {
        platform_role: isAdmin ? "admin" : "user",
      },
    },
  })

  if (error) return { error: error.message }
  redirect("/dashboard")
}

// ─── LOGOUT ──────────────────────────────────────────────────────────────────

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/auth/login")
}

// ─── CREA PROFILO (onboarding primo login) ────────────────────────────────────

export async function createProfile(data: OnboardingData) {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Utente non autenticato" }

    // Legge il ruolo dai metadata Supabase Auth (impostato durante register)
    const platformRole = user.user_metadata?.platform_role === "admin" ? "admin" : "user"

    // 1. Inserisce il profilo con id = auth.users.id (richiesto da RLS)
    const profileResult = await insertProfile(user.id, user.email!, data, platformRole)
    // Se il profilo esiste già (duplicate key), proseguiamo senza errore —
    // l'utente ha già completato l'onboarding in un tentativo precedente.
    if (profileResult.error && !profileResult.error.includes("duplicate key")) {
      return { error: profileResult.error }
    }

    // 2. Grant categoria primaria (best-effort — un fallimento non blocca l'onboarding)
    // Sia admin che user ricevono solo la categoria selezionata —
    // le altre si aggiungono manualmente tramite "Nuovo workspace" nell'header.
    const slug = data.primary_category_slug ?? "invigilation"
    const category = await getCategoryBySlug(slug)
    if (category) {
      await grantCategoryAccess(user.id, category.id)
    }

    return { success: true }
  } catch (err) {
    console.error("[createProfile]", err)
    return { error: err instanceof Error ? err.message : "Errore durante il salvataggio del profilo" }
  }
}
