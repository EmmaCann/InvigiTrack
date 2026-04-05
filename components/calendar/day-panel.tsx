"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { MapPin, Plus, Trash2, CheckCircle2, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { EventDialog }        from "./event-dialog"
import { ConvertEventDialog } from "./convert-event-dialog"
import { SessionDialog }      from "@/components/sessions/session-dialog"
import { removeSession }      from "@/app/actions/sessions"
import { removeEvent }        from "@/app/actions/calendar-events"
import type { Session, CalendarEvent, Profile } from "@/types/database"

const STATUS_DOT: Record<string, string> = {
  unpaid:  "bg-amber-400",
  pending: "bg-blue-400",
  paid:    "bg-emerald-400",
}

const STATUS_LABEL: Record<string, string> = {
  unpaid:  "Non pagato",
  pending: "In attesa",
  paid:    "Pagato",
}

function formatTime(t: string) { return t.slice(0, 5) }

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

function isPast(dateStr: string): boolean {
  return dateStr <= new Date().toISOString().split("T")[0]
}

// isPast is kept for use in the event conversion CTA

interface Props {
  selectedDay:  number | null
  year:         number
  month:        number
  sessions:     Session[]
  events:       CalendarEvent[]
  profile:      Profile
  lastSession?: Session
}

export function DayPanel({ selectedDay, year, month, sessions, events, profile, lastSession }: Props) {
  const router    = useRouter()
  const [, start] = useTransition()

  const [confirmSessionId, setConfirmSessionId] = useState<string | null>(null)
  const [confirmEventId,   setConfirmEventId]   = useState<string | null>(null)
  const [deletingId,       setDeletingId]       = useState<string | null>(null)
  const [convertEvent,     setConvertEvent]     = useState<CalendarEvent | null>(null)

  const dateStr = selectedDay ? toDateStr(year, month, selectedDay) : null

  const selectedDate = selectedDay
    ? new Date(year, month, selectedDay).toLocaleDateString("it-IT", {
        weekday: "long", day: "numeric", month: "long",
      })
    : null

  function handleDeleteSession(id: string) {
    setDeletingId(id)
    start(async () => {
      await removeSession(id)
      setDeletingId(null)
      setConfirmSessionId(null)
      router.refresh()
    })
  }

  function handleDeleteEvent(id: string) {
    setDeletingId(id)
    start(async () => {
      await removeEvent(id)
      setDeletingId(null)
      setConfirmEventId(null)
      router.refresh()
    })
  }

  const hasContent = sessions.length > 0 || events.length > 0

  return (
    <>
      <div className="glass rounded-2xl p-4 h-fit min-h-[200px]">
        {!selectedDate ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-sm text-muted-foreground">Seleziona un giorno</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary mb-0.5">
                Giorno selezionato
              </p>
              <h4 className="text-sm font-bold capitalize text-foreground">{selectedDate}</h4>
            </div>

            {!hasContent ? (
              /* CTA giorno vuoto */
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 py-8 text-center gap-3">
                <p className="text-sm text-muted-foreground">Nessuna sessione o evento</p>
                {dateStr && (
                  <EventDialog
                    defaultDate={dateStr}
                    trigger={
                      <button className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary/90">
                        <Plus className="h-3.5 w-3.5" />
                        Nuovo Evento
                      </button>
                    }
                  />
                )}
              </div>
            ) : (
              <div className="space-y-2.5">

                {/* ── Sessioni lavorative ────────────────────────────── */}
                {sessions.map((s) => {
                  const meta   = s.metadata as { exam_name?: string }
                  const isConf = confirmSessionId === s.id
                  const isDel  = deletingId === s.id

                  return (
                    <div key={s.id} className="group rounded-xl border border-white/50 bg-white/50 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={cn("h-2 w-2 mt-0.5 shrink-0 rounded-full", STATUS_DOT[s.payment_status])} />
                          <p className="text-sm font-semibold text-foreground leading-tight truncate">
                            {meta.exam_name ?? "Sessione"}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <SessionDialog profile={profile} session={s} />
                          <button
                            onClick={() => setConfirmSessionId(s.id)}
                            className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
                        <p className="font-medium text-foreground/80 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(s.start_time)} – {formatTime(s.end_time)}
                        </p>
                        {s.location && (
                          <p className="flex items-center gap-1">
                            <MapPin className="h-2.5 w-2.5" />
                            {s.location}
                          </p>
                        )}
                        <p className="text-[11px]">{STATUS_LABEL[s.payment_status]} · €{s.earned.toFixed(2)}</p>
                      </div>
                      {isConf && (
                        <div className="mt-2 flex items-center justify-end gap-2 border-t border-border/30 pt-2">
                          <button onClick={() => setConfirmSessionId(null)} className="cursor-pointer text-[11px] text-muted-foreground hover:text-foreground">Annulla</button>
                          <button onClick={() => handleDeleteSession(s.id)} disabled={isDel} className="cursor-pointer rounded-lg bg-destructive px-2.5 py-1 text-[11px] font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-60">
                            {isDel ? "…" : "Elimina"}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* ── Eventi calendario ────────────────────────── */}
                {events.map((ev) => {
                  const isConf    = confirmEventId === ev.id
                  const isDel     = deletingId === ev.id
                  const isPastDay = isPast(ev.event_date)

                  return (
                    <div key={ev.id} className={cn(
                      "group rounded-xl border p-3",
                      ev.is_converted
                        ? "border-teal-200/60 bg-teal-50/40"
                        : "border-primary/20 bg-primary/[0.04]",
                    )}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {ev.is_converted
                            ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-teal-500" />
                            : <span className="h-2 w-2 shrink-0 rounded-full bg-primary/50 mt-0.5" />
                          }
                          <p className="text-sm font-semibold text-foreground leading-tight truncate">
                            {ev.title}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!ev.is_converted && (
                            <EventDialog event={ev} />
                          )}
                          <button
                            onClick={() => setConfirmEventId(ev.id)}
                            className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      {ev.location && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-2.5 w-2.5" />
                          {ev.location}
                        </p>
                      )}

                      {/* CTA conversione: solo se passato e non ancora convertito */}
                      {isPastDay && !ev.is_converted && (
                        <button
                          onClick={() => setConvertEvent(ev)}
                          className="mt-2.5 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm shadow-emerald-600/20 transition-colors hover:bg-emerald-700"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Registra ore → crea sessione
                        </button>
                      )}

                      {ev.is_converted && (
                        <p className="mt-1.5 text-[11px] font-medium text-teal-600">✓ Sessione registrata</p>
                      )}

                      {isConf && (
                        <div className="mt-2 flex items-center justify-end gap-2 border-t border-border/30 pt-2">
                          <button onClick={() => setConfirmEventId(null)} className="cursor-pointer text-[11px] text-muted-foreground hover:text-foreground">Annulla</button>
                          <button onClick={() => handleDeleteEvent(ev.id)} disabled={isDel} className="cursor-pointer rounded-lg bg-destructive px-2.5 py-1 text-[11px] font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-60">
                            {isDel ? "…" : "Elimina"}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal conversione evento → sessione */}
      {convertEvent && (
        <ConvertEventDialog
          event={convertEvent}
          profile={profile}
          onClose={() => setConvertEvent(null)}
        />
      )}
    </>
  )
}
