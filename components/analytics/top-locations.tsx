"use client"

import { MapPin } from "lucide-react"
import type { Session, YearlyArchive } from "@/types/database"

interface Props {
  sessions: Session[]
  archive?: YearlyArchive
  year: number
}

export function TopLocations({ sessions, archive, year }: Props) {
  let locations: { name: string; sessions: number }[]

  if (archive) {
    locations = archive.archive_data.top_locations
  } else {
    const map = new Map<string, number>()
    for (const s of sessions) {
      if (!s.session_date.startsWith(`${year}-`)) continue
      if (s.location) map.set(s.location, (map.get(s.location) ?? 0) + 1)
    }
    locations = Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, sessions]) => ({ name, sessions }))
  }

  const maxCount = Math.max(...locations.map((l) => l.sessions), 1)

  return (
    <div className="glass-dashboard rounded-2xl px-5 pt-5 pb-4">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        Sedi principali
      </p>
      <p className="mb-4 text-xs text-muted-foreground">Top 5 per numero di sessioni</p>

      {locations.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">Nessuna sede registrata</p>
      ) : (
        <div className="space-y-3">
          {locations.map((loc) => (
            <div key={loc.name}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium text-foreground truncate max-w-[70%]">
                  <MapPin className="h-3 w-3 shrink-0 text-primary/50" />
                  {loc.name}
                </span>
                <span className="tabular-nums text-muted-foreground">{loc.sessions}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary/60 transition-all"
                  style={{ width: `${(loc.sessions / maxCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
