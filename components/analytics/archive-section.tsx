"use client"

import { useState } from "react"
import { Archive, Download, AlertTriangle } from "lucide-react"
import { archiveYearAction, type ArchiveCsvRow } from "@/app/actions/analytics"

interface Props {
  workspaceId:      string
  archivableYears:  number[]    // anni con sessioni non ancora archiviati (< anno corrente)
}

function downloadCsv(rows: ArchiveCsvRow[], year: number) {
  if (rows.length === 0) return
  const headers = Object.keys(rows[0]) as (keyof ArchiveCsvRow)[]
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      headers.map((h) => `"${String(r[h]).replace(/"/g, '""')}"`).join(",")
    ),
  ]
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement("a")
  a.href     = url
  a.download = `invigitrack-${year}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function ArchiveSection({ workspaceId, archivableYears }: Props) {
  const [confirming, setConfirming] = useState<number | null>(null)
  const [loading,    setLoading]    = useState(false)
  const [done,       setDone]       = useState<number[]>([])
  const [error,      setError]      = useState<string | null>(null)

  const available = archivableYears.filter((y) => !done.includes(y))

  async function handleArchive(year: number) {
    setLoading(true)
    setError(null)
    const res = await archiveYearAction(workspaceId, year)
    setLoading(false)
    if (res.error) { setError(res.error); return }
    // Download CSV automatico
    if (res.csvRows) downloadCsv(res.csvRows, year)
    setDone((d) => [...d, year])
    setConfirming(null)
  }

  return (
    <div className="glass-dashboard rounded-2xl px-6 py-5">
      <div className="mb-4 flex items-center gap-2">
        <Archive className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Archivio anni</h3>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        Compatta le sessioni di un anno passato in un archivio statistico per liberare spazio nel database.
        Prima di archiviare viene scaricato automaticamente il CSV con tutte le sessioni.
      </p>

      {available.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nessun anno da archiviare.</p>
      ) : (
        <div className="space-y-3">
          {available.map((year) => (
            <div key={year} className="rounded-xl border border-border/50 bg-white/50 px-4 py-3">
              {confirming === year ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 text-xs text-amber-700">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <p>
                      Stai per archiviare tutte le sessioni del <strong>{year}</strong>.
                      Il CSV verrà scaricato automaticamente, poi le sessioni saranno eliminate dal database.
                      Questa azione non è reversibile.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleArchive(year)}
                      disabled={loading}
                      className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      <Download className="h-3 w-3" />
                      {loading ? "Archiviazione…" : "Scarica CSV e archivia"}
                    </button>
                    <button
                      onClick={() => setConfirming(null)}
                      disabled={loading}
                      className="rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                    >
                      Annulla
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">{year}</span>
                  <button
                    onClick={() => setConfirming(year)}
                    className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-amber-300 hover:text-amber-600"
                  >
                    <Archive className="h-3 w-3" />
                    Archivia
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-3 text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}
