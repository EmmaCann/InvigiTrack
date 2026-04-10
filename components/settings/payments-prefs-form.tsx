"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { updatePaymentsPrefs } from "@/app/actions/settings"
import type { PaymentsPrefs } from "@/types/database"

const TAB_OPTIONS: { value: "pending" | "history"; label: string; sub: string }[] = [
  { value: "pending", label: "Da pagare",   sub: "Apre sulla lista sessioni non pagate" },
  { value: "history", label: "Storico",     sub: "Apre sullo storico dei pagamenti ricevuti" },
]

interface Props { currentPrefs: PaymentsPrefs }

export function PaymentsPrefsForm({ currentPrefs }: Props) {
  const [tab,     setTab]     = useState<"pending" | "history">(currentPrefs.default_tab ?? "pending")
  const [loading, setLoading] = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleSave() {
    setLoading(true); setError(null); setSaved(false)
    const res = await updatePaymentsPrefs({ default_tab: tab })
    setLoading(false)
    if (res.error) { setError(res.error); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs font-semibold text-foreground">Tab predefinita</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {TAB_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => { setTab(o.value); setSaved(false) }}
              className={cn(
                "rounded-xl border px-4 py-3 text-left text-sm transition-all",
                tab === o.value
                  ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                  : "border-border/50 bg-white/50 hover:border-border",
              )}
            >
              <p className={cn("font-semibold", tab === o.value ? "text-primary" : "text-foreground")}>{o.label}</p>
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
