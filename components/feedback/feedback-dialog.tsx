"use client"

import { useState } from "react"
import { MessageSquarePlus, X, CheckCircle2 } from "lucide-react"
import { sendFeedbackAction } from "@/app/actions/feedback"
import { cn } from "@/lib/utils"
import type { FeedbackType } from "@/types/database"

const TYPE_OPTIONS: { value: FeedbackType; label: string; emoji: string; sub: string }[] = [
  { value: "feature_request", label: "Nuova funzionalità", emoji: "💡", sub: "Hai un'idea da suggerire?" },
  { value: "bug_report",      label: "Segnala problema",   emoji: "🐛", sub: "Qualcosa non funziona?"   },
  { value: "suggestion",      label: "Altro",               emoji: "💬", sub: "Commenti generali"        },
]

export function FeedbackDialog() {
  const [open,    setOpen]    = useState(false)
  const [type,    setType]    = useState<FeedbackType>("feature_request")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  function handleClose() {
    setOpen(false)
    setTimeout(() => { setSuccess(false); setSubject(""); setMessage(""); setError(null) }, 300)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) return
    setLoading(true); setError(null)
    const res = await sendFeedbackAction({ type, subject: subject.trim(), message: message.trim() })
    setLoading(false)
    if (res.error) { setError(res.error); return }
    setSuccess(true)
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/40 hover:text-foreground"
      >
        <MessageSquarePlus className="h-4 w-4 shrink-0" />
        <span>Invia feedback</span>
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={handleClose}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-border/60 bg-white shadow-2xl">

            {/* Header */}
            <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-border/40">
              <div>
                <h2 className="text-base font-semibold text-foreground">Invia feedback</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Usiamo i tuoi messaggi per migliorare InvigiTrack.
                </p>
              </div>
              <button onClick={handleClose} className="rounded-lg p-1 text-muted-foreground hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            {success ? (
              /* Success state */
              <div className="flex flex-col items-center justify-center px-5 py-10 text-center">
                <CheckCircle2 className="mb-3 h-10 w-10 text-emerald-500" />
                <p className="text-sm font-semibold text-foreground">Grazie per il tuo feedback!</p>
                <p className="mt-1 text-xs text-muted-foreground">Lo leggeremo il prima possibile.</p>
                <button
                  onClick={handleClose}
                  className="mt-5 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  Chiudi
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">

                {/* Tipo */}
                <div>
                  <p className="mb-2 text-xs font-semibold text-foreground">Tipo</p>
                  <div className="grid grid-cols-3 gap-2">
                    {TYPE_OPTIONS.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setType(o.value)}
                        className={cn(
                          "flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-center text-xs transition-all",
                          type === o.value
                            ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                            : "border-border/50 bg-white/50 text-muted-foreground hover:border-border",
                        )}
                      >
                        <span className="text-lg leading-none">{o.emoji}</span>
                        <span className={cn("font-medium leading-snug", type === o.value ? "text-primary" : "text-foreground")}>
                          {o.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Oggetto */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground">
                    Oggetto
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    placeholder="Breve descrizione…"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    className="w-full rounded-xl border border-border bg-white/70 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>

                {/* Messaggio */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground">
                    Messaggio
                  </label>
                  <textarea
                    maxLength={1000}
                    placeholder="Descrivi nel dettaglio…"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={4}
                    className="w-full resize-none rounded-xl border border-border bg-white/70 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                  <p className="mt-0.5 text-right text-[10px] text-muted-foreground/50">{message.length}/1000</p>
                </div>

                {/* Nota */}
                <p className="rounded-xl bg-muted/50 px-3 py-2.5 text-[11px] text-muted-foreground">
                  Questo non è un canale di supporto urgente. Per problemi urgenti contatta direttamente lo sviluppatore.
                </p>

                {error && <p className="text-xs text-destructive">{error}</p>}

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-xl border border-border/60 px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !subject.trim() || !message.trim()}
                    className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {loading ? "Invio…" : "Invia"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
