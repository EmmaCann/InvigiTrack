"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { updateProfile as dbUpdateProfile, updateDashboardPrefs as dbUpdateDashboardPrefs, updateSessionsPrefs as dbUpdateSessionsPrefs, updatePaymentsPrefs as dbUpdatePaymentsPrefs } from "@/lib/data/profiles"
import { getCurrentUser } from "@/lib/data/auth"
import type { DashboardPrefs, SessionsPrefs, PaymentsPrefs } from "@/types/database"

// --- Profilo ------------------------------------------------------------------

/**
 * Aggiorna il nome visualizzato del profilo.
 */
export async function updateProfileName(
  fullName: string,
): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: "Non autenticato" }

  const trimmed = fullName.trim()
  if (!trimmed) return { error: "Il nome non può essere vuoto" }

  const result = await dbUpdateProfile(user.id, { full_name: trimmed })
  if (result.error) return { error: result.error }

  revalidatePath("/dashboard", "layout")
  return {}
}

// --- Password -----------------------------------------------------------------

/**
 * Cambia la password dell'utente dopo aver verificato quella attuale.
 * Pattern: sign-in con password attuale → se ok, updateUser con nuova.
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()

  // Recupera l'email dell'utente dalla sessione corrente
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user?.email) return { error: "Non autenticato" }

  if (newPassword.length < 8) return { error: "La nuova password deve essere di almeno 8 caratteri" }
  if (currentPassword === newPassword) return { error: "La nuova password deve essere diversa da quella attuale" }

  // Verifica la password attuale tentando un sign-in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email:    user.email,
    password: currentPassword,
  })
  if (signInError) return { error: "Password attuale non corretta" }

  // Aggiorna la password
  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
  if (updateError) return { error: updateError.message }

  return {}
}

// --- Tariffa workspace --------------------------------------------------------

/**
 * Imposta la tariffa oraria specifica per un workspace.
 * Passa `null` per rimuovere la tariffa e tornare al default del profilo.
 */
export async function updateWorkspaceRate(
  workspaceId: string,
  rate: number | null,
): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: "Non autenticato" }

  if (rate !== null && (isNaN(rate) || rate < 0)) {
    return { error: "Tariffa non valida" }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("user_category_access")
    .update({ default_hourly_rate: rate })
    .eq("id", workspaceId)
    .eq("user_id", user.id)  // sicurezza: solo i propri workspace
  if (error) return { error: error.message }

  revalidatePath("/dashboard", "layout")
  return {}
}

// --- Dashboard prefs ----------------------------------------------------------

/**
 * Salva le preferenze card della dashboard (ordine e selezione).
 */
export async function updateDashboardPrefs(
  prefs: DashboardPrefs,
): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: "Non autenticato" }

  const result = await dbUpdateDashboardPrefs(user.id, prefs)
  if (result.error) return { error: result.error }

  revalidatePath("/dashboard")
  return {}
}

// --- Sessions / Payments prefs ------------------------------------------------

export async function updateSessionsPrefs(prefs: SessionsPrefs): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: "Non autenticato" }
  const result = await dbUpdateSessionsPrefs(user.id, prefs)
  if (result.error) return { error: result.error }
  revalidatePath("/dashboard/sessions")
  return {}
}

export async function updatePaymentsPrefs(prefs: PaymentsPrefs): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: "Non autenticato" }
  const result = await dbUpdatePaymentsPrefs(user.id, prefs)
  if (result.error) return { error: result.error }
  revalidatePath("/dashboard/payments")
  return {}
}
