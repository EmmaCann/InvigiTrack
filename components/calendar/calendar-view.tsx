"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, CalendarDays, LayoutGrid } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useRef } from "react"
import { DayPanel } from "./day-panel"
import { WeekGrid, getWeekStart } from "./week-grid"
import { SessionDialog } from "@/components/sessions/session-dialog"
import type { Session, Profile } from "@/types/database"

// ─── SlotDialog — apre SessionDialog programmaticamente ──────────────────────

function SlotDialog({
  profile, lastSession, slotDate, slotTime, onClose,
}: {
  profile: Profile
  lastSession?: Session
  slotDate: string
  slotTime: string | null
  onClose: () => void
}) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  useEffect(() => { triggerRef.current?.click() }, [])
  return (
    <SessionDialog
      profile={profile}
      lastSession={lastSession}
      defaultDate={slotDate}
      defaultStartTime={slotTime ?? undefined}
      onSuccess={onClose}
      trigger={<button ref={triggerRef} className="hidden" />}
    />
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_DOT: Record<string, string> = {
  unpaid:  "bg-amber-400",
  pending: "bg-blue-400",
  paid:    "bg-emerald-400",
}

const DAY_LABELS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"]

type CalView = "month" | "week"

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  sessions: Session[]
  profile:  Profile
}

// ─── Componente ──────────────────────────────────────────────────────────────

