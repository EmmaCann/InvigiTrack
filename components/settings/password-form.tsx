"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { changePassword } from "@/app/actions/settings"

export function PasswordForm() {
  const [current,  setCurrent]  = useState("")
  const [next,     setNext]     = useState("")
  const [confirm,  setConfirm]  = useState("")
  const [showCur,  setShowCur]  = useState(false)
  const [showNew,  setShowNew]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [saved,    setSaved]    = useState(false)

  const mismatch = next && confirm && next !== confirm

  async function handleSave() {
    if (!current || !next || !confirm) return
    if (next !== confirm) { setError("Le password non coincidono"); return }

    setLoading(true)
    setError(null)
    setSaved(false)
    const res = await changePassword(current, next)
    setLoading(false)

    if (res.error) { setError(res.error); return }

    setSaved(true)
    setCurrent(""); setNext(""); setConfirm("")
    setTimeout(() => setSaved(false), 4000)
  }

  function PasswordInput({
    label, value, onChange, show, onToggle, placeholder,
  }: {
    label: string; value: string; onChange: (v: string) => void
    show: boolean; onToggle: () => void; placeholder?: string
  }) {
    return (
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </label>
        <div className="flex items-center rounded-xl border border-border bg-white/60 focus-within:ring-2 focus-within:ring-primary/30">
          <input
            type={show ? "text" : "password"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-transparent px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
          />
          <button
            type="button"
            onClick={onToggle}
            className="px-3 text-muted-foreground/50 hover:text-muted-foreground"
            tabIndex={-1}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PasswordInput
        label="Password attuale"
        value={current}
        onChange={setCurrent}
        show={showCur}
        onToggle={() => setShowCur((v) => !v)}
        placeholder="••••••••"
      />
      <PasswordInput
        label="Nuova password"
        value={next}
        onChange={setNext}
        show={showNew}
        onToggle={() => setShowNew((v) => !v)}
        placeholder="Minimo 8 caratteri"
      />

      {/* Conferma */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Conferma nuova password
        </label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••"
          className={`w-full rounded-xl border bg-white/60 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
            mismatch ? "border-destructive" : "border-border"
          }`}
        />
        {mismatch && (
          <p className="text-[11px] text-destructive">Le password non coincidono</p>
        )}
      </div>

      {error  && <p className="text-sm text-destructive">{error}</p>}
      {saved  && <p className="text-sm text-emerald-600 font-medium">✓ Password aggiornata</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={loading || !current || !next || !confirm || !!mismatch}
        className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {loading ? "Aggiornamento…" : "Cambia password"}
      </button>
    </div>
  )
}
