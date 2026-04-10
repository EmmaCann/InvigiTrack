"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { updateSessionsPrefs } from "@/app/actions/settings"
import type { SessionsPrefs } from "@/types/database"

type FilterOption = "all" | "unpaid" | "paid"

const FILTER_OPTIONS: { value: FilterOption; label: string }[] = [
  { value: "all",    label: "Tutte"      },
  { value: "unpaid", label: "Non pagate" },
  { value: "paid",   label: "Pagate"     },
]

const GROUP_OPTIONS: { value: "date" | "month"; label: string; sub: string }[] = [
  { value: "date",  label: "Lista cronologica", sub: "Sessioni in ordine di data" },
  { value: "month", label: "Per mese",          sub: "Sessioni raggruppate per mese" },
]

interface Props { currentPrefs: SessionsPrefs }

export function SessionsPrefsForm({ currentPrefs }: Props) {
  const [filter,  setFilter]  = useState<FilterOption>(currentPrefs.default_filter ?? "all")
  const [group,   setGroup]   = useState<"date" | "month">(currentPrefs.grouping ?? "date")
  const [loading, setLoading] = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleSave() {
    setLoading(true); setError(null); setSaved(false)
    const res = await updateSessionsPrefs({ default_filter: filter, grouping: group })
    setLoading(false)
    if (res.error) { setError(res.error); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-semibold text-foreground">Filtro predefinito</p>
        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => { setFilter(o.value); setSaved(false) }}
              className={cn(
                "rounded-xl border px-4 py-1.5 text-sm font-medium transition-all",
                filter === o.value
                  ? "border-primary/40 bg-primary/5 text-primary ring-1 ring-primary/20"
                  : "border-border/50 bg-white/50 text-muted-foreground hover:border-border",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-foreground">Visualizzazione</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {GROUP_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => { setGroup(o.value); setSaved(false) }}
              className={cn(
                "rounded-xl border px-4 py-3 text-left text-sm transition-all",
                group === o.value
                  ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                  : "border-border/50 bg-white/50 hover:border-border",
              )}
            >
              <p className={cn("font-semibold", group === o.value ? "text-primary" : "text-foreground")}>{o.label}</p>
              <p className="text-[11px] text-muted-foreground">{o.sub}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Salvataggio…" : saved ? "✓ Salvato" : "Salva"}
        </button>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
  )
}
