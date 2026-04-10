"use client"

import { Target } from "lucide-react"
import type { Session, MonthlyArchiveEntry } from "@/types/database"

interface Props {
  sessions:     Session[]
  monthly?:     MonthlyArchiveEntry[]
  year:         number
  goalMonthly?: number | null
  goalAnnual?:  number | null
}

function clamp(v: number) { return Math.min(v, 100) }

export function GoalProgress({ sessions, monthly, year, goalMonthly, goalAnnual }: Props) {
  if (!goalMonthly && !goalAnnual) return null

  // Calcola guadagno anno e mese corrente
  let yearTotal = 0
  let monthTotal = 0
  const now = new Date()
  const monthKey = `${year}-${String(now.getMonth() + 1).padStart(2, "0")}`

  if (monthly) {
    yearTotal  = monthly.reduce((a, m) => a + m.earned, 0)
    monthTotal = monthly.find((m) => m.month === now.getMonth() + 1)?.earned ?? 0
  } else {
    for (const s of sessions) {
      if (!s.session_date.startsWith(`${year}-`)) continue
      yearTotal += s.earned
      if (s.session_date.startsWith(monthKey)) monthTotal += s.earned
    }
  }

  return (
    <div className="glass-dashboard rounded-2xl px-5 pt-5 pb-4">
      <div className="mb-4 flex items-center gap-2">
        <Target className="h-4 w-4 text-primary" />
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Obiettivi
        </p>
      </div>
      <div className="space-y-5">
        {goalMonthly && (
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Mensile</span>
              <span className="font-semibold tabular-nums text-foreground">
                €{monthTotal.toFixed(0)} / €{goalMonthly}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${clamp((monthTotal / goalMonthly) * 100)}%` }}
              />
            </div>
            <p className="mt-1 text-right text-[10px] text-muted-foreground">
              {Math.round((monthTotal / goalMonthly) * 100)}%
            </p>
          </div>
        )}
        {goalAnnual && (
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Annuale</span>
              <span className="font-semibold tabular-nums text-foreground">
                €{yearTotal.toFixed(0)} / €{goalAnnual}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${clamp((yearTotal / goalAnnual) * 100)}%` }}
              />
            </div>
            <p className="mt-1 text-right text-[10px] text-muted-foreground">
              {Math.round((yearTotal / goalAnnual) * 100)}%
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
