"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Session } from "@/types/database"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_DOT: Record<string, string> = {
  unpaid:  "bg-amber-400",
  pending: "bg-blue-400",
  paid:    "bg-emerald-400",
}

function formatTime(t: string) { return t.slice(0, 5) }

const DAY_LABELS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"]

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  sessions: Session[]
}

export function CalendarView({ sessions }: Props) {
  const today = new Date()
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate())

  const year  = current.getFullYear()
  const month = current.getMonth()

  // Month label
  const monthLabel = current.toLocaleDateString("it-IT", { month: "long", year: "numeric" })

  // Sessions for current month
  const monthSessions = sessions.filter((s) => {
    const d = new Date(s.session_date + "T00:00:00")
    return d.getMonth() === month && d.getFullYear() === year
  })

  // Group by day number
  const byDay = new Map<number, Session[]>()
  for (const s of monthSessions) {
    const day = new Date(s.session_date + "T00:00:00").getDate()
    if (!byDay.has(day)) byDay.set(day, [])
    byDay.get(day)!.push(s)
  }

  // Build calendar grid (Mon-first)
  const firstDow  = (new Date(year, month, 1).getDay() + 6) % 7
  const daysCount = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysCount }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const isToday = (d: number) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  const selectedSessions = selectedDay ? (byDay.get(selectedDay) ?? []) : []
  const selectedDate = selectedDay
    ? new Date(year, month, selectedDay).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })
    : null

  function prev() { setCurrent(new Date(year, month - 1, 1)) }
  function next() { setCurrent(new Date(year, month + 1, 1)) }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">

      {/* ── Griglia calendario ───────────────────────────────────── */}
      <div className="glass rounded-2xl shadow-sm shadow-black/[0.04] overflow-hidden">

        {/* Header mese */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/40">
          <button
            onClick={prev}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/60 transition-colors text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h3 className="text-sm font-bold capitalize text-foreground">{monthLabel}</h3>
          <button
            onClick={next}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/60 transition-colors text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Intestazioni giorno */}
        <div className="grid grid-cols-7 border-b border-white/40">
          {DAY_LABELS.map((d) => (
            <div key={d} className="py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {d}
            </div>
          ))}
        </div>

        {/* Celle giorni */}
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const daySessions = day ? (byDay.get(day) ?? []) : []
            const active      = day !== null && day === selectedDay
            const todayCell   = day !== null && isToday(day)
            const isWeekend   = (i % 7) >= 5

            return (
              <button
                key={i}
                disabled={day === null}
                onClick={() => day && setSelectedDay(day)}
                className={cn(
                  "relative min-h-[72px] p-2 text-left transition-all border-b border-r border-white/30",
                  day === null  ? "bg-white/5 cursor-default"
                  : active      ? "bg-primary/10"
                  : isWeekend   ? "bg-white/20 hover:bg-white/40"
                  :               "hover:bg-white/40",
                  i % 7 === 6 && "border-r-0"
                )}
              >
                {day && (
                  <>
                    <span className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                      todayCell ? "bg-primary text-primary-foreground"
                      : active  ? "bg-primary/20 text-primary"
                      :           "text-foreground"
                    )}>
                      {day}
                    </span>

                    {/* Session dots / entries */}
                    <div className="mt-1 space-y-0.5">
                      {daySessions.slice(0, 2).map((s) => {
                        const meta = s.metadata as { exam_name?: string }
                        return (
                          <div
                            key={s.id}
                            className="flex items-center gap-1 rounded px-1 py-0.5 bg-primary/10"
                          >
                            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", STATUS_DOT[s.payment_status])} />
                            <span className="truncate text-[10px] font-medium text-primary/80">
                              {meta.exam_name ?? "Sessione"}
                            </span>
                          </div>
                        )
                      })}
                      {daySessions.length > 2 && (
                        <p className="text-[10px] text-muted-foreground px-1">
                          +{daySessions.length - 2} altri
                        </p>
                      )}
                    </div>
                  </>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Dettaglio giorno selezionato ─────────────────────────── */}
      <div className="glass rounded-2xl shadow-sm shadow-black/[0.04] p-4 h-fit">
        {selectedDate ? (
          <>
            <div className="mb-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary mb-0.5">
                Giorno selezionato
              </p>
              <h4 className="text-sm font-bold capitalize text-foreground">{selectedDate}</h4>
            </div>

            {selectedSessions.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">Nessuna sessione</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedSessions.map((s) => {
                  const meta = s.metadata as { exam_name?: string; role_type?: string }
                  return (
                    <div key={s.id} className="rounded-xl border border-white/50 bg-white/50 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground leading-tight">
                          {meta.exam_name ?? "Sessione"}
                        </p>
                        <span className={cn(
                          "h-2 w-2 mt-1 shrink-0 rounded-full",
                          STATUS_DOT[s.payment_status]
                        )} />
                      </div>
                      <div className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                        <p>{formatTime(s.start_time)} – {formatTime(s.end_time)}</p>
                        {s.location && (
                          <p className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {s.location}
                          </p>
                        )}
                        <p className="font-semibold text-foreground">£{s.earned.toFixed(2)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">Seleziona un giorno per vedere le sessioni</p>
          </div>
        )}
      </div>

    </div>
  )
}