export function CalendarView({ sessions, profile }: Props) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [view,        setView]        = useState<CalView>("month")
  const [current,     setCurrent]     = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [weekStart,   setWeekStart]   = useState(() => getWeekStart(today))
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate())
  const [selMonth,    setSelMonth]    = useState(today.getMonth())
  const [selYear,     setSelYear]     = useState(today.getFullYear())
  const [slotDate,    setSlotDate]    = useState<string | null>(null)
  const [slotTime,    setSlotTime]    = useState<string | null>(null)
  const [dialogOpen,  setDialogOpen]  = useState(false)

  const year  = current.getFullYear()
  const month = current.getMonth()

  // ── Month label + navigazione ────────────────────────────────────────────────
  const monthLabel = view === "month"
    ? current.toLocaleDateString("it-IT", { month: "long", year: "numeric" })
    : (() => {
        const wEnd = addDays(weekStart, 6)
        const from = weekStart.toLocaleDateString("it-IT", { day: "numeric", month: "short" })
        const to   = wEnd.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })
        return `${from} – ${to}`
      })()

  function prev() {
    if (view === "month") setCurrent(new Date(year, month - 1, 1))
    else setWeekStart((w) => addDays(w, -7))
  }
  function next() {
    if (view === "month") setCurrent(new Date(year, month + 1, 1))
    else setWeekStart((w) => addDays(w, 7))
  }
  function goToday() {
    setCurrent(new Date(today.getFullYear(), today.getMonth(), 1))
    setWeekStart(getWeekStart(today))
    setSelectedDay(today.getDate())
    setSelMonth(today.getMonth())
    setSelYear(today.getFullYear())
  }

  // ── Sessioni del mese corrente ───────────────────────────────────────────────
  const monthSessions = sessions.filter((s) => {
    const d = new Date(s.session_date + "T00:00:00")
    return d.getMonth() === month && d.getFullYear() === year
  })

  const monthTotalMins  = monthSessions.reduce((a, s) => a + s.duration_minutes, 0)
  const monthHours      = Math.floor(monthTotalMins / 60)
  const monthExtraMins  = monthTotalMins % 60

  // Raggruppa per giorno (mese corrente)
  const byDay = new Map<number, Session[]>()
  for (const s of monthSessions) {
    const day = new Date(s.session_date + "T00:00:00").getDate()
    if (!byDay.has(day)) byDay.set(day, [])
    byDay.get(day)!.push(s)
  }

  // Sessioni per il pannello laterale (giorno selezionato)
  const selDateStr     = selectedDay ? toDateStr(selYear, selMonth, selectedDay) : null
  const selectedSessions = sessions.filter((s) => s.session_date === selDateStr)
  const lastSession    = sessions[0]

  // ── Griglia mensile ──────────────────────────────────────────────────────────
  const firstDow  = (new Date(year, month, 1).getDay() + 6) % 7
  const daysCount = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysCount }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const isToday = (d: number) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  // ── Handlers ─────────────────────────────────────────────────────────────────
  function selectMonthDay(day: number) {
    setSelectedDay(day)
    setSelMonth(month)
    setSelYear(year)
  }

  function selectWeekDay(day: number, m: number, y: number) {
    setSelectedDay(day)
    setSelMonth(m)
    setSelYear(y)
  }

  function handleSlotClick(dateStr: string, startTime: string) {
    setSlotDate(dateStr)
    setSlotTime(startTime)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-4">

      {/* ── Header: navigazione + toggle vista ─────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">

        {/* Frecce + Oggi */}
        <div className="flex items-center gap-1">
          <button
            onClick={prev}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/60 hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={goToday}
            className="cursor-pointer rounded-lg border border-border/50 bg-white/60 px-3 py-1 text-xs font-semibold text-foreground transition-colors hover:bg-white/90"
          >
            Oggi
          </button>
          <button
            onClick={next}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/60 hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Label periodo */}
        <h3 className="text-sm font-bold capitalize text-foreground flex-1">{monthLabel}</h3>

        {/* Mini-stats (solo mensile) */}
        {view === "month" && monthSessions.length > 0 && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>
              <span className="font-semibold text-foreground">{monthSessions.length}</span> sessioni
            </span>
            <span className="text-border">·</span>
            <span>
              <span className="font-semibold text-foreground">
                {monthHours}h{monthExtraMins > 0 ? ` ${monthExtraMins}min` : ""}
              </span> lavorate
            </span>
          </div>
        )}

        {/* Toggle Month / Week */}
        <div className="flex rounded-lg border border-border/40 bg-muted/30 p-0.5">
          <button
            onClick={() => setView("month")}
            className={cn(
              "flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all",
              view === "month" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Mese
          </button>
          <button
            onClick={() => setView("week")}
            className={cn(
              "flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all",
              view === "week" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Settimana
          </button>
        </div>

        {/* Bottone nuova sessione globale */}
        <SessionDialog profile={profile} lastSession={lastSession} />
      </div>

      {/* ── Layout principale ─────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">

        {/* Vista mensile */}
        {view === "month" && (
          <div className="glass rounded-2xl overflow-hidden shadow-sm shadow-black/[0.04]">
            {/* Intestazioni giorno */}
            <div className="grid grid-cols-7 border-b border-white/40">
              {DAY_LABELS.map((d) => (
                <div key={d} className="py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {d}
                </div>
              ))}
            </div>

            {/* Celle */}
            <div className="grid grid-cols-7">
              {cells.map((day, i) => {
                const daySessions = day ? (byDay.get(day) ?? []) : []
                const active      = day !== null && day === selectedDay && selMonth === month && selYear === year
                const todayCell   = day !== null && isToday(day)
                const isWeekend   = (i % 7) >= 5

                return (
                  <button
                    key={i}
                    disabled={day === null}
                    onClick={() => day && selectMonthDay(day)}
                    className={cn(
                      "relative min-h-[72px] p-2 text-left transition-all border-b border-r border-white/30",
                      day === null  ? "bg-white/5 cursor-default"
                      : active      ? "bg-primary/10"
                      : isWeekend   ? "bg-slate-50/40 hover:bg-white/40"
                      :               "hover:bg-white/40",
                      i % 7 === 6 && "border-r-0",
                    )}
                  >
                    {day && (
                      <>
                        <span className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                          todayCell ? "bg-primary text-primary-foreground"
                          : active  ? "bg-primary/20 text-primary"
                          :           "text-foreground",
                        )}>
                          {day}
                        </span>

                        <div className="mt-1 space-y-0.5">
                          {daySessions.slice(0, 2).map((s) => {
                            const meta = s.metadata as { exam_name?: string }
                            return (
                              <div key={s.id} className="flex items-center gap-1 rounded px-1 py-0.5 bg-primary/10">
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
        )}

        {/* Vista settimanale */}
        {view === "week" && (
          <WeekGrid
            weekStart={weekStart}
            sessions={sessions}
            selectedDay={selectedDay}
            onSelectDay={selectWeekDay}
            onSlotClick={handleSlotClick}
          />
        )}

        {/* Pannello dettaglio giorno (sempre visibile a destra) */}
        <DayPanel
          selectedDay={selectedDay}
          year={selYear}
          month={selMonth}
          sessions={selectedSessions}
          profile={profile}
          lastSession={lastSession}
        />
      </div>

      {/* Dialog slot (aperto da click su slot orario nella vista settimana) */}
      {dialogOpen && slotDate && (
        <SlotDialog
          profile={profile}
          lastSession={lastSession}
          slotDate={slotDate}
          slotTime={slotTime}
          onClose={() => { setDialogOpen(false); setSlotDate(null); setSlotTime(null) }}
        />
      )}
    </div>
  )
}
