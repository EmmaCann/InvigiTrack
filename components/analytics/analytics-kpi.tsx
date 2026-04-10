"use client"

import { Euro, TrendingUp, CalendarCheck, BarChart2 } from "lucide-react"
import type { MonthlyArchiveEntry, Session } from "@/types/database"

interface Props {
  sessions:  Session[]            // sessioni anno corrente (live)
  monthly?:  MonthlyArchiveEntry[] // dati da archivio (anno passato)
  year:      number
}

function fmt(n: number) { return `€${n.toFixed(2)}` }
function fmtN(n: number) { return n.toLocaleString("it-IT") }

export function AnalyticsKpi({ sessions, monthly, year }: Props) {
  let totalEarned = 0
  let totalSessions = 0
  let monthsWithSessions = 0

  if (monthly) {
    // anno archiviato
    for (const m of monthly) {
      totalEarned   += m.earned
      totalSessions += m.sessions
      if (m.sessions > 0) monthsWithSessions++
    }
  } else {
    // anno live
    const prefix = `${year}-`
    for (const s of sessions) {
      if (!s.session_date.startsWith(prefix)) continue
      totalEarned++
      totalSessions++
    }
    // ricalcola correttamente
    totalEarned = 0
    totalSessions = 0
    const monthSet = new Set<string>()
    for (const s of sessions) {
      if (!s.session_date.startsWith(`${year}-`)) continue
      totalEarned   += s.earned
      totalSessions++
      monthSet.add(s.session_date.slice(0, 7))
    }
    monthsWithSessions = monthSet.size
  }

  const monthlyAvg  = monthsWithSessions > 0 ? totalEarned / monthsWithSessions : 0
  const avgSession  = totalSessions > 0 ? totalEarned / totalSessions : 0

  const cards = [
    { label: "Guadagno anno",      value: fmt(totalEarned),    sub: `${year}`,           icon: Euro,          color: "text-emerald-600", bg: "bg-emerald-500/10" },
    { label: "Media mensile",       value: fmt(monthlyAvg),     sub: "per mese attivo",   icon: TrendingUp,    color: "text-violet-600",  bg: "bg-violet-500/10"  },
    { label: "Sessioni",            value: fmtN(totalSessions), sub: "registrate",         icon: CalendarCheck, color: "text-primary",     bg: "bg-primary/10"     },
    { label: "Valore medio",        value: fmt(avgSession),     sub: "per sessione",       icon: BarChart2,     color: "text-rose-600",    bg: "bg-rose-500/10"    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="glass-dashboard rounded-2xl px-5 py-5 transition-shadow hover:shadow-[0_12px_40px_rgba(15,23,42,0.08)]"
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {c.label}
            </p>
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${c.bg}`}>
              <c.icon className={`h-[1.05rem] w-[1.05rem] ${c.color}`} />
            </div>
          </div>
          <p className={`text-[1.65rem] font-bold leading-tight tabular-nums ${c.color}`}>
            {c.value}
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">{c.sub}</p>
        </div>
      ))}
    </div>
  )
}
