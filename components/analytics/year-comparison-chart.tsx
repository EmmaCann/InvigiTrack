"use client"

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts"
import type { Session, YearlyArchive } from "@/types/database"

const MONTHS_IT = ["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"]

interface Props {
  sessions: Session[]      // sessioni live (include anni non archiviati)
  archives: YearlyArchive[]
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

  // Dati anno precedente: da archivio se esiste, altrimenti da sessioni live
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
        <BarChart data={data} barSize={10} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${v}`} width={48} />
          <Tooltip
            formatter={(v: unknown, name: unknown) => [`€${Number(v).toFixed(2)}`, String(name)]}
            contentStyle={{ borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)", fontSize: 12 }}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey={String(currentYear)} fill="hsl(var(--primary))"    fillOpacity={0.85} radius={[4,4,0,0]} />
          <Bar dataKey={String(prevYear)}    fill="hsl(var(--primary))"    fillOpacity={0.3}  radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
