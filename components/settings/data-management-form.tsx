"use client"

import { useState } from "react"
import { Download, Archive, AlertTriangle, CheckCircle2 } from "lucide-react"
import { exportAllDataCsv, archiveAllPastYears, type AllDataCsvRow } from "@/app/actions/data-management"

function downloadCsv(rows: AllDataCsvRow[]) {
  if (rows.length === 0) return
  const headers = Object.keys(rows[0]) as (keyof AllDataCsvRow)[]
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
  a.download = `invigitrack-export-${new Date().toISOString().split("T")[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function DataManagementForm() {
  const [exportLoading,  setExportLoading]  = useState(false)
  const [archiveLoading, setArchiveLoading] = useState(false)
  const [archiveConfirm, setArchiveConfirm] = useState(false)
  const [exportDone,     setExportDone]     = useState(false)
  const [archiveResult,  setArchiveResult]  = useState<{ count: number; error?: string } | null>(null)

  async function handleExport() {
    setExportLoading(true)
    setExportDone(false)
    const res = await exportAllDataCsv()
    setExportLoading(false)
    if (res.error || !res.rows) return
    downloadCsv(res.rows)
    setExportDone(true)
    setTimeout(() => setExportDone(false), 4000)
  }

  async function handleArchiveAll() {
    setArchiveLoading(true)
    setArchiveResult(null)
    const res = await archiveAllPastYears()
    setArchiveLoading(false)
    setArchiveConfirm(false)
    setArchiveResult({ count: res.archived, error: res.error })
  }

  return (
    <div className="space-y-4">
      {/* Export CSV */}
      <div className="rounded-xl border border-border/50 bg-white/50 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Scarica tutti i dati</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Esporta tutte le sessioni di tutti i workspace in un unico file CSV.
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={exportLoading}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {exportDone
              ? <><CheckCircle2 className="h-3.5 w-3.5" /> Scaricato</>
              : exportLoading
              ? "Download…"
              : <><Download className="h-3.5 w-3.5" /> Esporta CSV</>
            }
          </button>
        </div>
      </div>

      {/* Archive all */}
      <div className="rounded-xl border border-border/50 bg-white/50 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Compatta database</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Archivia tutti gli anni passati (tutti i workspace) in formato aggregato,
              eliminando le sessioni originali per liberare spazio. I dati rimangono
              visibili nelle statistiche.
            </p>
          </div>
          {!archiveConfirm ? (
            <button
              onClick={() => setArchiveConfirm(true)}
              disabled={archiveLoading}
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-border/60 bg-white px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-amber-300 hover:text-amber-600"
            >
              <Archive className="h-3.5 w-3.5" />
              Compatta
            </button>
          ) : (
            <div className="flex shrink-0 flex-col items-end gap-2">
              <p className="flex items-center gap-1 text-[11px] text-amber-600">
                <AlertTriangle className="h-3 w-3" /> Operazione irreversibile
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleArchiveAll}
                  disabled={archiveLoading}
                  className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {archiveLoading ? "Archiviazione…" : "Conferma"}
                </button>
                <button
                  onClick={() => setArchiveConfirm(false)}
                  className="rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  Annulla
                </button>
              </div>
            </div>
          )}
        </div>

        {archiveResult && (
          <div className={`mt-3 rounded-lg px-3 py-2 text-xs ${archiveResult.error ? "bg-destructive/10 text-destructive" : "bg-emerald-50 text-emerald-700"}`}>
            {archiveResult.error
              ? `Errore: ${archiveResult.error}`
              : archiveResult.count === 0
              ? "Nessun anno da archiviare."
              : `✓ Archiviati ${archiveResult.count} anno/i.`
            }
          </div>
        )}
      </div>
    </div>
  )
}
