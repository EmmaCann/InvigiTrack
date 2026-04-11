"use client"

import { useState } from "react"
import { Send } from "lucide-react"
import { createNotificationAction } from "@/app/actions/notifications"
import { cn } from "@/lib/utils"
import type { PlatformRole } from "@/types/database"

type TargetType = "all" | "role" | "user"
type NotifType  = "system" | "update" | "maintenance"

const TARGET_OPTIONS: { value: TargetType; label: string; sub: string }[] = [
  { value: "all",  label: "Tutti gli utenti", sub: "Visibile a chiunque"          },
  { value: "role", label: "Per ruolo",         sub: "Solo utenti con ruolo specifico" },
  { value: "user", label: "Utente specifico",  sub: "Cerca per email"             },
]

const TYPE_OPTIONS: { value: NotifType; label: string; emoji: string }[] = [
  { value: "system",      label: "Sistema",       emoji: "ℹ️"  },
  { value: "update",      label: "Aggiornamento",  emoji: "🔧" },
  { value: "maintenance", label: "Manutenzione",   emoji: "⚠️"  },
]

const ROLE_OPTIONS: { value: PlatformRole; label: string }[] = [
  { value: "user",        label: "Utenti (user)"  },
  { value: "admin",       label: "Admin"          },
  { value: "super_admin", label: "Super Admin"    },
]

export function CreateNotificationForm() {
  const [targetType,    setTargetType]    = useState<TargetType>("all")
  const [targetRole,    setTargetRole]    = useState<PlatformRole>("user")
  const [targetEmail,   setTargetEmail]   = useState("")
  const [notifType,     setNotifType]     = useState<NotifType>("system")
  const [title,         setTitle]         = useState("")
  const [message,       setMessage]       = useState("")
  const [loading,       setLoading]       = useState(false)
  const [success,       setSuccess]       = useState(false)
  const [error,         setError]         = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !message.trim()) return
    setLoading(true); setError(null); setSuccess(false)

    const res = await createNotificationAction({
      target_type:  targetType,
      target_role:  targetType === "role" ? targetRole : null,
      target_user_id: null, // lookup via email non implementato lato client — gestito nel server action
      title:        title.trim(),
      message:      message.trim(),
      type:         notifType,
      // Per target_type="user" passiamo l'email nel title come prefisso [email]
      // Il server action risolve l'email → uuid
      ...(targetType === "user" ? { target_email: targetEmail.trim() } : {}),
    })

    setLoading(false)
    if (res.error) { setError(res.error); return }
    setSuccess(true)
    setTitle(""); setMessage(""); setTargetEmail("")
    setTimeout(() => setSuccess(false), 4000)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Tipo notifica */}
      <div>
        <p className="mb-2 text-xs font-semibold text-foreground">Tipo</p>
        <div className="flex flex-wrap gap-2">
          {TYPE_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setNotifType(o.value)}
              className={cn(
                "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all",
                notifType === o.value
                  ? "border-primary/40 bg-primary/5 text-primary ring-1 ring-primary/20"
                  : "border-border/50 bg-white/50 text-muted-foreground hover:border-border",
              )}
            >
              <span>{o.emoji}</span> {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Destinatario */}
      <div>
        <p className="mb-2 text-xs font-semibold text-foreground">Destinatario</p>
        <div className="grid grid-cols-3 gap-2">
          {TARGET_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setTargetType(o.value)}
              className={cn(
                "flex flex-col rounded-xl border px-3 py-2.5 text-left text-xs transition-all",
                targetType === o.value
                  ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                  : "border-border/50 bg-white/50 hover:border-border",
              )}
            >
              <span className={cn("font-semibold", targetType === o.value ? "text-primary" : "text-foreground")}>
                {o.label}
              </span>
              <span className="text-[10px] text-muted-foreground">{o.sub}</span>
            </button>
          ))}
        </div>

        {/* Sub-selezione per ruolo */}
        {targetType === "role" && (
          <select
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value as PlatformRole)}
            className="mt-2 w-full rounded-xl border border-border bg-white/70 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        )}

        {/* Input email per utente specifico */}
        {targetType === "user" && (
          <input
            type="email"
            placeholder="Email utente…"
            value={targetEmail}
            onChange={(e) => setTargetEmail(e.target.value)}
            required
            className="mt-2 w-full rounded-xl border border-border bg-white/70 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        )}
      </div>

      {/* Titolo */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-foreground">Titolo</label>
        <input
          type="text"
          maxLength={100}
          placeholder="Titolo della notifica…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full rounded-xl border border-border bg-white/70 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
      </div>

      {/* Messaggio */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-foreground">Messaggio</label>
        <textarea
          maxLength={500}
          placeholder="Testo della notifica…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={3}
          className="w-full resize-none rounded-xl border border-border bg-white/70 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
        <p className="mt-0.5 text-right text-[10px] text-muted-foreground/50">{message.length}/500</p>
      </div>

      {error   && <p className="text-xs text-destructive">{error}</p>}
      {success && <p className="text-xs text-emerald-600">✓ Notifica inviata</p>}

      <button
        type="submit"
        disabled={loading || !title.trim() || !message.trim()}
        className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        <Send className="h-3.5 w-3.5" />
        {loading ? "Invio…" : "Invia notifica"}
      </button>
    </form>
  )
}
