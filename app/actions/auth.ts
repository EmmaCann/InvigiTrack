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
  const { error } = await supabase.auth.signUp({
    email:    formData.get("email") as string,
    password: formData.get("password") as string,
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

  // 1. Inserisce il profilo con id = auth.users.id (fix RLS)
  const profileResult = await insertProfile(user.id, user.email!, data)
  if (profileResult.error) return { error: profileResult.error }

  // 2. Auto-grant: dà accesso alla categoria 'invigilation'
  //    Ogni nuovo utente parte con invigilation — la owner può
  //    aggiungere altre categorie manualmente dal dashboard Supabase.
  const category = await getCategoryBySlug("invigilation")
  if (category) {
    await grantCategoryAccess(user.id, category.id)
    // Se questo fallisce non blocchiamo — l'utente può sempre
    // fare il grant manualmente. Non critico per l'onboarding.
  }

  return { success: true }
}
