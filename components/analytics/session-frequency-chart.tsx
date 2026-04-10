"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { Session, YearlyArchive } from "@/types/database"

const DAY_LABELS = ["Lun","Mar","Mer","Gio","Ven","Sab","Dom"]

interface Props {
  sessions: Session[]
  archive?: YearlyArchive
  year: number
}

export function SessionFrequencyChart({ sessions, archive, year }: Props) {
  let data: { name: string; sessioni: number }[]

  if (archive) {
    data = archive.archive_data.day_of_week.map((d) => ({
      name:     DAY_LABELS[d.day],
      sessioni: d.sessions,
    }))
  } else {
    const counts = Array(7).fill(0)
    for (const s of sessions) {
      if (!s.session_date.startsWith(`${year}-`)) continue
      const d = new Date(s.session_date + "T00:00:00")
      counts[(d.getDay() + 6) % 7]++  // 0=Lun
    }
    data = DAY_LABELS.map((name, i) => ({ name, sessioni: counts[i] }))
  }

  return (
    <div className="glass-dashboard rounded-2xl px-5 pt-5 pb-4">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        Frequenza sessioni
      </p>
      <p className="mb-4 text-xs text-muted-foreground">Sessioni per giorno della settimana</p>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} barSize={18} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} width={24} />
          <Tooltip
            formatter={(v: unknown) => [Number(v), "Sessioni"]}
            contentStyle={{ borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)", fontSize: 12 }}
          />
          <Bar dataKey="sessioni" fill="hsl(var(--primary))" fillOpacity={0.7} radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
