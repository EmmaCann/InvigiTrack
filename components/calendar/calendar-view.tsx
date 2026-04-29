"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, CalendarDays, LayoutGrid, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { DayPanel } from "./day-panel"
import { WeekGrid, getWeekStart } from "./week-grid"
import { EventDialog } from "./event-dialog"
import { useIsMobile } from "@/hooks/use-is-mobile"
import type { Session, CalendarEvent, Profile, Timetable } from "@/types/database"

// --- Helpers ------------------------------------------------------------------

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

// --- Props --------------------------------------------------------------------

interface Props {
  sessions:     Session[]
  events:       CalendarEvent[]
  profile:      Profile
  categorySlug: string
  timetables:   Timetable[]
}

// --- Componente --------------------------------------------------------------

export function CalendarView({ sessions, events, profile, categorySlug, timetables }: Props) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const isMobile = useIsMobile()

  const [view,        setView]        = useState<CalView>("month")
  const [current,     setCurrent]     = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [weekStart,   setWeekStart]   = useState(() => getWeekStart(today))
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate())
  const [selMonth,    setSelMonth]    = useState(today.getMonth())
  const [selYear,     setSelYear]     = useState(today.getFullYear())

  // On mobile, always show month view
  const effectiveView: CalView = isMobile ? "month" : view

  const year  = current.getFullYear()
  const month = current.getMonth()

  // -- Month label + navigazione ------------------------------------------------
  const monthLabel = effectiveView === "month"
    ? current.toLocaleDateString("it-IT", { month: "long", year: "numeric" })
    : (() => {
        const wEnd = addDays(weekStart, 6)
        const from = weekStart.toLocaleDateString("it-IT", { day: "numeric", month: "short" })
        const to   = wEnd.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })
        return `${from} – ${to}`
      })()

  function prev() {
    if (effectiveView === "month") setCurrent(new Date(year, month - 1, 1))
    else setWeekStart((w) => addDays(w, -7))
  }
  function next() {
    if (effectiveView === "month") setCurrent(new Date(year, month + 1, 1))
    else setWeekStart((w) => addDays(w, 7))
  }
  function goToday() {
    setCurrent(new Date(today.getFullYear(), today.getMonth(), 1))
    setWeekStart(getWeekStart(today))
    setSelectedDay(today.getDate())
    setSelMonth(today.getMonth())
    setSelYear(today.getFullYear())
  }

  // -- Sessioni del mese corrente -----------------------------------------------
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

  // Appuntamenti del mese corrente, raggruppati per giorno
  const monthEvents = events.filter((ev) => {
    const d = new Date(ev.event_date + "T00:00:00")
    return d.getMonth() === month && d.getFullYear() === year
  })
  const eventsByDay = new Map<number, CalendarEvent[]>()
  for (const ev of monthEvents) {
    const day = new Date(ev.event_date + "T00:00:00").getDate()
    if (!eventsByDay.has(day)) eventsByDay.set(day, [])
    eventsByDay.get(day)!.push(ev)
  }

  // Sessioni / eventi per il pannello laterale (giorno selezionato)
  const selDateStr       = selectedDay ? toDateStr(selYear, selMonth, selectedDay) : null
  const selectedSessions = sessions.filter((s) => s.session_date === selDateStr)
  const selectedEvents   = events.filter((ev) => ev.event_date === selDateStr)
  const lastSession      = sessions[0]

  // -- Griglia mensile ----------------------------------------------------------
  const firstDow  = (new Date(year, month, 1).getDay() + 6) % 7
  const daysCount = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysCount }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const isToday = (d: number) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  // -- Handlers -----------------------------------------------------------------
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

  return (
    <div className="space-y-4">

      {/* -- Header: navigazione + toggle vista ----------------------- */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">

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
        <h3 className="flex-1 text-sm font-bold capitalize text-foreground">{monthLabel}</h3>

        {/* Mini-stats (solo mensile, solo desktop) */}
        {effectiveView === "month" && monthSessions.length > 0 && (
          <div className="hidden items-center gap-3 text-xs text-muted-foreground sm:flex">
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

        {/* Toggle Month / Week — solo desktop */}
        {!isMobile && (
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
        )}

        {/* Bottone nuovo evento */}
        <EventDialog
          defaultDate={selDateStr ?? new Date().toISOString().split("T")[0]}
          trigger={
            <button className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-colors hover:bg-primary/90 sm:px-4">
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              <span className="hidden sm:inline">Nuovo Evento</span>
            </button>
          }
        />
      </div>

      {/* -- Layout principale --------------------------------------- */}
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">

        {/* Vista mensile */}
        {effectiveView === "month" && (
          <div className="glass overflow-hidden rounded-2xl shadow-sm shadow-black/[0.04]">
            {/* Intestazioni giorno */}
            <div className="grid grid-cols-7 border-b border-white/40">
              {DAY_LABELS.map((d) => (
                <div key={d} className="py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:py-2.5 sm:text-[11px]">
                  {d}
                </div>
              ))}
            </div>

            {/* Celle */}
            <div className="grid grid-cols-7">
              {cells.map((day, i) => {
                const daySessions = day ? (byDay.get(day) ?? []) : []
                const dayEvents   = day ? (eventsByDay.get(day) ?? []) : []
                const active      = day !== null && day === selectedDay && selMonth === month && selYear === year
                const todayCell   = day !== null && isToday(day)
                const isWeekend   = (i % 7) >= 5
                const totalItems  = daySessions.length + dayEvents.length

                return (
                  <button
                    key={i}
                    disabled={day === null}
                    onClick={() => day && selectMonthDay(day)}
                    className={cn(
                      "relative border-b border-r border-white/30 p-1 text-left transition-all sm:p-2",
                      "min-h-[56px] sm:min-h-[96px]",
                      day === null  ? "cursor-default bg-white/5"
                      : active      ? "bg-primary/10"
                      : isWeekend   ? "bg-slate-50/40 hover:bg-white/40"
                      :               "hover:bg-white/40",
                      i % 7 === 6 && "border-r-0",
                    )}
                  >
                    {day && (
                      <>
                        <span className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold sm:h-6 sm:w-6 sm:text-xs",
                          todayCell ? "bg-primary text-primary-foreground"
                          : active  ? "bg-primary/20 text-primary"
                          :           "text-foreground",
                        )}>
                          {day}
                        </span>

                        {/* Mobile: solo pallini colorati */}
                        {totalItems > 0 && (
                          <div className="mt-0.5 flex flex-wrap gap-0.5 sm:hidden">
                            {daySessions.slice(0, 3).map((s) => (
                              <span key={s.id} className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[s.payment_status])} />
                            ))}
                            {dayEvents
                              .slice(0, Math.max(0, 3 - Math.min(daySessions.length, 3)))
                              .map((ev) => (
                                <span key={ev.id} className={cn("h-1.5 w-1.5 rounded-sm", ev.is_converted ? "bg-teal-400" : "bg-violet-400")} />
                              ))
                            }
                          </div>
                        )}

                        {/* Desktop: etichette testo */}
                        <div className="mt-1 hidden space-y-0.5 sm:block">
                          {/* Sessioni lavorative */}
                          {daySessions.slice(0, 2).map((s) => {
                            const meta = s.metadata as { exam_name?: string }
                            return (
                              <div key={s.id} className="flex items-center gap-1 rounded bg-primary/10 px-1 py-0.5">
                                <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", STATUS_DOT[s.payment_status])} />
                                <span className="truncate text-[10px] font-medium text-primary/80">
                                  {meta.exam_name ?? "Sessione"}
                                </span>
                              </div>
                            )
                          })}
                          {/* Appuntamenti calendario */}
                          {dayEvents.slice(0, daySessions.length >= 2 ? 0 : 2 - daySessions.length).map((ev) => (
                            <div key={ev.id} className="flex items-center gap-1 rounded bg-violet-50 px-1 py-0.5">
                              <span className={cn(
                                "h-1.5 w-1.5 shrink-0 rounded-sm",
                                ev.is_converted ? "bg-teal-400" : "bg-violet-400",
                              )} />
                              <span className="truncate text-[10px] font-medium text-violet-700">
                                {ev.title}
                              </span>
                            </div>
                          ))}
                          {totalItems > 2 && (
                            <p className="px-1 text-[10px] text-muted-foreground">
                              +{totalItems - 2} altri
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Legenda */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/30 px-3 py-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Legenda</span>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                <span className="text-[10px] text-muted-foreground">Non pagata</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] text-muted-foreground">Pagata</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-sm bg-violet-400" />
                <span className="text-[10px] text-muted-foreground">Evento</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-sm bg-teal-400" />
                <span className="text-[10px] text-muted-foreground">Registrato</span>
              </div>
            </div>
          </div>
        )}

        {/* Vista settimanale (solo desktop) */}
        {effectiveView === "week" && (
          <WeekGrid
            weekStart={weekStart}
            sessions={sessions}
            selectedDay={selectedDay}
            onSelectDay={selectWeekDay}
          />
        )}

        {/* Pannello dettaglio giorno */}
        <DayPanel
          selectedDay={selectedDay}
          year={selYear}
          month={selMonth}
          sessions={selectedSessions}
          events={selectedEvents}
          profile={profile}
          lastSession={lastSession}
          categorySlug={categorySlug}
          timetables={timetables}
        />
      </div>

    </div>
  )
}
