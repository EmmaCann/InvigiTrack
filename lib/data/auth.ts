/**
 * DATA ACCESS LAYER — Auth
 *
 * Funzioni centralizzate per recuperare l'utente autenticato.
 * Tutti i Server Components, layout e Server Actions che hanno bisogno
 * dell'utente corrente devono passare da qui — mai chiamare
 * supabase.auth.getUser() direttamente nelle pagine.
 *
 * Analogia Laravel: come auth()->user(), ma incapsulato in una funzione
 * riutilizzabile invece di essere sparso in ogni Controller.
 */

import { createClient } from "@/lib/supabase/server"
import type { User } from "@supabase/supabase-js"

/**
 * Restituisce l'utente autenticato, oppure null se non loggato.
 * Usa getUser() (non getSession()) per verificare il token
 * direttamente sui server Supabase — più sicuro.
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return null
  return user
}
