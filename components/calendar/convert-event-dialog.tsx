"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Clock, PoundSterling, X, Sparkles } from "lucide-react"
import { convertEventToSession } from "@/app/actions/calendar-events"
import type { CalendarEvent, Profile, InvigilationRole } from "@/types/database"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcPreview(start: string, end: string, rate: number) {
  const [sh, sm] = start.split(":").map(Number)
  const [eh, em] = end.split(":").map(Number)
  const mins = eh * 60 + em - (sh * 60 + sm)
  if (isNaN(mins) || mins <= 0) return null
  const hours   = Math.floor(mins / 60)
  const minutes = mins % 60
  const earned  = Math.round((mins / 60) * rate * 100) / 100
  const duration = hours > 0
    ? `${hours}h${minutes > 0 ? ` ${minutes}min` : ""}`
    : `${minutes}min`
  return { duration, earned }
}

const inputCls =
  "w-full rounded-xl border border-border/60 bg-white/70 px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary/60"

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  event:   CalendarEvent
  profile: Profile
  onClose: () => void
}

// ─── Componente ──────────────────────────────────────────────────────────────

export function ConvertEventDialog({ event, profile, onClose }: Props) {
  const router = useRouter()

  const [startTime,  setStartTime]  = useState("")
  const [endTime,    setEndTime]    = useState("")
  const [rate,       setRate]       = useState(profile.default_hourly_rate)
  const [roleType,   setRoleType]   = useState<InvigilationRole>(profile.role_type ?? "invigilator")
  const [notes,      setNotes]      = useState(event.notes ?? "")
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const preview = calcPreview(startTime, endTime, rate)

  const dateLabel = new Date(event.event_date + "T00:00:00").toLocaleDateString("it-IT", {
    weekday: "long", day: "numeric", month: "long",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!startTime || !endTime) { setError("Inserisci orario di inizio e fine"); return }
    if (!preview) { setError("L'orario di fine deve essere dopo l'inizio"); return }
    setLoading(true)
    setError(null)

    const result = await convertEventToSession(event.id, {
      start_time:  startTime,
      end_time:    endTime,
      hourly_rate: rate,
      role_type:   roleType,
      notes:       notes || undefined,
      title:       event.title,
      location:    event.location ?? undefined,
      event_date:  event.event_date,
    })

    setLoading(false)
    if (result.error) { setError(result.error); return }
    router.refresh()
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[3px]" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative flex max-h-[90dvh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/40 bg-white/80 shadow-2xl shadow-black/[0.18] backdrop-blur-2xl backdrop-saturate-[1.8]">

          {/* Header */}
          <div className="flex items-start justify-between border-b border-black/[0.07] px-6 py-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <h2 className="text-sm font-bold text-foreground">Registra ore sessione</h2>
              </div>
              <p className="text-xs font-medium text-foreground capitalize">{event.title}</p>
              <p className="text-[11px] text-muted-foreground capitalize">{dateLabel}{event.location ? ` · ${event.location}` : ""}</p>
            </div>
            <button onClick={onClose} className="cursor-pointer rounded-lg p-1.5 text-muted-foreground hover:bg-muted/60">
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto px-6 py-5">

            {/* Preview live */}
            <div className={`rounded-2xl border px-4 py-3 transition-all ${
              preview
                ? "border-emerald-200/80 bg-emerald-50/50"
                : "border-primary/15 bg-primary/[0.04]"
            }`}>
              {preview ? (
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Durata</p>
                      <p className="text-base font-bold text-foreground">{preview.duration}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <PoundSterling className="h-4 w-4 text-emerald-600" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Stimato</p>
                      <p className="text-base font-bold text-emerald-700">£{preview.earned.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="ml-auto flex items-center gap-1 rounded-full bg-emerald-100/80 px-2.5 py-1 text-[10px] font-semibold text-emerald-800">
                    <Sparkles className="h-3 w-3" />
                    Live
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Imposta <span className="font-medium text-foreground">inizio</span> e{" "}
                  <span className="font-medium text-foreground">fine</span> per calcolare il guadagno
                </p>
              )}
            </div>

            {/* Orari */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Inizio</label>
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required className={inputCls} />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Fine</label>
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required className={inputCls} />
              </div>
            </div>

            {/* Tariffa + Ruolo */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Tariffa (£/h)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">£</span>
                  <input
                    type="number" step="0.01" min="0"
                    value={rate}
                    onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                    className={`${inputCls} pl-7`}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Ruolo</label>
                <select
                  value={roleType}
                  onChange={(e) => setRoleType(e.target.value as InvigilationRole)}
                  className={`${inputCls} cursor-pointer appearance-none`}
                >
                  <option value="invigilator">Invigilator</option>
                  <option value="supervisor">Supervisor</option>
                </select>
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Note (opzionale)</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Note aggiuntive…"
                className={`${inputCls} resize-none`}
              />
            </div>

            {error && (
              <p className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">{error}</p>
            )}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="cursor-pointer flex-1 rounded-xl border border-border/60 bg-white/70 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground">
                Annulla
              </button>
              <button type="submit" disabled={loading} className="flex cursor-pointer flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/25 hover:bg-emerald-700 disabled:opacity-60">
                {loading
                  ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  : <><CheckCircle2 className="h-4 w-4" /> Conferma sessione</>
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
