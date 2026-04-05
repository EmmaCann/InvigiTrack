"use client"

import { useRef } from "react"
import { cn } from "@/lib/utils"
import type { Session } from "@/types/database"

// ─── Config ──────────────────────────────────────────────────────────────────

const DAY_START = 6   // 06:00
const DAY_END   = 23  // 23:00
const TOTAL_MINS = (DAY_END - DAY_START) * 60

const STATUS_COLOR: Record<string, string> = {
  unpaid:  "bg-amber-400/20  border-amber-400  text-amber-800",
  pending: "bg-blue-400/20   border-blue-400   text-blue-800",
  paid:    "bg-emerald-400/20 border-emerald-400 text-emerald-800",
}

const DAY_LABELS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"]

function toMins(t: string): number {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

function formatTime(t: string) { return t.slice(0, 5) }

// Lunedì della settimana contenente `date` (ISO Mon-first)
function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const dow = (d.getDay() + 6) % 7   // 0=Mon, 6=Sun
  d.setDate(d.getDate() - dow)
  d.setHours(0, 0, 0, 0)
  return d
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface Props {
  weekStart:      Date
  sessions:       Session[]
  selectedDay:    number | null
  onSelectDay:    (day: number, month: number, year: number) => void
}

// ─── Componente ──────────────────────────────────────────────────────────────

export function WeekGrid({ weekStart, sessions, selectedDay, onSelectDay }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // Sessioni per ciascun giorno della settimana
  const sessionsByDay = new Map<string, Session[]>()
  for (const day of days) {
    const key = toDateStr(day)
    sessionsByDay.set(
      key,
      sessions.filter((s) => s.session_date === key),
    )
  }

  // Ore da mostrare
  const hours = Array.from({ length: DAY_END - DAY_START }, (_, i) => DAY_START + i)

  return (
    <div className="glass rounded-2xl overflow-hidden flex flex-col" style={{ maxHeight: "calc(100vh - 280px)" }}>

      {/* Intestazioni giorno */}
      <div className="grid border-b border-white/40" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
        <div className="border-r border-white/30" />
        {days.map((day, i) => {
          const isToday  = toDateStr(day) === toDateStr(today)
          const isSel    = day.getDate() === selectedDay &&
                           day.getMonth() === (days[0].getMonth()) // rough check
          return (
            <button
              key={i}
              onClick={() => onSelectDay(day.getDate(), day.getMonth(), day.getFullYear())}
              className={cn(
                "cursor-pointer py-3 text-center transition-colors",
                i < 6 && "border-r border-white/30",
                isSel ? "bg-primary/10" : "hover:bg-white/30",
              )}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {DAY_LABELS[i]}
              </p>
              <span className={cn(
                "mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold",
                isToday ? "bg-primary text-primary-foreground"
                : isSel  ? "bg-primary/20 text-primary"
                :          "text-foreground",
              )}>
                {day.getDate()}
              </span>
            </button>
          )
        })}
      </div>

      {/* Griglia oraria scrollabile */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="relative" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>

          {/* Righe orarie + colonne */}
          {hours.map((hour) => (
            <div
              key={hour}
              className="grid border-b border-white/20"
              style={{ gridTemplateColumns: "56px repeat(7, 1fr)", minHeight: "56px" }}
            >
              {/* Label ora */}
              <div className="flex items-start justify-end border-r border-white/30 pr-2 pt-1">
                <span className="text-[10px] font-semibold text-muted-foreground/60">
                  {String(hour).padStart(2, "0")}:00
                </span>
              </div>

              {/* Slot per ogni giorno */}
              {days.map((day, di) => (
                <button
                  key={di}
                  onClick={() => onSelectDay(day.getDate(), day.getMonth(), day.getFullYear())}
                  className={cn(
                    "cursor-pointer relative h-14 transition-colors",
                    di < 6 && "border-r border-white/20",
                    "hover:bg-primary/5",
                  )}
                />
              ))}
            </div>
          ))}

          {/* Sessioni sovrapposte come blocchi assoluti */}
          {days.map((day, di) => {
            const key       = toDateStr(day)
            const daySess   = sessionsByDay.get(key) ?? []

            return daySess.map((s) => {
              const startMins = toMins(s.start_time) - DAY_START * 60
              const endMins   = toMins(s.end_time)   - DAY_START * 60
              const clampedStart = Math.max(0, startMins)
              const clampedEnd   = Math.min(TOTAL_MINS, endMins)
              if (clampedEnd <= clampedStart) return null

              const topPct    = (clampedStart / TOTAL_MINS) * 100
              const heightPct = ((clampedEnd - clampedStart) / TOTAL_MINS) * 100

              // offsetLeft: 56px (label) + di * (1/7 of remaining)
              const meta = s.metadata as { exam_name?: string }

              return (
                <div
                  key={s.id}
                  onClick={() => onSelectDay(day.getDate(), day.getMonth(), day.getFullYear())}
                  className={cn(
                    "absolute cursor-pointer overflow-hidden rounded-lg border-l-2 px-1.5 py-1 text-left shadow-sm transition-all hover:shadow-md",
                    STATUS_COLOR[s.payment_status],
                  )}
                  style={{
                    top:    `${topPct}%`,
                    height: `${Math.max(heightPct, 2.5)}%`,
                    left:   `calc(56px + ${di} * ((100% - 56px) / 7) + 2px)`,
                    width:  `calc((100% - 56px) / 7 - 4px)`,
                  }}
                >
                  <p className="truncate text-[10px] font-bold leading-tight">
                    {meta.exam_name ?? "Sessione"}
                  </p>
                  <p className="text-[9px] opacity-70">
                    {formatTime(s.start_time)}–{formatTime(s.end_time)}
                  </p>
                </div>
              )
            })
          })}
        </div>
      </div>
    </div>
  )
}

export { getWeekStart }
