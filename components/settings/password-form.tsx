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
    setLoading(true); setError(null); setSaved(false)
    const res = await changePassword(current, next)
    setLoading(false)
    if (res.error) { setError(res.error); return }
    setSaved(true)
    setCurrent(""); setNext(""); setConfirm("")
    setTimeout(() => setSaved(false), 4000)
  }

  const inputCls = "flex-1 bg-transparent px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
  const wrapCls  = "flex items-center rounded-xl border border-border bg-white/60 focus-within:ring-2 focus-within:ring-primary/30"
  const labelCls = "text-xs font-semibold uppercase tracking-wide text-muted-foreground"
  const eyeCls   = "px-3 text-muted-foreground/50 hover:text-muted-foreground"

  return (
    <div className="space-y-5">

      {/* Password attuale */}
      <div className="space-y-1.5">
        <label className={labelCls}>Password attuale</label>
        <div className={wrapCls}>
          <input
            type={showCur ? "text" : "password"}
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            placeholder="••••••••"
            className={inputCls}
          />
          <button type="button" onClick={() => setShowCur((v) => !v)} className={eyeCls} tabIndex={-1}>
            {showCur ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Nuova password */}
      <div className="space-y-1.5">
        <label className={labelCls}>Nuova password</label>
        <div className={wrapCls}>
          <input
            type={showNew ? "text" : "password"}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            placeholder="Minimo 6 caratteri"
            className={inputCls}
          />
          <button type="button" onClick={() => setShowNew((v) => !v)} className={eyeCls} tabIndex={-1}>
            {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Conferma */}
      <div className="space-y-1.5">
        <label className={labelCls}>Conferma nuova password</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••"
          className={`w-full rounded-xl border bg-white/60 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
            mismatch ? "border-destructive" : "border-border"
          }`}
        />
        {mismatch && <p className="text-[11px] text-destructive">Le password non coincidono</p>}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {saved && <p className="text-sm font-medium text-emerald-600">✓ Password aggiornata</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={loading || !current || !next || !confirm || !!mismatch}
        className="cursor-pointer rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {loading ? "Aggiornamento…" : "Cambia password"}
      </button>
    </div>
  )
}
