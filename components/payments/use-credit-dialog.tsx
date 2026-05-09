"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { X, AlertTriangle, CheckCircle2, CheckSquare, Square, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import { applyPrepaidCredit } from "@/app/actions/payments"
import { useIsMobile } from "@/hooks/use-is-mobile"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import type { PaymentWithSessions, Session } from "@/types/database"

// --- Helpers ------------------------------------------------------------------

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("it-IT", {
    day: "numeric", month: "short", year: "numeric",
  })
}

function getSessionLabel(s: Session): string {
  const meta = s.metadata as { exam_name?: string; student_name?: string; client_name?: string }
  return meta.exam_name ?? meta.student_name ?? meta.client_name ?? "Sessione"
}

// --- Props --------------------------------------------------------------------

interface Props {
  payment:        PaymentWithSessions
  unpaidSessions: Session[]
  onClose:        () => void
  onSuccess:      () => void
}

// --- Componente --------------------------------------------------------------

export function UseCreditDialog({ payment, unpaidSessions, onClose, onSuccess }: Props) {
  const router    = useRouter()
  const isMobile  = useIsMobile()
  const [, start] = useTransition()

  // Escludi sessioni già collegate a questo pagamento
  const linkedIds  = new Set(payment.sessions.map((s) => s.id))
  const candidates = unpaidSessions.filter((s) => !linkedIds.has(s.id))

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [error,    setError]    = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectedTotal   = candidates
    .filter((s) => selected.has(s.id))
    .reduce((sum, s) => sum + s.earned, 0)

  const remaining       = Math.round((payment.prepaid_remaining - selectedTotal) * 100) / 100
  const overCredit      = remaining < -0.01

  async function handleConfirm() {
    if (selected.size === 0) { setError("Seleziona almeno una sessione"); return }
    setLoading(true)
    setError(null)

    start(async () => {
      const result = await applyPrepaidCredit(payment.id, Array.from(selected))
      if (result.error) {
        setLoading(false)
        setError(result.error)
        return
      }
      // Chiudi subito il dialog — router.refresh() aggiorna la pagina in background
      onSuccess()
      router.refresh()
    })
  }

  const header = (
    <div className="flex items-center justify-between border-b border-black/[0.07] px-6 py-4">
      <div>
        <h2 className="text-base font-bold text-foreground">Usa credito anticipato</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Credito disponibile:{" "}
          <span className="font-semibold text-teal-700">€{payment.prepaid_remaining.toFixed(2)}</span>
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )

  const body = (
    <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">

      {/* Lista sessioni non pagate */}
      {candidates.length === 0 ? (
        <div className="rounded-xl border border-border/40 bg-muted/30 px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            Nessuna sessione non pagata disponibile.
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Crea nuove sessioni e torna qui per applicare il credito.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Sessioni non pagate
          </p>
          {candidates.map((s) => {
            const isSelected = selected.has(s.id)
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggle(s.id)}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all",
                  isSelected
                    ? "border-teal-400/50 bg-teal-50/70 ring-1 ring-teal-300/40"
                    : "border-border/40 bg-white/60 hover:border-teal-300/40 hover:bg-teal-50/30",
                )}
              >
                {isSelected
                  ? <CheckSquare className="h-4 w-4 shrink-0 text-teal-600" />
                  : <Square      className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                }
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{getSessionLabel(s)}</p>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span>{formatDate(s.session_date)}</span>
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
                <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                  €{s.earned.toFixed(2)}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Riepilogo credito */}
      {candidates.length > 0 && (
        <div className="rounded-xl border border-teal-200/60 bg-teal-50/50 px-4 py-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Sessioni selezionate</span>
            <span className="font-semibold text-foreground">€{selectedTotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Credito disponibile</span>
            <span className="font-semibold text-teal-700">€{payment.prepaid_remaining.toFixed(2)}</span>
          </div>
          <div className="border-t border-teal-200/60 pt-1.5 flex items-center justify-between text-xs font-bold">
            <span className={overCredit ? "text-amber-700" : "text-foreground"}>Credito rimanente</span>
            <span className={overCredit ? "text-amber-700" : "text-teal-700"}>
              €{remaining.toFixed(2)}
            </span>
          </div>
          {overCredit && (
            <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-2 text-[11px] text-amber-700">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              Le sessioni selezionate superano il credito disponibile. Puoi comunque confermare.
            </div>
          )}
        </div>
      )}

      {/* Errore */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-xs text-destructive">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Azioni */}
      <div className="flex gap-3 pt-1" style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer flex-1 rounded-xl border border-border/60 bg-white/70 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Annulla
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading || selected.size === 0}
          className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-teal-600/25 transition-all hover:bg-teal-700 disabled:opacity-60"
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          Conferma
        </button>
      </div>
    </div>
  )

  // ── Mobile: Sheet dal basso ──────────────────────────────────────────────

  if (isMobile) {
    return (
      <Sheet open onOpenChange={(o) => !o && onClose()}>
        <SheetContent
          side="bottom"
          className="flex flex-col gap-0 rounded-t-2xl p-0"
          style={{ height: "92dvh" }}
        >
          <SheetTitle className="sr-only">Usa credito anticipato</SheetTitle>
          <div className="flex shrink-0 justify-center pt-3 pb-1">
            <div className="h-1 w-10 rounded-full bg-muted-foreground/25" />
          </div>
          {header}
          {body}
        </SheetContent>
      </Sheet>
    )
  }

  // ── Desktop: overlay custom ───────────────────────────────────────────────

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[3px]" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/40 bg-white/80 shadow-2xl shadow-black/[0.18] backdrop-blur-2xl backdrop-saturate-[1.8]">
          {header}
          {body}
        </div>
      </div>
    </>
  )
}
