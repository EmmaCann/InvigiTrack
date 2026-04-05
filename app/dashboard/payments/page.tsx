/**
 * PAGINA PAGAMENTI — Server Component.
 * Fetcha sessioni non pagate e storico pagamenti, li passa al client.
 */

import { getCurrentUser }   from "@/lib/data/auth"
import { getProfileById }   from "@/lib/data/profiles"
import { getSessionsByUser } from "@/lib/data/sessions"
import { getPaymentsByUser } from "@/lib/data/payments"
import { getActiveWorkspace } from "@/lib/workspace"
import { PaymentList }      from "@/components/payments/payment-list"

export default async function PaymentsPage() {
  const user    = await getCurrentUser()
  const profile = user ? await getProfileById(user.id) : null

  if (!user || !profile) return null

  const { category } = await getActiveWorkspace(user.id)

  const [allSessions, payments] = await Promise.all([
    getSessionsByUser(user.id, category.id),
    getPaymentsByUser(user.id),
  ])

  // Sessioni non ancora pagate
  const unpaidSessions = allSessions.filter((s) => s.payment_status !== "paid")

  // Summary
  const summaryUnpaid = unpaidSessions.reduce((a, s) => a + s.earned, 0)
  const summaryPaidTotal = allSessions
    .filter((s) => s.payment_status === "paid")
    .reduce((a, s) => a + s.earned, 0)

  // Pagato questo mese (da storico payments)
  const thisMonth = new Date()
  const monthKey  = `${thisMonth.getFullYear()}-${String(thisMonth.getMonth() + 1).padStart(2, "0")}`
  const summaryPaidMonth = payments
    .filter((p) => p.payment_date.startsWith(monthKey))
    .reduce((a, p) => a + p.amount, 0)

  return (
    <div className="space-y-6">

      {/* -- Header --------------------------------------------------- */}
      <div className="flex items-start justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary">
            Gestione Pagamenti
          </p>
          <h2 className="text-2xl font-bold text-foreground">Pagamenti</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Seleziona le sessioni e registra i pagamenti ricevuti
          </p>
        </div>
      </div>

      {/* -- Lista ---------------------------------------------------- */}
      <PaymentList
        unpaidSessions={unpaidSessions}
        payments={payments}
        summaryUnpaid={Math.round(summaryUnpaid * 100) / 100}
        summaryPaidMonth={Math.round(summaryPaidMonth * 100) / 100}
        summaryPaidTotal={Math.round(summaryPaidTotal * 100) / 100}
      />

    </div>
  )
}
