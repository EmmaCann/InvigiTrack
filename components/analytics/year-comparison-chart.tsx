"use client"

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts"
import type { Session, YearlyArchive } from "@/types/database"

const MONTHS_IT = ["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"]

interface Props {
  sessions:    Session[]
  archives:    YearlyArchive[]
  currentYear: number
}

function monthlyEarnings(sessions: Session[], year: number): number[] {
  const arr = Array(12).fill(0)
  for (const s of sessions) {
    if (!s.session_date.startsWith(`${year}-`)) continue
    const m = parseInt(s.session_date.slice(5, 7), 10) - 1
    arr[m] += s.earned
  }
  return arr.map((v) => Math.round(v * 100) / 100)
}

export function YearComparisonChart({ sessions, archives, currentYear }: Props) {
  const prevYear = currentYear - 1

  const currentData = monthlyEarnings(sessions, currentYear)

  const prevArchive = archives.find((a) => a.year === prevYear)
  const prevData = prevArchive
    ? Array.from({ length: 12 }, (_, i) => {
        const m = prevArchive.archive_data.monthly.find((x) => x.month === i + 1)
        return Math.round((m?.earned ?? 0) * 100) / 100
      })
    : monthlyEarnings(sessions, prevYear)

  const data = MONTHS_IT.map((name, i) => ({
    name,
    [currentYear]: currentData[i],
    [prevYear]:    prevData[i],
  }))

  return (
    <div className="glass-dashboard rounded-2xl px-5 pt-5 pb-4">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        Anno a confronto
      </p>
      <p className="mb-4 text-xs text-muted-foreground">{currentYear} vs {prevYear}</p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${v}`} width={48} />
          <Tooltip
            formatter={(v: unknown, name: unknown) => [`€${Number(v).toFixed(2)}`, String(name)]}
            contentStyle={{ borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)", fontSize: 12, background: "rgba(255,255,255,0.95)" }}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
          <Line
            type="monotone" dataKey={String(currentYear)}
            stroke="hsl(var(--primary))" strokeWidth={2.5}
            dot={false} activeDot={{ r: 4, strokeWidth: 0 }}
          />
          <Line
            type="monotone" dataKey={String(prevYear)}
            stroke="hsl(var(--primary))" strokeWidth={1.5}
            strokeDasharray="5 3" strokeOpacity={0.4}
            dot={false} activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
