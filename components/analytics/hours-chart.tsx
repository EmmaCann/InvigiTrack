"use client"

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import type { Session, MonthlyArchiveEntry } from "@/types/database"

const MONTHS_IT = ["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"]

interface Props {
  sessions: Session[]
  monthly?: MonthlyArchiveEntry[]
  year: number
}

function buildData(sessions: Session[], year: number) {
  const map = new Map<number, number>()
  for (let m = 1; m <= 12; m++) map.set(m, 0)
  for (const s of sessions) {
    if (!s.session_date.startsWith(`${year}-`)) continue
    const m = parseInt(s.session_date.slice(5, 7), 10)
    map.set(m, (map.get(m) ?? 0) + s.duration_minutes / 60)
  }
  return Array.from(map.entries()).map(([m, h]) => ({
    name:  MONTHS_IT[m - 1],
    hours: Math.round(h * 100) / 100,
  }))
}

export function HoursChart({ sessions, monthly, year }: Props) {
  const data = monthly
    ? monthly.map((m) => ({ name: MONTHS_IT[m.month - 1], hours: Math.round(m.hours * 100) / 100 }))
    : buildData(sessions, year)

  return (
    <div className="glass-dashboard rounded-2xl px-5 pt-5 pb-4">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        Ore lavorate
      </p>
      <p className="mb-4 text-xs text-muted-foreground">Ore per mese</p>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradHours" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}h`} width={36} />
          <Tooltip
            formatter={(v: unknown) => [`${Number(v).toFixed(1)}h`, "Ore"]}
            contentStyle={{ borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)", fontSize: 12, background: "rgba(255,255,255,0.95)" }}
          />
          <Area type="monotone" dataKey="hours" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#gradHours)" dot={false} activeDot={{ r: 4 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
