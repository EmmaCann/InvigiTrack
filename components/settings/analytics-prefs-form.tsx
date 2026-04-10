"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { updateAnalyticsPrefs } from "@/app/actions/analytics"
import type { AnalyticsPrefs, AnalyticsWidgetId } from "@/types/database"
import { cn } from "@/lib/utils"

interface WidgetDef {
  id:    AnalyticsWidgetId
  label: string
  sub:   string
}

const WIDGETS: WidgetDef[] = [
  { id: "earnings_trend",    label: "Andamento guadagni",   sub: "Bar chart mensile"          },
  { id: "hours_trend",       label: "Ore lavorate",         sub: "Bar chart mensile"          },
  { id: "year_comparison",   label: "Anno a confronto",     sub: "Confronto con anno prima"   },
  { id: "payment_breakdown", label: "Stato pagamenti",      sub: "Donut paid/pending/unpaid"  },
  { id: "session_frequency", label: "Frequenza sessioni",   sub: "Per giorno della settimana" },
  { id: "top_locations",     label: "Sedi principali",      sub: "Top 5 per numero sessioni"  },
]

const ALL_IDS = WIDGETS.map((w) => w.id)

interface Props { currentPrefs: AnalyticsPrefs }

export function AnalyticsPrefsForm({ currentPrefs }: Props) {
  const [widgets,      setWidgets]      = useState<AnalyticsWidgetId[]>(currentPrefs.widgets ?? ALL_IDS)
  const [finYear,      setFinYear]      = useState<"jan" | "apr">(currentPrefs.financial_year ?? "jan")
  const [goalMonthly,  setGoalMonthly]  = useState<string>(currentPrefs.goal_monthly ? String(currentPrefs.goal_monthly) : "")
  const [goalAnnual,   setGoalAnnual]   = useState<string>(currentPrefs.goal_annual  ? String(currentPrefs.goal_annual)  : "")
  const [loading,      setLoading]      = useState(false)
  const [saved,        setSaved]        = useState(false)
  const [error,        setError]        = useState<string | null>(null)

  function toggleWidget(id: AnalyticsWidgetId) {
    setWidgets((prev) =>
      prev.includes(id)
        ? prev.length > 1 ? prev.filter((w) => w !== id) : prev  // almeno 1 attivo
        : [...prev, id]
    )
    setSaved(false)
  }

  async function handleSave() {
    setLoading(true)
    setError(null)
    setSaved(false)
    const res = await updateAnalyticsPrefs({
      widgets:        widgets,
      financial_year: finYear,
      goal_monthly:   goalMonthly  ? parseFloat(goalMonthly)  : null,
      goal_annual:    goalAnnual   ? parseFloat(goalAnnual)   : null,
    })
    setLoading(false)
    if (res.error) { setError(res.error); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6">

      {/* Widget picker */}
      <div>
        <p className="mb-2 text-xs font-semibold text-foreground">Widget visibili</p>
        <p className="mb-3 text-[11px] text-muted-foreground">Scegli quali grafici mostrare nella pagina analytics.</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {WIDGETS.map((w) => {
            const active = widgets.includes(w.id)
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => toggleWidget(w.id)}
                className={cn(
                  "relative flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all",
                  active
                    ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                    : "border-border/50 bg-white/50 hover:border-border hover:bg-white/80",
                )}
              >
                {active && (
                  <div className="absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                    <Check className="h-2.5 w-2.5 text-white" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{w.label}</p>
                  <p className="text-[11px] text-muted-foreground">{w.sub}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Anno finanziario */}
      <div>
        <p className="mb-2 text-xs font-semibold text-foreground">Anno finanziario</p>
        <div className="flex gap-3">
          {(["jan", "apr"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => { setFinYear(v); setSaved(false) }}
              className={cn(
                "rounded-xl border px-4 py-2 text-sm font-medium transition-all",
                finYear === v
                  ? "border-primary/40 bg-primary/5 text-primary ring-1 ring-primary/20"
                  : "border-border/50 bg-white/50 text-muted-foreground hover:border-border",
              )}
            >
              {v === "jan" ? "Gen – Dic" : "Apr – Mar (UK)"}
            </button>
          ))}
        </div>
      </div>

      {/* Obiettivi */}
      <div>
        <p className="mb-2 text-xs font-semibold text-foreground">Obiettivi (opzionale)</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex items-center rounded-xl border border-border bg-white/70 focus-within:ring-1 focus-within:ring-primary/30">
            <span className="pl-3 text-sm text-muted-foreground">€</span>
            <input
              type="number" min="0" step="50"
              placeholder="Mensile"
              value={goalMonthly}
              onChange={(e) => { setGoalMonthly(e.target.value); setSaved(false) }}
              className="w-32 bg-transparent px-2 py-2 text-sm focus:outline-none"
            />
            <span className="pr-3 text-xs text-muted-foreground">/mese</span>
          </div>
          <div className="flex items-center rounded-xl border border-border bg-white/70 focus-within:ring-1 focus-within:ring-primary/30">
            <span className="pl-3 text-sm text-muted-foreground">€</span>
            <input
              type="number" min="0" step="100"
              placeholder="Annuale"
              value={goalAnnual}
              onChange={(e) => { setGoalAnnual(e.target.value); setSaved(false) }}
              className="w-32 bg-transparent px-2 py-2 text-sm focus:outline-none"
            />
            <span className="pr-3 text-xs text-muted-foreground">/anno</span>
          </div>
        </div>
      </div>

      {/* Salva */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Salvataggio…" : saved ? "✓ Salvato" : "Salva preferenze"}
        </button>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

    </div>
  )
}
