"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  Banknote,
  CreditCard,
  HelpCircle,
  MapPin,
  Wallet,
} from "lucide-react"
import { removePayment } from "@/app/actions/payments"
import type { PaymentWithSessions } from "@/types/database"

// --- Helpers ------------------------------------------------------------------

const METHOD_LABEL: Record<string, string> = {
  bank_transfer: "Bonifico",
  cash:          "Contanti",
  other:         "Altro",
}

const METHOD_ICON: Record<string, React.ElementType> = {
  bank_transfer: CreditCard,
  cash:          Banknote,
  other:         HelpCircle,
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("it-IT", {
    day: "numeric", month: "long", year: "numeric",
  })
}

function formatDateShort(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("it-IT", {
    day: "numeric", month: "short",
  })
}

// --- Props --------------------------------------------------------------------

interface Props {
  payment:           PaymentWithSessions
  onUseCreditClick?: () => void
}

// --- Componente --------------------------------------------------------------

export function PaymentHistoryCard({ payment, onUseCreditClick }: Props) {
  const router         = useRouter()
  const [, start]      = useTransition()
  const [open,    setOpen]    = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const Icon            = METHOD_ICON[payment.method] ?? HelpCircle
  const hasCredit       = payment.prepaid_remaining > 0.01
  const creditFormatted = `€${payment.prepaid_remaining.toFixed(2)}`

  function handleDelete() {
    setLoading(true)
    start(async () => {
      await removePayment(payment.id)
      setLoading(false)
      setConfirm(false)
      router.refresh()
    })
  }

  return (
    <div className="overflow-hidden rounded-2xl glass-dashboard ring-1 ring-white/60 transition-shadow hover:shadow-md hover:shadow-primary/[0.06]">

      {/* Header della card */}
      <div className="flex items-center gap-4 px-5 py-4">

        {/* Icona metodo */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/40 bg-white/60">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Info principale */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <p className="text-sm font-semibold text-foreground">{formatDate(payment.payment_date)}</p>
            <span className="rounded-full border border-border/40 bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {METHOD_LABEL[payment.method]}
            </span>
            {payment.reference && (
              <span className="text-[11px] text-muted-foreground">· {payment.reference}</span>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <p className="text-xs text-muted-foreground">
              {payment.sessions.length} session{payment.sessions.length !== 1 ? "i" : "e"} coperte
            </p>
            {/* Badge credito — sempre visibile se presente */}
            {hasCredit && (
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
                <Wallet className="h-2.5 w-2.5" />
                {creditFormatted} anticipo
              </span>
            )}
          </div>
        </div>

        {/* Importo */}
        <p className="shrink-0 text-xl font-bold tabular-nums text-foreground">
          €{payment.amount.toFixed(2)}
        </p>

        {/* Espandi */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="cursor-pointer flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
        >
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Pannello espanso */}
      {open && (
        <div className="border-t border-black/[0.06] px-5 pb-4 pt-3">

          {/* Sessioni collegate */}
          {payment.sessions.length > 0 && (
            <div className="mb-4 space-y-2">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Sessioni incluse
              </p>
              {payment.sessions.map((s) => {
                const meta = s.metadata as { exam_name?: string; student_name?: string; client_name?: string }
                const label = meta.exam_name ?? meta.student_name ?? meta.client_name ?? "Sessione"
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-xl border border-border/40 bg-white/50 px-3.5 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{label}</p>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span>{formatDateShort(s.session_date)}</span>
                        {s.location && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-0.5">
                              <MapPin className="h-2.5 w-2.5" />
                              {s.location}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      €{s.earned.toFixed(2)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Sezione credito anticipato */}
          {hasCredit && (
            <div className="mb-4 rounded-xl border border-teal-200/60 bg-teal-50/60 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-teal-800">Credito anticipato disponibile</p>
                  <p className="mt-0.5 text-xl font-bold tabular-nums text-teal-700">{creditFormatted}</p>
                  <p className="mt-0.5 text-[11px] text-teal-600/80">
                    Usalo per saldare sessioni future già pagate in anticipo.
                  </p>
                </div>
                {onUseCreditClick && (
                  <button
                    type="button"
                    onClick={onUseCreditClick}
                    className="flex shrink-0 items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-teal-700"
                  >
                    <Wallet className="h-3.5 w-3.5" />
                    Usa credito
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Note */}
          {payment.notes && (
            <p className="mb-4 text-xs italic text-muted-foreground">{payment.notes}</p>
          )}

          {/* Elimina */}
          <div className="flex items-center justify-end gap-2">
            {confirm ? (
              <>
                <p className="text-xs text-muted-foreground">
                  Le sessioni torneranno a "Non pagato"
                </p>
                <button
                  onClick={() => setConfirm(false)}
                  className="cursor-pointer rounded-lg border border-border/50 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  Annulla
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="cursor-pointer rounded-lg bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-60"
                >
                  {loading ? "…" : "Conferma eliminazione"}
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirm(true)}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border/50 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Elimina pagamento
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
