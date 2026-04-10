"use client"

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import type { Session, YearlyArchive } from "@/types/database"

interface Props {
  sessions: Session[]
  archive?: YearlyArchive
  year: number
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b"]
const LABELS = ["Pagato", "In attesa", "Non pagato"]

export function PaymentBreakdown({ sessions, archive, year }: Props) {
  let paid = 0, pending = 0, unpaid = 0

  if (archive) {
    paid    = archive.total_paid
    unpaid  = archive.total_unpaid
    pending = 0
  } else {
    for (const s of sessions) {
      if (!s.session_date.startsWith(`${year}-`)) continue
      if (s.payment_status === "paid")    paid    += s.earned
      else if (s.payment_status === "pending") pending += s.earned
      else                                unpaid  += s.earned
    }
  }

  const total = paid + pending + unpaid
  const data = [
    { name: "Pagato",    value: Math.round(paid    * 100) / 100 },
    { name: "In attesa", value: Math.round(pending * 100) / 100 },
    { name: "Non pagato",value: Math.round(unpaid  * 100) / 100 },
  ].filter((d) => d.value > 0)

  return (
    <div className="glass-dashboard rounded-2xl px-5 pt-5 pb-4">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        Stato pagamenti
      </p>
      <p className="mb-2 text-xs text-muted-foreground">Distribuzione degli importi</p>

      {total === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Nessun dato</p>
      ) : (
        <div className="flex items-center gap-4">
          <ResponsiveContainer width={120} height={120}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={32} outerRadius={52} dataKey="value" strokeWidth={0}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip
                formatter={(v: unknown) => [`€${Number(v).toFixed(2)}`]}
                contentStyle={{ borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)", fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2">
            {data.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i] }} />
                <span className="text-muted-foreground">{d.name}</span>
                <span className="ml-auto font-semibold tabular-nums text-foreground">€{d.value.toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-border/40 pt-1 flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Totale</span>
              <span className="ml-auto font-bold tabular-nums text-foreground">€{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
