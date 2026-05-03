/**
 * DAL — Payments
 * Query sulle tabelle `payments` e `payment_sessions`.
 */

import { createClient } from "@/lib/supabase/server"
import type { Payment, PaymentMethod, PaymentWithSessions, Session } from "@/types/database"

// --- READ ---------------------------------------------------------------------

/**
 * Tutti i pagamenti di un utente, dal più recente.
 * Include le sessioni collegate via join.
 */
export async function getPaymentsByUser(userId: string): Promise<PaymentWithSessions[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("payments")
    .select("*, payment_sessions(session_id, sessions(*))")
    .eq("user_id", userId)
    .order("payment_date", { ascending: false })
    .order("created_at", { ascending: false })

  if (error || !data) return []

  return data.map((p) => ({
    id:                p.id,
    user_id:           p.user_id,
    payment_date:      p.payment_date,
    amount:            p.amount,
    method:            p.method as PaymentMethod,
    reference:         p.reference,
    notes:             p.notes,
    prepaid_amount:    p.prepaid_amount    ?? 0,
    prepaid_remaining: p.prepaid_remaining ?? 0,
    created_at:        p.created_at,
    sessions:          (p.payment_sessions ?? [])
      .map((ps: { sessions: Session }) => ps.sessions)
      .filter(Boolean) as Session[],
  }))
}

// --- WRITE --------------------------------------------------------------------

/**
 * Crea un pagamento e lo collega alle sessioni indicate.
 * Aggiorna anche payment_status = 'paid' su tutte le sessioni.
 * Accetta un importo anticipo opzionale per sessioni future.
 */
export async function createPayment(
  userId: string,
  sessionIds: string[],
  data: {
    payment_date:    string
    amount:          number
    method:          PaymentMethod
    reference?:      string
    notes?:          string
    prepaid_amount?: number
  },
): Promise<{ error?: string; payment?: Payment }> {
  const supabase = await createClient()

  const prepaidAmt = data.prepaid_amount ?? 0

  // 1. Inserisci il record di pagamento
  const { data: payment, error: payErr } = await supabase
    .from("payments")
    .insert({
      user_id:           userId,
      payment_date:      data.payment_date,
      amount:            data.amount,
      method:            data.method,
      reference:         data.reference  ?? null,
      notes:             data.notes      ?? null,
      prepaid_amount:    prepaidAmt,
      prepaid_remaining: prepaidAmt,
    })
    .select()
    .single<Payment>()

  if (payErr || !payment) return { error: payErr?.message ?? "Errore nella creazione del pagamento" }

  // 2. Collega le sessioni al pagamento
  if (sessionIds.length > 0) {
    const junctions = sessionIds.map((sid) => ({
      payment_id: payment.id,
      session_id: sid,
    }))

    const { error: jErr } = await supabase
      .from("payment_sessions")
      .insert(junctions)

    if (jErr) return { error: jErr.message }

    // 3. Marca le sessioni come "paid"
    const paidAt = new Date().toISOString()
    const { error: sErr } = await supabase
      .from("sessions")
      .update({ payment_status: "paid", paid_at: paidAt })
      .in("id", sessionIds)

    if (sErr) return { error: sErr.message }
  }

  return { payment }
}

/**
 * Usa il credito anticipato di un pagamento per coprire sessioni future.
 * Collega le sessioni al pagamento originale, le marca come "paid" e
 * decrementa prepaid_remaining.
 */
export async function usePrepaidCredit(
  paymentId: string,
  sessionIds: string[],
  userId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()

  if (sessionIds.length === 0) return { error: "Nessuna sessione selezionata" }

  // 1. Recupera le sessioni per sommare gli earned
  const { data: sessions, error: sErr } = await supabase
    .from("sessions")
    .select("id, earned")
    .in("id", sessionIds)
    .eq("user_id", userId)

  if (sErr || !sessions) return { error: sErr?.message ?? "Sessioni non trovate" }

  const totalEarned = sessions.reduce((sum: number, s: { earned: number }) => sum + s.earned, 0)

  // 2. Inserisci le junction payment_sessions
  const junctions = sessionIds.map((sid) => ({
    payment_id: paymentId,
    session_id: sid,
  }))

  const { error: jErr } = await supabase
    .from("payment_sessions")
    .insert(junctions)

  if (jErr) return { error: jErr.message }

  // 3. Marca le sessioni come pagate
  const paidAt = new Date().toISOString()
  const { error: updErr } = await supabase
    .from("sessions")
    .update({ payment_status: "paid", paid_at: paidAt })
    .in("id", sessionIds)

  if (updErr) return { error: updErr.message }

  // 4. Decrementa prepaid_remaining (non scende sotto zero)
  const { data: currentPayment, error: pErr } = await supabase
    .from("payments")
    .select("prepaid_remaining")
    .eq("id", paymentId)
    .single()

  if (pErr || !currentPayment) return { error: pErr?.message ?? "Pagamento non trovato" }

  const newRemaining = Math.max(0, (currentPayment.prepaid_remaining ?? 0) - totalEarned)

  const { error: decErr } = await supabase
    .from("payments")
    .update({ prepaid_remaining: newRemaining })
    .eq("id", paymentId)

  if (decErr) return { error: decErr.message }

  return {}
}

/**
 * Elimina un pagamento e rimette le sessioni collegate a "unpaid".
 */
export async function deletePayment(paymentId: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  // 1. Trova le sessioni collegate PRIMA di eliminare (CASCADE le rimuove)
  const { data: junctions } = await supabase
    .from("payment_sessions")
    .select("session_id")
    .eq("payment_id", paymentId)

  const sessionIds = (junctions ?? []).map((j: { session_id: string }) => j.session_id)

  // 2. Elimina il pagamento (payment_sessions eliminato in CASCADE)
  const { error } = await supabase
    .from("payments")
    .delete()
    .eq("id", paymentId)

  if (error) return { error: error.message }

  // 3. Rimetti le sessioni a "unpaid"
  if (sessionIds.length > 0) {
    await supabase
      .from("sessions")
      .update({ payment_status: "unpaid", paid_at: null })
      .in("id", sessionIds)
  }

  return {}
}
