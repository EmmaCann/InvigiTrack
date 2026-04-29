/**
 * DAL — Profiles
 * Tutte le query sulla tabella `profiles` vivono qui.
 */

import { createClient } from "@/lib/supabase/server"
import type { Profile, OnboardingData, PlatformRole, DashboardPrefs, AnalyticsPrefs, SessionsPrefs, PaymentsPrefs, UiState } from "@/types/database"

// --- READ ---------------------------------------------------------------------

/**
 * Cerca un profilo per email.
 * Usato nell'onboarding check (abbiamo l'email, non ancora l'id).
 */
export async function getProfileByEmail(email: string): Promise<Profile | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", email)
    .single<Profile>()
  if (error || !data) return null
  return data
}

/**
 * Cerca un profilo per ID (= auth.users.id).
 * Più efficiente di getProfileByEmail quando abbiamo già l'id dall'auth.
 * Usato nel layout e nelle route protette.
 */
export async function getProfileById(userId: string): Promise<Profile | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single<Profile>()
  if (error || !data) return null
  return data
}

/**
 * Restituisce tutti i profili — email + nome — per il select utenti nel pannello admin.
 * Usato solo da super_admin (accesso limitato dalla RLS e dalla route).
 */
export async function getAllProfiles(): Promise<Array<{ id: string; email: string; full_name: string | null }>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .order("email")
  if (error || !data) return []
  return data as Array<{ id: string; email: string; full_name: string | null }>
}

/** Trova il profilo super_admin (ce n'è solo uno) */
export async function getSuperAdminProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("platform_role", "super_admin")
    .limit(1)
    .single<Profile>()
  if (error || !data) return null
  return data
}

// --- WRITE --------------------------------------------------------------------

/**
 * Inserisce un nuovo profilo nel database.
 *
 * IMPORTANTE: userId deve essere = auth.users.id
 * così RLS (auth.uid()) funziona correttamente.
 *
 * Analogia Laravel: Profile::create([...])
 */
export async function insertProfile(
  userId: string,
  email: string,
  data: OnboardingData,
  platformRole: PlatformRole = "user",
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from("profiles").insert({
    id: userId,
    email,
    full_name: data.full_name,
    role_type: data.role_type,
    platform_role: platformRole,
    default_hourly_rate: data.default_hourly_rate,
  })
  if (error) return { error: error.message }
  return {}
}

/**
 * Aggiorna i dati modificabili del profilo.
 * Usato dalla pagina Settings.
 */
export async function updateProfile(
  userId: string,
  data: Partial<Pick<Profile, "full_name" | "role_type" | "default_hourly_rate" | "rounding_mode">>,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("profiles")
    .update(data)
    .eq("id", userId)
  if (error) return { error: error.message }
  return {}
}

/**
 * Salva le preferenze pagina sessioni.
 */
export async function updateSessionsPrefs(
  userId: string,
  prefs: SessionsPrefs,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("profiles")
    .update({ sessions_prefs: prefs })
    .eq("id", userId)
  if (error) return { error: error.message }
  return {}
}

/**
 * Salva le preferenze pagina pagamenti.
 */
export async function updatePaymentsPrefs(
  userId: string,
  prefs: PaymentsPrefs,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("profiles")
    .update({ payments_prefs: prefs })
    .eq("id", userId)
  if (error) return { error: error.message }
  return {}
}

/**
 * Salva le preferenze della pagina analytics.
 */
export async function updateAnalyticsPrefs(
  userId: string,
  prefs: AnalyticsPrefs,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("profiles")
    .update({ analytics_prefs: prefs })
    .eq("id", userId)
  if (error) return { error: error.message }
  return {}
}

/**
 * Aggiorna (merge) il campo ui_state del profilo.
 * Usa la concatenazione JSONB di Postgres per preservare le chiavi esistenti.
 */
export async function updateUiState(
  userId: string,
  patch: Partial<UiState>,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  // Prima leggi lo stato attuale, poi fai merge lato client (compatibile con RLS)
  const { data: current } = await supabase
    .from("profiles")
    .select("ui_state")
    .eq("id", userId)
    .single()
  const merged = { ...(current?.ui_state ?? {}), ...patch }
  const { error } = await supabase
    .from("profiles")
    .update({ ui_state: merged })
    .eq("id", userId)
  if (error) return { error: error.message }
  return {}
}

/**
 * Salva le preferenze card della dashboard.
 */
export async function updateDashboardPrefs(
  userId: string,
  prefs: DashboardPrefs,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("profiles")
    .update({ dashboard_prefs: prefs })
    .eq("id", userId)
  if (error) return { error: error.message }
  return {}
}
