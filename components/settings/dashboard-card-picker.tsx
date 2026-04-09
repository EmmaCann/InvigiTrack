"use client"

import { useState } from "react"
import { Clock, Euro, AlertCircle, CalendarCheck, TrendingUp, CheckCircle2, BarChart2, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { updateDashboardPrefs } from "@/app/actions/settings"
import type { DashboardCardId, DashboardPrefs } from "@/types/database"

// --- Definizione card disponibili ---------------------------------------------

interface CardDef {
  id:      DashboardCardId
  label:   string
  sub:     string
  icon:    React.ElementType
  color:   string
  bg:      string
}

const AVAILABLE_CARDS: CardDef[] = [
  { id: "hours_month",    label: "Ore questo mese",   sub: "registrate",        icon: Clock,         color: "text-blue-600",    bg: "bg-blue-500/10"    },
  { id: "total_earned",   label: "Guadagno totale",   sub: "storico",           icon: Euro,          color: "text-emerald-600", bg: "bg-emerald-500/10" },
  { id: "unpaid",         label: "Non pagato",         sub: "in attesa",         icon: AlertCircle,   color: "text-amber-600",   bg: "bg-amber-500/10"   },
  { id: "sessions_count", label: "Sessioni",           sub: "totali",            icon: CalendarCheck, color: "text-primary",     bg: "bg-primary/10"     },
  { id: "earned_month",   label: "Questo mese",        sub: "guadagnato",        icon: TrendingUp,    color: "text-violet-600",  bg: "bg-violet-500/10"  },
  { id: "paid",           label: "Già ricevuto",       sub: "pagato",            icon: CheckCircle2,  color: "text-teal-600",    bg: "bg-teal-500/10"    },
  { id: "avg_hourly",     label: "Tariffa media",      sub: "per ora",           icon: BarChart2,     color: "text-rose-600",    bg: "bg-rose-500/10"    },
]

const DEFAULT_CARDS: DashboardCardId[] = ["hours_month", "total_earned", "unpaid", "sessions_count"]
const MAX_CARDS = 4

// --- Componente principale ----------------------------------------------------

interface Props {
  currentPrefs: DashboardPrefs
}

export function DashboardCardPicker({ currentPrefs }: Props) {
  const initial  = currentPrefs.cards ?? DEFAULT_CARDS
  const [selected, setSelected] = useState<DashboardCardId[]>(initial)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [saved,    setSaved]    = useState(false)

  function toggle(id: DashboardCardId) {
    setSaved(false)
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((c) => c !== id)
      if (prev.length >= MAX_CARDS) return prev  // max 4
      return [...prev, id]
    })
  }

  async function handleSave() {
    if (selected.length === 0) { setError("Seleziona almeno 1 card"); return }
    setLoading(true)
    setError(null)
    const res = await updateDashboardPrefs({ cards: selected })
    setLoading(false)
    if (res.error) { setError(res.error); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-5">
      <p className="text-[11px] text-muted-foreground">
        Scegli fino a {MAX_CARDS} card da visualizzare nella dashboard.
        Selezionate: <strong>{selected.length}/{MAX_CARDS}</strong>
      </p>

      {/* Griglia card */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {AVAILABLE_CARDS.map((card) => {
          const isSelected = selected.includes(card.id)
          const isDisabled = !isSelected && selected.length >= MAX_CARDS
          const Icon = card.icon

          return (
            <button
              key={card.id}
              type="button"
              onClick={() => toggle(card.id)}
              disabled={isDisabled}
              className={cn(
                "relative flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all",
                isSelected
                  ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                  : isDisabled
                    ? "border-border/40 bg-muted/30 opacity-40 cursor-not-allowed"
                    : "border-border/60 bg-white/50 hover:border-primary/30 hover:bg-white/80",
              )}
            >
              {/* Check indicator */}
              {isSelected && (
                <span className="absolute right-3 top-3 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                  <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                </span>
              )}

              {/* Icona */}
              <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", card.bg)}>
                <Icon className={cn("h-4 w-4", card.color)} />
              </div>

              {/* Testo */}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground leading-tight">{card.label}</p>
                <p className="text-xs text-muted-foreground">{card.sub}</p>
              </div>
            </button>
          )
        })}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={loading || selected.length === 0}
        className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {loading ? "Salvataggio…" : saved ? "✓ Salvato" : "Salva preferenze"}
      </button>
    </div>
  )
}
