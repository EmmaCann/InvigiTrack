/**
 * DAL — Profiles
 * Tutte le query sulla tabella `profiles` vivono qui.
 */

import { createClient } from "@/lib/supabase/server"
import type { Profile, OnboardingData } from "@/types/database"

// ─── READ ─────────────────────────────────────────────────────────────────────

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

// ─── WRITE ────────────────────────────────────────────────────────────────────

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
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from("profiles").insert({
    id: userId,   // ← critico: deve matchare auth.uid()
    email,
    full_name: data.full_name,
    role_type: data.role_type,  // può essere null per non-invigilators
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
