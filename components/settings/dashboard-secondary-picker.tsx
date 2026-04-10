"use client"

import { useState } from "react"
import { Check, Clock, Euro, AlertCircle, CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"
import { updateDashboardPrefs } from "@/app/actions/settings"
import type { DashboardSecondaryWidget, DashboardPrefs } from "@/types/database"

interface WidgetDef {
  id:    DashboardSecondaryWidget
  label: string
  sub:   string
  icon:  React.ElementType
  color: string
  bg:    string
}

const SECONDARY_WIDGETS: WidgetDef[] = [
  { id: "hours_trend",     label: "Ore lavorate",    sub: "Mini grafico ultimi 6 mesi",         icon: Clock,        color: "text-blue-600",    bg: "bg-blue-500/10"    },
  { id: "earnings_mini",   label: "Guadagni",        sub: "Mini grafico ultimi 6 mesi",         icon: Euro,         color: "text-emerald-600", bg: "bg-emerald-500/10" },
  { id: "unpaid_alerts",   label: "Non pagato",      sub: "Lista sessioni in attesa",           icon: AlertCircle,  color: "text-amber-600",   bg: "bg-amber-500/10"   },
  { id: "calendar_events", label: "Prossimi eventi", sub: "Turni da confermare nel calendario", icon: CalendarDays, color: "text-violet-600",  bg: "bg-violet-500/10"  },
]

const DEFAULT_SECONDARY: DashboardSecondaryWidget[] = ["hours_trend", "unpaid_alerts", "calendar_events"]

interface Props {
  currentPrefs: DashboardPrefs
}

export function DashboardSecondaryPicker({ currentPrefs }: Props) {
  const [selected, setSelected] = useState<DashboardSecondaryWidget[]>(
    currentPrefs.secondary ?? DEFAULT_SECONDARY
  )
  const [loading, setLoading] = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  function toggle(id: DashboardSecondaryWidget) {
    setSelected((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev  // almeno 1
        return prev.filter((w) => w !== id)
      }
      if (prev.length >= 3) return prev    // max 3
      return [...prev, id]
    })
    setSaved(false)
  }

  async function handleSave() {
    setLoading(true); setError(null); setSaved(false)
    const res = await updateDashboardPrefs({ ...currentPrefs, secondary: selected })
    setLoading(false)
    if (res.error) { setError(res.error); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1 text-xs font-semibold text-foreground">Widget colonna laterale</p>
        <p className="mb-3 text-[11px] text-muted-foreground">
          Scegli fino a 3 widget da mostrare nella colonna destra della dashboard.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {SECONDARY_WIDGETS.map((w) => {
            const active    = selected.includes(w.id)
            const maxed     = !active && selected.length >= 3
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => !maxed && toggle(w.id)}
                disabled={maxed}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all",
                  active  ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                          : maxed
                          ? "border-border/40 bg-muted/30 opacity-40"
                          : "border-border/50 bg-white/50 hover:border-border hover:bg-white/80",
                )}
              >
                {active && (
                  <div className="absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                    <Check className="h-2.5 w-2.5 text-white" />
                  </div>
                )}
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${w.bg}`}>
                  <w.icon className={`h-3.5 w-3.5 ${w.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{w.label}</p>
                  <p className="text-[11px] text-muted-foreground">{w.sub}</p>
                </div>
              </button>
            )
          })}
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
