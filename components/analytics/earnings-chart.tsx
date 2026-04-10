"use client"

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts"
import type { Session, MonthlyArchiveEntry } from "@/types/database"

const MONTHS_IT = ["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"]

interface Props {
  sessions: Session[]
  monthly?: MonthlyArchiveEntry[]
  year: number
}

function buildData(sessions: Session[], year: number): MonthlyArchiveEntry[] {
  const map = new Map<number, MonthlyArchiveEntry>()
  for (let m = 1; m <= 12; m++) map.set(m, { month: m, sessions: 0, hours: 0, earned: 0, paid: 0, unpaid: 0 })
  for (const s of sessions) {
    if (!s.session_date.startsWith(`${year}-`)) continue
    const m = parseInt(s.session_date.slice(5, 7), 10)
    const e = map.get(m)!
    e.sessions++
    e.hours  += s.duration_minutes / 60
    e.earned += s.earned
    if (s.payment_status === "paid") e.paid   += s.earned
    else                             e.unpaid += s.earned
  }
  return Array.from(map.values())
}

export function EarningsChart({ sessions, monthly, year }: Props) {
  const data = (monthly ?? buildData(sessions, year)).map((m) => ({
    name:   MONTHS_IT[m.month - 1],
    paid:   Math.round(m.paid   * 100) / 100,
    unpaid: Math.round(m.unpaid * 100) / 100,
  }))

  return (
    <div className="glass-dashboard rounded-2xl px-5 pt-5 pb-4">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        Andamento guadagni
      </p>
      <p className="mb-4 text-xs text-muted-foreground">Pagato e non pagato per mese</p>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradPaid" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#10b981" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.03} />
            </linearGradient>
            <linearGradient id="gradUnpaid" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${v}`} width={48} />
          <Tooltip
            formatter={(v: unknown, name: unknown) => [`€${Number(v).toFixed(2)}`, name === "paid" ? "Pagato" : "Non pagato"]}
            contentStyle={{ borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)", fontSize: 12, background: "rgba(255,255,255,0.95)" }}
          />
          <Legend formatter={(v) => v === "paid" ? "Pagato" : "Non pagato"} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
          <Area type="monotone" dataKey="paid"   stackId="1" stroke="#10b981" strokeWidth={2} fill="url(#gradPaid)"   dot={false} activeDot={{ r: 4 }} />
          <Area type="monotone" dataKey="unpaid" stackId="1" stroke="#f59e0b" strokeWidth={2} fill="url(#gradUnpaid)" dot={false} activeDot={{ r: 4 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
