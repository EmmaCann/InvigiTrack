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
import { getCategoryBySlug, getAllCategories, grantCategoryAccess } from "@/lib/data/categories"
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
  const user = await getCurrentUser()
  if (!user) return { error: "Utente non autenticato" }

  // Legge il ruolo dai metadata Supabase Auth (impostato durante register)
  const platformRole = user.user_metadata?.platform_role === "admin" ? "admin" : "user"

  // 1. Inserisce il profilo con id = auth.users.id (richiesto da RLS)
  const profileResult = await insertProfile(user.id, user.email!, data, platformRole)
  if (profileResult.error) return { error: profileResult.error }

  // 2. Grant categorie
  if (platformRole === "admin") {
    // Admin → accesso a TUTTE le categorie (attive e future)
    const all = await getAllCategories()
    for (const cat of all) {
      await grantCategoryAccess(user.id, cat.id)
    }
  } else {
    // User normale → solo 'invigilation'
    const category = await getCategoryBySlug(data.primary_category_slug ?? "invigilation")
    if (category) {
      await grantCategoryAccess(user.id, category.id)
    }
  }

  return { success: true }
}
