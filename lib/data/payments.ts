/**
 * DAL — Payments
 * Query sulle tabelle `payments` e `payment_sessions`.
 */

import { createClient }      from "@/lib/supabase/server"
import { createAdminClient }  from "@/lib/supabase/admin"
import type { Payment, PaymentMethod, PaymentWithSessions, Session } from "@/types/database"

// --- READ ---------------------------------------------------------------------

/**
 * Tutti i pagamenti di un utente, dal più recente.
 * Include le sessioni collegate via join.
 * Se workspaceId è specificato, filtra per workspace — i pagamenti sono isolati per workspace.
 */
export async function getPaymentsByUser(
  userId: string,
  workspaceId?: string,
): Promise<PaymentWithSessions[]> {
  const supabase = await createClient()

  let query = supabase
    .from("payments")
    .select("*, payment_sessions(session_id, sessions(*))")
    .eq("user_id", userId)

  if (workspaceId) query = query.eq("workspace_id", workspaceId)

  const { data, error } = await query
    .order("payment_date", { ascending: false })
    .order("created_at", { ascending: false })

  if (error || !data) return []

  return data.map((p) => ({
    id:                p.id,
    user_id:           p.user_id,
    workspace_id:      p.workspace_id ?? null,
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
    workspace_id?:   string
  },
): Promise<{ error?: string; payment?: Payment }> {
  const supabase = await createClient()

  const prepaidAmt = data.prepaid_amount ?? 0

  // 1. Inserisci il record di pagamento
  const { data: payment, error: payErr } = await supabase
    .from("payments")
    .insert({
      user_id:           userId,
      workspace_id:      data.workspace_id ?? null,
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

  const admin = createAdminClient()
  if (!admin) return { error: "Configurazione server mancante (service role key)" }

  const paidAt   = new Date().toISOString()
  const junctions = sessionIds.map((sid) => ({ payment_id: paymentId, session_id: sid }))

  // Stage 1 — tutto in parallelo: fetch earned, insert junctions, mark paid, leggi remaining
  // Nessuna di queste 4 dipende dalle altre.
  const [sessionsRes, jRes, updRes, paymentRes] = await Promise.all([
    supabase
      .from("sessions")
      .select("id, earned")
      .in("id", sessionIds)
      .eq("user_id", userId),
    supabase
      .from("payment_sessions")
      .insert(junctions),
    supabase
      .from("sessions")
      .update({ payment_status: "paid", paid_at: paidAt })
      .in("id", sessionIds),
    admin
      .from("payments")
      .select("prepaid_remaining")
      .eq("id", paymentId)
      .eq("user_id", userId)   // verifica proprietà
      .single(),
  ])

  if (sessionsRes.error || !sessionsRes.data) return { error: sessionsRes.error?.message ?? "Sessioni non trovate" }
  if (jRes.error)                             return { error: jRes.error.message }
  if (updRes.error)                           return { error: updRes.error.message }
  if (paymentRes.error || !paymentRes.data)   return { error: paymentRes.error?.message ?? "Pagamento non trovato" }

  const totalEarned  = sessionsRes.data.reduce((sum: number, s: { earned: number }) => sum + s.earned, 0)
  const newRemaining = Math.max(0, (paymentRes.data.prepaid_remaining ?? 0) - totalEarned)

  // Stage 2 — update remaining (dipende da stage 1)
  const { error: decErr } = await admin
    .from("payments")
    .update({ prepaid_remaining: newRemaining })
    .eq("id", paymentId)
    .eq("user_id", userId)   // verifica proprietà anche in scrittura

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
