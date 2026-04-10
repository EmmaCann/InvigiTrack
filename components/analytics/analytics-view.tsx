"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import type { Session, YearlyArchive, AnalyticsPrefs, AnalyticsWidgetId } from "@/types/database"
import { AnalyticsKpi }              from "./analytics-kpi"
import { EarningsChart }             from "./earnings-chart"
import { HoursChart }                from "./hours-chart"
import { YearComparisonChart }       from "./year-comparison-chart"
import { PaymentBreakdown }          from "./payment-breakdown"
import { SessionFrequencyChart }     from "./session-frequency-chart"
import { TopLocations }              from "./top-locations"
import { GoalProgress }              from "./goal-progress"

interface Props {
  sessions:    Session[]
  archives:    YearlyArchive[]
  prefs:       AnalyticsPrefs
  currentYear: number
}

const ALL_WIDGETS: AnalyticsWidgetId[] = [
  "earnings_trend", "hours_trend", "year_comparison",
  "payment_breakdown", "session_frequency", "top_locations",
]

export function AnalyticsView({ sessions, archives, prefs, currentYear }: Props) {
  const enabledWidgets = prefs.widgets ?? ALL_WIDGETS

  // Anni disponibili = anni live (da sessioni) + anni archiviati
  const liveYears = Array.from(new Set(sessions.map((s) => parseInt(s.session_date.slice(0, 4), 10)))).sort((a, b) => b - a)
  const archiveYears = archives.map((a) => a.year)
  const allYears = Array.from(new Set([...liveYears, ...archiveYears])).sort((a, b) => b - a)
  if (!allYears.includes(currentYear)) allYears.unshift(currentYear)

  const [year, setYear] = useState(currentYear)

  const archive     = archives.find((a) => a.year === year)
  const isArchived  = Boolean(archive)
  const monthly     = archive?.archive_data.monthly

  const show = (w: AnalyticsWidgetId) => enabledWidgets.includes(w)

  return (
    <div className="space-y-6">

      {/* Year selector */}
      <div className="flex items-center gap-3">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Analytics</h2>
        <div className="relative ml-auto">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="appearance-none rounded-xl border border-border/60 bg-white/70 py-1.5 pl-3 pr-8 text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
          >
            {allYears.map((y) => (
              <option key={y} value={y}>
                {y}{archives.find((a) => a.year === y) ? " 📦" : ""}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        </div>
        {isArchived && (
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
            Archiviato
          </span>
        )}
      </div>

      {/* KPI */}
      <AnalyticsKpi sessions={sessions} monthly={monthly} year={year} />

      {/* Goal progress (condizionale) */}
      <GoalProgress
        sessions={sessions} monthly={monthly} year={year}
        goalMonthly={prefs.goal_monthly} goalAnnual={prefs.goal_annual}
      />

      {/* Widget grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {show("earnings_trend") && (
          <EarningsChart sessions={sessions} monthly={monthly} year={year} />
        )}
        {show("hours_trend") && (
          <HoursChart sessions={sessions} monthly={monthly} year={year} />
        )}
        {show("year_comparison") && (
          <YearComparisonChart sessions={sessions} archives={archives} currentYear={year} />
        )}
        {show("payment_breakdown") && (
          <PaymentBreakdown sessions={sessions} archive={archive} year={year} />
        )}
        {show("session_frequency") && (
          <SessionFrequencyChart sessions={sessions} archive={archive} year={year} />
        )}
        {show("top_locations") && (
          <TopLocations sessions={sessions} archive={archive} year={year} />
        )}
      </div>

    </div>
  )
}
