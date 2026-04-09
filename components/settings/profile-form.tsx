"use client"

import { useState } from "react"
import { User } from "lucide-react"
import { updateProfileName } from "@/app/actions/settings"

interface Props {
  fullName:  string | null
  email:     string
}

export function ProfileForm({ fullName, email }: Props) {
  const [name,    setName]    = useState(fullName ?? "")
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [saved,   setSaved]   = useState(false)

  async function handleSave() {
    setLoading(true)
    setError(null)
    setSaved(false)
    const res = await updateProfileName(name)
    setLoading(false)
    if (res.error) { setError(res.error); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const isDirty = name.trim() !== (fullName ?? "").trim()

  return (
    <div className="space-y-5">
      {/* Nome */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Nome visualizzato
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setSaved(false) }}
          placeholder="Il tuo nome"
          className="w-full rounded-xl border border-border bg-white/60 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Email — sola lettura */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Email
        </label>
        <div className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-muted/40 px-3.5 py-2.5">
          <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
          <span className="text-sm text-muted-foreground">{email}</span>
        </div>
        <p className="text-[11px] text-muted-foreground/60">
          L'email non è modificabile da qui.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={loading || !isDirty || !name.trim()}
        className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {loading ? "Salvataggio…" : saved ? "✓ Salvato" : "Salva nome"}
      </button>
    </div>
  )
}
