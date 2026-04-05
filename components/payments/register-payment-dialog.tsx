"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { X, AlertTriangle, CheckCircle2, Banknote, CreditCard, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { registerPayment } from "@/app/actions/payments"
import type { Session, PaymentMethod } from "@/types/database"

// --- Helpers ------------------------------------------------------------------

const METHOD_OPTIONS: { value: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { value: "bank_transfer", label: "Bonifico",  icon: CreditCard },
  { value: "cash",          label: "Contanti",  icon: Banknote   },
  { value: "other",         label: "Altro",     icon: HelpCircle },
]

function todayStr() {
  return new Date().toISOString().split("T")[0]
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("it-IT", {
    day: "numeric", month: "short",
  })
}

// --- Props --------------------------------------------------------------------

interface Props {
  sessions:  Session[]      // sessioni selezionate
  onClose:   () => void
  onSuccess: () => void
}

// --- Componente --------------------------------------------------------------

export function RegisterPaymentDialog({ sessions, onClose, onSuccess }: Props) {
  const router   = useRouter()
  const [, start] = useTransition()

  const expectedTotal = sessions.reduce((a, s) => a + s.earned, 0)

  const [date,      setDate]      = useState(todayStr())
  const [amount,    setAmount]    = useState(expectedTotal.toFixed(2))
  const [method,    setMethod]    = useState<PaymentMethod>("bank_transfer")
  const [reference, setReference] = useState("")
  const [notes,     setNotes]     = useState("")
  const [error,     setError]     = useState<string | null>(null)
  const [loading,   setLoading]   = useState(false)

  const amountNum  = parseFloat(amount) || 0
  const difference = Math.round((amountNum - expectedTotal) * 100) / 100
  const hasDiff    = Math.abs(difference) > 0.01

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!date || amountNum <= 0) { setError("Inserisci data e importo validi"); return }
    setLoading(true)
    setError(null)

    start(async () => {
      const result = await registerPayment(
        sessions.map((s) => s.id),
        { payment_date: date, amount: amountNum, method, reference: reference || undefined, notes: notes || undefined },
      )

      setLoading(false)
      if (result.error) { setError(result.error); return }
      router.refresh()
      onSuccess()
    })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[3px]"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/40 bg-white/80 shadow-2xl shadow-black/[0.18] backdrop-blur-2xl backdrop-saturate-[1.8]">

          {/* Header */}
          <div className="flex items-center justify-between border-b border-black/[0.07] px-6 py-4">
            <div>
              <h2 className="text-base font-bold text-foreground">Registra Pagamento</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {sessions.length} session{sessions.length > 1 ? "i" : "e"} · atteso €{expectedTotal.toFixed(2)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 space-y-5 overflow-y-auto px-6 py-5">

            {/* Data + Importo */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Data ricezione
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border/60 bg-white/70 px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary/60"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Importo ricevuto (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border/60 bg-white/70 px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary/60"
                />
                {hasDiff && (
                  <p className={`mt-1 flex items-center gap-1 text-[11px] font-medium ${difference > 0 ? "text-emerald-600" : "text-amber-600"}`}>
                    <AlertTriangle className="h-3 w-3" />
                    {difference > 0 ? "+" : ""}€{difference.toFixed(2)} rispetto al totale atteso
                  </p>
                )}
              </div>
            </div>

            {/* Metodo */}
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Metodo di pagamento
              </label>
              <div className="flex gap-2">
                {METHOD_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMethod(value)}
                    className={cn(
                      "flex flex-1 flex-col items-center gap-1.5 rounded-xl border py-3 text-[11px] font-semibold transition-all cursor-pointer",
                      method === value
                        ? "border-primary bg-primary/[0.08] text-primary"
                        : "border-border/50 bg-white/50 text-muted-foreground hover:border-primary/30 hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Riferimento */}
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Riferimento <span className="font-normal normal-case">(opzionale)</span>
              </label>
              <input
                type="text"
                placeholder="es. CRO bonifico, numero fattura…"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full rounded-xl border border-border/60 bg-white/70 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-primary/60"
              />
            </div>

            {/* Note */}
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Note <span className="font-normal normal-case">(opzionale)</span>
              </label>
              <textarea
                rows={2}
                placeholder="Note aggiuntive…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full resize-none rounded-xl border border-border/60 bg-white/70 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-primary/60"
              />
            </div>

            {/* Riepilogo sessioni */}
            <div className="rounded-xl border border-border/40 bg-muted/30 px-4 py-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Sessioni incluse
              </p>
              <div className="max-h-36 space-y-1.5 overflow-y-auto">
                {sessions.map((s) => {
                  const meta = s.metadata as { exam_name?: string }
                  return (
                    <div key={s.id} className="flex items-center justify-between text-xs">
                      <span className="text-foreground">{meta.exam_name ?? "Sessione"}</span>
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <span>{formatDate(s.session_date)}</span>
                        <span className="font-semibold text-foreground">€{s.earned.toFixed(2)}</span>
                      </span>
                    </div>
                  )
                })}
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-border/40 pt-2 text-xs font-bold">
                <span className="text-muted-foreground">Totale atteso</span>
                <span className="text-foreground">€{expectedTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Errore */}
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-xs text-destructive">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {error}
              </div>
            )}

            {/* Azioni */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer flex-1 rounded-xl border border-border/60 bg-white/70 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-all hover:bg-primary/90 disabled:opacity-60"
              >
                {loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Conferma pagamento
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
