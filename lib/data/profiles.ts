/**
 * DATA ACCESS LAYER — Profiles
 *
 * Tutte le query sulla tabella "profiles" vivono qui.
 * Nessuna pagina o componente deve toccare Supabase direttamente
 * per leggere o scrivere profili — passano sempre da queste funzioni.
 *
 * Analogia Laravel: come un Model con i suoi metodi statici,
 * ma in stile funzionale invece che OOP.
 *
 *   Laravel:  Profile::where('email', $email)->first()
 *   Qui:      getProfileByEmail(email)
 */

import { createClient } from "@/lib/supabase/server"
import type { Profile, OnboardingData } from "@/types/database"

// ─── READ ────────────────────────────────────────────────────────────────────

/**
 * Cerca un profilo per email.
 * Restituisce il profilo oppure null se non esiste.
 *
 * Usato in: dashboard page (per capire se mostrare l'onboarding)
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

// ─── WRITE ───────────────────────────────────────────────────────────────────

/**
 * Inserisce un nuovo profilo nel database.
 * Chiamato dalla Server Action createProfile() durante l'onboarding.
 *
 * Restituisce un oggetto vuoto se ok, oppure { error: "..." } in caso di errore.
 *
 * Analogia Laravel: Profile::create([...])
 */
export async function insertProfile(
  email: string,
  data: OnboardingData,
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase.from("profiles").insert({
    email,
    full_name: data.full_name,
    role_type: data.role_type,
    default_hourly_rate: data.default_hourly_rate,
  })

  if (error) return { error: error.message }
  return {}
}
