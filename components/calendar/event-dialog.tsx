"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, X, CalendarDays, MapPin, AlignLeft, Clock } from "lucide-react"
import { createEvent, editEvent } from "@/app/actions/calendar-events"
import { useIsMobile } from "@/hooks/use-is-mobile"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import type { CalendarEvent } from "@/types/database"

// --- Helpers ------------------------------------------------------------------

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  )
}

const inputCls =
  "w-full rounded-xl border border-border/60 bg-white/70 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-primary/60"

// --- Props --------------------------------------------------------------------

interface Props {
  defaultDate?: string
  event?:       CalendarEvent
  trigger?:     React.ReactNode
}

// --- Componente --------------------------------------------------------------

export function EventDialog({ defaultDate, event, trigger }: Props) {
  const router   = useRouter()
  const isMobile = useIsMobile()
  const isEdit   = !!event

  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const [date,      setDate]      = useState(defaultDate ?? "")
  const [title,     setTitle]     = useState("")
  const [location,  setLocation]  = useState("")
  const [notes,     setNotes]     = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime,   setEndTime]   = useState("")

  useEffect(() => {
    if (open) {
      if (event) {
        setDate(event.event_date)
        setTitle(event.title)
        setLocation(event.location ?? "")
        setNotes(event.notes ?? "")
        setStartTime(event.start_time?.slice(0, 5) ?? "")
        setEndTime(event.end_time?.slice(0, 5) ?? "")
      } else {
        setDate(defaultDate ?? "")
        setTitle("")
        setLocation("")
        setNotes("")
        setStartTime("")
        setEndTime("")
      }
      setError(null)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!date || !title.trim()) { setError("Data e titolo sono obbligatori"); return }
    setLoading(true)
    setError(null)

    const data = {
      event_date: date,
      title:      title.trim(),
      location:   location  || undefined,
      notes:      notes     || undefined,
      start_time: startTime || undefined,
      end_time:   endTime   || undefined,
    }
    const result = isEdit ? await editEvent(event!.id, data) : await createEvent(data)

    setLoading(false)
    if (result.error) { setError(result.error); return }
    setOpen(false)
    router.refresh()
  }

  const defaultTrigger = isEdit ? (
    <button className="flex cursor-pointer h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary">
      <Pencil className="h-3 w-3" />
    </button>
  ) : (
    <button className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-colors hover:bg-primary/90">
      <Plus className="h-4 w-4" strokeWidth={2.5} />
      Nuovo Appuntamento
    </button>
  )

  const formContent = (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="space-y-4 px-6 py-5">

        <Field label="Data">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className={inputCls}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Inizio (opzionale)">
            <div className="relative">
              <Clock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={`${inputCls} pl-8`}
              />
            </div>
          </Field>
          <Field label="Fine (opzionale)">
            <div className="relative">
              <Clock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={`${inputCls} pl-8`}
              />
            </div>
          </Field>
        </div>

        <Field label="Titolo / Esame">
          <input
            type="text"
            placeholder="es. A-Level Physics, Cambridge IGCSE Math…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className={inputCls}
          />
        </Field>

        <Field label="Sede (opzionale)">
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
            <input
              type="text"
              placeholder="es. Westfield Academy"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={`${inputCls} pl-8`}
            />
          </div>
        </Field>

        <Field label="Note (opzionale)">
          <div className="relative">
            <AlignLeft className="pointer-events-none absolute left-3 top-3 h-3.5 w-3.5 text-muted-foreground/60" />
            <textarea
              rows={2}
              placeholder="Dettagli aggiuntivi…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`${inputCls} resize-none pl-8`}
            />
          </div>
        </Field>

        {error && (
          <p className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-1" style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="cursor-pointer flex-1 rounded-xl border border-border/60 bg-white/70 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Annulla
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex cursor-pointer flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 hover:bg-primary/90 disabled:opacity-60"
          >
            {loading
              ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              : isEdit ? "Salva" : "Crea Appuntamento"
            }
          </button>
        </div>
      </div>
    </form>
  )

  const dialogHeader = (
    <div className="flex items-center justify-between border-b border-black/[0.07] px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
          <CalendarDays className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-foreground">
            {isEdit ? "Modifica Appuntamento" : "Nuovo Appuntamento"}
          </h2>
          <p className="text-[11px] text-muted-foreground">
            {isEdit ? "Aggiorna i dettagli" : "Pianifica una sessione futura"}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="cursor-pointer rounded-lg p-1.5 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )

  // ── Mobile: Sheet dal basso ──────────────────────────────────────────────

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <div>{trigger ?? defaultTrigger}</div>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="flex flex-col gap-0 rounded-t-2xl p-0"
          style={{ height: "85dvh" }}
        >
          <SheetTitle className="sr-only">
            {isEdit ? "Modifica Appuntamento" : "Nuovo Appuntamento"}
          </SheetTitle>
          <div className="flex shrink-0 justify-center pt-3 pb-1">
            <div className="h-1 w-10 rounded-full bg-muted-foreground/25" />
          </div>
          {dialogHeader}
          {formContent}
        </SheetContent>
      </Sheet>
    )
  }

  // ── Desktop: overlay custom ───────────────────────────────────────────────

  return (
    <>
      <div onClick={() => setOpen(true)}>
        {trigger ?? defaultTrigger}
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[3px]" onClick={() => setOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/40 bg-white/80 shadow-2xl shadow-black/[0.18] backdrop-blur-2xl backdrop-saturate-[1.8]">
              {dialogHeader}
              {formContent}
            </div>
          </div>
        </>
      )}
    </>
  )
}
