/**
 * DAL — Sessions
 * Tutte le query sulla tabella `sessions` vivono qui.
 *
 * Principio importante: `earned` è un SNAPSHOT salvato al momento
 * dell'inserimento — non viene ricalcolato dalla tariffa corrente.
 * Questo garantisce che i guadagni storici non cambino se aggiorni
 * la tua tariffa nelle impostazioni.
 */

import { createClient } from "@/lib/supabase/server"
import type { Session, CreateSessionData, PaymentStatus } from "@/types/database"

// --- Calcoli locali -----------------------------------------------------------

/**
 * Calcola i minuti tra due orari nel formato "HH:MM".
 * Usato per calcolare `earned` prima di inserire nel DB.
 */
function calcDurationMinutes(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(":").map(Number)
  const [eh, em] = endTime.split(":").map(Number)
  return (eh * 60 + em) - (sh * 60 + sm)
}

/**
 * Calcola il guadagno arrotondato al centesimo.
 */
function calcEarned(durationMinutes: number, hourlyRate: number): number {
  return Math.round((durationMinutes / 60) * hourlyRate * 100) / 100
}

// --- READ ---------------------------------------------------------------------

/**
 * Tutte le sessioni di un utente, dalla più recente.
 * Se workspaceId è specificato, filtra per workspace attivo.
 */
export async function getSessionsByUser(
  userId: string,
  workspaceId?: string,
): Promise<Session[]> {
  const supabase = await createClient()
  let query = supabase
    .from("sessions")
    .select("*")
    .eq("user_id", userId)
  if (workspaceId) query = query.eq("workspace_id", workspaceId)
  const { data, error } = await query
    .order("session_date", { ascending: false })
    .order("start_time", { ascending: false })
  if (error || !data) return []
  return data as Session[]
}

/**
 * Sessioni di un utente in un mese specifico.
 * Usato per la dashboard e il calendario.
 * Se workspaceId è specificato, filtra per workspace attivo.
 */
export async function getSessionsByMonth(
  userId: string,
  year: number,
  month: number,  // 1-12
  workspaceId?: string,
): Promise<Session[]> {
  const supabase = await createClient()
  const from = `${year}-${String(month).padStart(2, "0")}-01`
  const to   = `${year}-${String(month).padStart(2, "0")}-31`
  let query = supabase
    .from("sessions")
    .select("*")
    .eq("user_id", userId)
    .gte("session_date", from)
    .lte("session_date", to)
  if (workspaceId) query = query.eq("workspace_id", workspaceId)
  const { data, error } = await query.order("session_date", { ascending: false })
  if (error || !data) return []
  return data as Session[]
}

/**
 * Riepilogo pagamenti di un utente.
 * Restituisce: totale guadagnato, totale non pagato, totale pagato.
 * Usato per le stat card della dashboard.
 * Se workspaceId è specificato, filtra per workspace attivo.
 */
export async function getPaymentSummary(
  userId: string,
  workspaceId?: string,
): Promise<{
  total_earned: number
  total_unpaid: number
  total_paid: number
  total_hours: number
}> {
  const supabase = await createClient()
  let query = supabase
    .from("sessions")
    .select("earned, payment_status, duration_minutes")
    .eq("user_id", userId)
  if (workspaceId) query = query.eq("workspace_id", workspaceId)
  const { data, error } = await query

  if (error || !data) {
    return { total_earned: 0, total_unpaid: 0, total_paid: 0, total_hours: 0 }
  }

  const summary = data.reduce(
    (acc, row) => {
      acc.total_earned += row.earned
      acc.total_hours  += row.duration_minutes / 60
      if (row.payment_status !== "paid") acc.total_unpaid += row.earned
      if (row.payment_status === "paid")  acc.total_paid   += row.earned
      return acc
    },
    { total_earned: 0, total_unpaid: 0, total_paid: 0, total_hours: 0 },
  )

  // Arrotonda a 2 decimali
  return {
    total_earned: Math.round(summary.total_earned * 100) / 100,
    total_unpaid: Math.round(summary.total_unpaid * 100) / 100,
    total_paid:   Math.round(summary.total_paid   * 100) / 100,
    total_hours:  Math.round(summary.total_hours  * 100) / 100,
  }
}

// --- WRITE --------------------------------------------------------------------

/**
 * Inserisce una nuova sessione.
 * Calcola earned prima di salvare (snapshot finanziario).
 */
export async function insertSession(
  userId: string,
  categoryId: string,
  workspaceId: string,
  data: CreateSessionData,
): Promise<{ error?: string; session?: Session }> {
  const supabase = await createClient()

  const durationMinutes = calcDurationMinutes(data.start_time, data.end_time)
  if (durationMinutes <= 0) {
    return { error: "L'orario di fine deve essere dopo l'orario di inizio" }
  }

  const earned = calcEarned(durationMinutes, data.hourly_rate)

  const { data: session, error } = await supabase
    .from("sessions")
    .insert({
      user_id:        userId,
      category_id:    categoryId,
      workspace_id:   workspaceId,
      session_date:   data.session_date,
      start_time:     data.start_time,
      end_time:       data.end_time,
      location:       data.location ?? null,
      hourly_rate:    data.hourly_rate,
      earned,
      metadata:       data.metadata,
      notes:          data.notes ?? null,
    })
    .select()
    .single<Session>()

  if (error) return { error: error.message }
  return { session }
}

/**
 * Aggiorna i dati di una sessione esistente.
 * Ricalcola earned in base ai nuovi orari e tariffa.
 */
export async function updateSession(
  sessionId: string,
  data: CreateSessionData,
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const durationMinutes = calcDurationMinutes(data.start_time, data.end_time)
  if (durationMinutes <= 0) {
    return { error: "L'orario di fine deve essere dopo l'orario di inizio" }
  }

  const earned = calcEarned(durationMinutes, data.hourly_rate)

  const { error } = await supabase
    .from("sessions")
    .update({
      session_date: data.session_date,
      start_time:   data.start_time,
      end_time:     data.end_time,
      location:     data.location ?? null,
      hourly_rate:  data.hourly_rate,
      earned,
      metadata:     data.metadata,
      notes:        data.notes ?? null,
    })
    .eq("id", sessionId)

  if (error) return { error: error.message }
  return {}
}

/**
 * Aggiorna lo stato di pagamento di una sessione.
 * Imposta paid_at automaticamente quando lo status diventa 'paid'.
 */
export async function updatePaymentStatus(
  sessionId: string,
  status: PaymentStatus,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("sessions")
    .update({
      payment_status: status,
      paid_at: status === "paid" ? new Date().toISOString() : null,
    })
    .eq("id", sessionId)
  if (error) return { error: error.message }
  return {}
}

/**
 * Elimina una sessione.
 */
export async function deleteSession(sessionId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("sessions")
    .delete()
    .eq("id", sessionId)
  if (error) return { error: error.message }
  return {}
}
