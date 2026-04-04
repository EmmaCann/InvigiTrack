"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { MapPin, Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { SessionDialog } from "@/components/sessions/session-dialog"
import { removeSession } from "@/app/actions/sessions"
import type { Session, Profile } from "@/types/database"

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

interface Props {
  selectedDay:  number | null
  year:         number
  month:        number           // 0-based
  sessions:     Session[]        // sessioni del giorno selezionato
  profile:      Profile
  lastSession?: Session
}

export function DayPanel({ selectedDay, year, month, sessions, profile, lastSession }: Props) {
  const router         = useRouter()
  const [, start]      = useTransition()
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const dateStr = selectedDay ? toDateStr(year, month, selectedDay) : null

  const selectedDate = selectedDay
    ? new Date(year, month, selectedDay).toLocaleDateString("it-IT", {
        weekday: "long", day: "numeric", month: "long",
      })
    : null

  function handleDelete(id: string) {
    setDeletingId(id)
    start(async () => {
      await removeSession(id)
      setDeletingId(null)
      setConfirmId(null)
      router.refresh()
    })
  }

  return (
    <div className="glass rounded-2xl p-4 h-fit min-h-[200px]">
      {!selectedDate ? (
        <div className="flex h-32 items-center justify-center">
          <p className="text-sm text-muted-foreground">Seleziona un giorno</p>
        </div>
      ) : (
        <>
          {/* Header giorno */}
          <div className="mb-4 flex items-start justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary mb-0.5">
                Giorno selezionato
              </p>
              <h4 className="text-sm font-bold capitalize text-foreground">{selectedDate}</h4>
            </div>
            {/* Bottone aggiungi sempre visibile */}
            {dateStr && (
              <SessionDialog
                profile={profile}
                lastSession={lastSession}
                defaultDate={dateStr}
                trigger={
                  <button className="flex cursor-pointer items-center gap-1 rounded-xl border border-primary/25 bg-primary/5 px-2.5 py-1.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/10">
                    <Plus className="h-3 w-3" />
                    Aggiungi
                  </button>
                }
              />
            )}
          </div>

          {sessions.length === 0 ? (
            /* CTA giorno vuoto */
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 py-8 text-center">
              <p className="text-sm text-muted-foreground">Nessuna sessione</p>
              {dateStr && (
                <SessionDialog
                  profile={profile}
                  lastSession={lastSession}
                  defaultDate={dateStr}
                  trigger={
                    <button className="mt-3 flex cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-colors hover:bg-primary/90">
                      <Plus className="h-3.5 w-3.5" />
                      Aggiungi sessione
                    </button>
                  }
                />
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              {sessions.map((s) => {
                const meta    = s.metadata as { exam_name?: string; role_type?: string }
                const isConf  = confirmId === s.id
                const isDel   = deletingId === s.id

                return (
                  <div key={s.id} className="group rounded-xl border border-white/50 bg-white/50 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={cn("h-2 w-2 mt-0.5 shrink-0 rounded-full", STATUS_DOT[s.payment_status])} />
                        <p className="text-sm font-semibold text-foreground leading-tight truncate">
                          {meta.exam_name ?? "Sessione"}
                        </p>
                      </div>
                      {/* Azioni */}
                      <div className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <SessionDialog profile={profile} session={s} />
                        <button
                          onClick={() => setConfirmId(s.id)}
                          className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
                      <p className="font-medium text-foreground/80">
                        {formatTime(s.start_time)} – {formatTime(s.end_time)}
                      </p>
                      {s.location && (
                        <p className="flex items-center gap-1">
                          <MapPin className="h-2.5 w-2.5" />
                          {s.location}
                        </p>
                      )}
                      <p className="text-[11px]">{STATUS_LABEL[s.payment_status]}</p>
                    </div>

                    {/* Confirm delete inline */}
                    {isConf && (
                      <div className="mt-2 flex items-center justify-end gap-2 border-t border-border/30 pt-2">
                        <button
                          onClick={() => setConfirmId(null)}
                          className="cursor-pointer text-[11px] text-muted-foreground hover:text-foreground"
                        >
                          Annulla
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          disabled={isDel}
                          className="cursor-pointer rounded-lg bg-destructive px-2.5 py-1 text-[11px] font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-60"
                        >
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
  )
}
