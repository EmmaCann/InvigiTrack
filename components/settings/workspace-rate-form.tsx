"use client"

import { useState } from "react"
import { updateWorkspaceRate } from "@/app/actions/settings"
import type { UserWorkspace } from "@/types/database"

interface Props {
  workspaces:       UserWorkspace[]
  profileRate:      number          // tariffa predefinita del profilo (fallback)
}

function RateRow({ ws, profileRate }: { ws: UserWorkspace; profileRate: number }) {
  const initial = ws.default_hourly_rate ?? null
  const [rate,      setRate]      = useState<string>(initial !== null ? String(initial) : "")
  const [savedRate, setSavedRate] = useState<number | null>(initial)  // tracks last persisted value
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [saved,     setSaved]     = useState(false)

  const currentNum = rate === "" ? null : parseFloat(rate)
  const isDirty    = currentNum !== savedRate

  async function handleSave() {
    setLoading(true)
    setError(null)
    setSaved(false)
    const res = await updateWorkspaceRate(ws.workspaceId, currentNum)
    setLoading(false)
    if (res.error) { setError(res.error); return }
    setSavedRate(currentNum)   // update baseline so isDirty resets
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const subtitleText = savedRate !== null
    ? `Tariffa workspace: £${savedRate.toFixed(2)}/h`
    : `Default profilo: £${profileRate.toFixed(2)}/h`

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border/50 bg-white/50 px-4 py-3.5">
      {/* Icona workspace */}
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base font-bold text-white"
        style={{ backgroundColor: ws.color ?? "#3B82F6" }}
      >
        {ws.emoji ?? ws.label[0].toUpperCase()}
      </span>

      {/* Nome */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground truncate">{ws.label}</p>
        <p className="text-[11px] text-muted-foreground">{subtitleText}</p>
      </div>

      {/* Input tariffa */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center rounded-lg border border-border bg-white/70 focus-within:ring-1 focus-within:ring-primary/30">
          <span className="pl-2.5 text-sm text-muted-foreground">£</span>
          <input
            type="number"
            min="0"
            step="0.50"
            value={rate}
            onChange={(e) => { setRate(e.target.value); setSaved(false) }}
            placeholder={String(profileRate)}
            className="w-20 bg-transparent px-2 py-2 text-sm text-foreground focus:outline-none"
          />
          <span className="pr-2.5 text-xs text-muted-foreground">/h</span>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={loading || !isDirty}
          className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {loading ? "…" : saved ? "✓" : "Salva"}
        </button>
      </div>

      {error && <p className="mt-1 text-xs text-destructive w-full">{error}</p>}
    </div>
  )
}

export function WorkspaceRateForm({ workspaces, profileRate }: Props) {
  return (
    <div className="space-y-2.5">
      <p className="text-[11px] text-muted-foreground">
        Imposta una tariffa specifica per workspace. Se lasciata vuota, viene usata la tariffa predefinita del profilo (£{profileRate.toFixed(2)}/h).
      </p>
      {workspaces.map((ws) => (
        <RateRow key={ws.workspaceId} ws={ws} profileRate={profileRate} />
      ))}
    </div>
  )
}
