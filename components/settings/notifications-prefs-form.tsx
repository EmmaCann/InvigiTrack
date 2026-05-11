"use client"

import { useState, useTransition, useEffect, useCallback } from "react"
import { Mail, Bell, MessageCircle, ChevronDown, ChevronRight, CheckCircle2, AlertTriangle, Loader2, ExternalLink, Smartphone } from "lucide-react"
import { cn } from "@/lib/utils"
import { updateNotificationsPrefs } from "@/app/actions/settings"
import { REMINDER_OPTIONS } from "@/types/database"
import type { NotificationsPrefs } from "@/types/database"

// --- Default prefs ------------------------------------------------------------

function defaultPrefs(): NotificationsPrefs {
  return {
    email:    { enabled: false, address: null, remind_minutes: [1440] },
    push:     { enabled: false, remind_minutes: [1440] },
    telegram: { enabled: false, chat_id: null, remind_minutes: [1440] },
  }
}

// --- Props --------------------------------------------------------------------

interface Props {
  currentPrefs: NotificationsPrefs | null
  profileEmail: string
}

// --- Helpers ------------------------------------------------------------------

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={cn(
        "relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full transition-colors duration-200",
        on ? "bg-primary" : "bg-muted-foreground/30",
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200",
          on ? "translate-x-4" : "translate-x-0.5",
        )}
      />
    </button>
  )
}

function MinutesGrid({
  selected,
  onChange,
}: {
  selected: number[]
  onChange: (v: number[]) => void
}) {
  function toggle(m: number) {
    onChange(
      selected.includes(m)
        ? selected.filter((x) => x !== m)
        : [...selected, m],
    )
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {REMINDER_OPTIONS.map(({ minutes, label }) => {
        const active = selected.includes(minutes)
        return (
          <button
            key={minutes}
            type="button"
            onClick={() => toggle(minutes)}
            className={cn(
              "rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer",
              active
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border/50 bg-muted/30 text-muted-foreground hover:border-primary/30 hover:text-foreground",
            )}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

// --- Push subscription logic --------------------------------------------------

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw     = atob(base64)
  const bytes   = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return bytes.buffer as ArrayBuffer
}

// --- Component ---------------------------------------------------------------

export function NotificationsPrefsForm({ currentPrefs, profileEmail }: Props) {
  const [prefs, setPrefs]         = useState<NotificationsPrefs>(currentPrefs ?? defaultPrefs())
  const [, startTransition]       = useTransition()
  const [saving, setSaving]       = useState(false)
  const [saved,  setSaved]        = useState(false)
  const [error,  setError]        = useState<string | null>(null)

  // FIX: stato separato per "usa altro indirizzo" — disaccoppiato dal valore
  const [useAltroEmail, setUseAltroEmail] = useState(
    currentPrefs?.email?.address != null && currentPrefs.email.address !== ""
  )

  // Push subscription state
  const [pushStatus, setPushStatus] = useState<"unknown" | "subscribed" | "unsubscribed" | "denied">("unknown")
  const [pushLoading, setPushLoading] = useState(false)

  // Check current push subscription on mount
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPushStatus("unsubscribed")
      return
    }
    if (Notification.permission === "denied") {
      setPushStatus("denied")
      return
    }
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setPushStatus(sub ? "subscribed" : "unsubscribed")
      })
    })
  }, [])

  const subscribeToPush = useCallback(async () => {
    if (!VAPID_PUBLIC_KEY) {
      setError("VAPID public key non configurata.")
      return
    }
    setPushLoading(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        setPushStatus("denied")
        return
      }
      const reg = await navigator.serviceWorker.register("/sw.js")
      await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
      const subJson = sub.toJSON()
      const res = await fetch("/api/push/subscribe", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ endpoint: subJson.endpoint, keys: subJson.keys }),
      })
      if (!res.ok) throw new Error("Errore salvataggio")
      setPushStatus("subscribed")
    } catch (err: unknown) {
      setError((err as Error).message ?? "Errore iscrizione notifiche")
    } finally {
      setPushLoading(false)
    }
  }, [])

  const unsubscribeFromPush = useCallback(async () => {
    setPushLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await sub.unsubscribe()
        await fetch("/api/push/subscribe", {
          method:  "DELETE",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ endpoint: sub.endpoint }),
        })
      }
      setPushStatus("unsubscribed")
    } catch (err: unknown) {
      setError((err as Error).message ?? "Errore rimozione notifiche")
    } finally {
      setPushLoading(false)
    }
  }, [])

  function update<K extends keyof NotificationsPrefs>(
    channel: K,
    patch: Partial<NotificationsPrefs[K]>,
  ) {
    setPrefs((prev) => ({
      ...prev,
      [channel]: { ...prev[channel], ...patch },
    }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    startTransition(async () => {
      const result = await updateNotificationsPrefs(prefs)
      setSaving(false)
      if (result.error) {
        setError(result.error)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    })
  }

  // Inizia `false` per far coincidere SSR e hydration; si aggiorna dopo il mount
  const [pushSupported, setPushSupported] = useState(false)
  useEffect(() => {
    setPushSupported("serviceWorker" in navigator && "PushManager" in window)
  }, [])

  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME

  return (
    <div className="space-y-4">

      {/* ── Email ─────────────────────────────────────────────────────────── */}
      <ChannelSection
        icon={Mail}
        title="Email"
        color="indigo"
        enabled={prefs.email.enabled}
        onToggle={(v) => update("email", { enabled: v })}
      >
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Indirizzo di ricezione
          </label>
          <div className="flex flex-col gap-2">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground">
              <input
                type="radio"
                name="email-addr"
                checked={!useAltroEmail}
                onChange={() => {
                  setUseAltroEmail(false)
                  update("email", { address: null })
                }}
                className="accent-primary"
              />
              Usa indirizzo account{" "}
              <span className="text-muted-foreground">({profileEmail})</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground">
              <input
                type="radio"
                name="email-addr"
                checked={useAltroEmail}
                onChange={() => setUseAltroEmail(true)}
                className="accent-primary"
              />
              Altro indirizzo
            </label>
            {useAltroEmail && (
              <input
                type="email"
                placeholder="altra@email.com"
                autoFocus
                value={prefs.email.address ?? ""}
                onChange={(e) => update("email", { address: e.target.value || null })}
                className="ml-6 w-full rounded-xl border border-border/60 bg-white/70 px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary/60"
              />
            )}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Quando inviare il reminder
          </label>
          <MinutesGrid
            selected={prefs.email.remind_minutes}
            onChange={(v) => update("email", { remind_minutes: v })}
          />
        </div>
      </ChannelSection>

      {/* ── Web Push ──────────────────────────────────────────────────────── */}
      <ChannelSection
        icon={Bell}
        title="Notifiche browser"
        color="violet"
        enabled={prefs.push.enabled}
        onToggle={(v) => update("push", { enabled: v })}
      >
        {/* Info requisiti */}
        <div className="rounded-xl border border-border/30 bg-muted/20 px-3.5 py-3 space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Come funziona</p>
          <ul className="space-y-1.5 text-[12px] text-muted-foreground">
            <li className="flex items-start gap-1.5"><span className="mt-0.5 shrink-0">📱</span><span><strong className="text-foreground">iPhone / iPad:</strong> aggiungi prima l&apos;app alla schermata Home (Safari → &quot;Aggiungi a Home&quot;), poi apri da lì e torna qui.</span></li>
            <li className="flex items-start gap-1.5"><span className="mt-0.5 shrink-0">💻</span><span><strong className="text-foreground">Desktop / Android:</strong> funziona su Chrome, Firefox e Edge. Safari su Mac richiede macOS 13+.</span></li>
            <li className="flex items-start gap-1.5"><span className="mt-0.5 shrink-0">🔔</span><span>Il browser ti chiederà il permesso — clicca <strong className="text-foreground">Consenti</strong>. Su Chrome puoi verificare cliccando sull&apos;icona 🔒 accanto all&apos;indirizzo.</span></li>
            <li className="flex items-start gap-1.5"><span className="mt-0.5 shrink-0">🖥️</span><span><strong className="text-foreground">Su Chrome:</strong> la notifica appare solo se la pagina <strong className="text-foreground">non è in primo piano</strong> — minimizza il browser o cambia tab. Se non la vedi, controlla il <strong className="text-foreground">Centro notifiche di Windows</strong> (icona a campana in basso a destra).</span></li>
            <li className="flex items-start gap-1.5"><span className="mt-0.5 shrink-0">📲</span><span>Ogni dispositivo (PC, telefono, tablet) ha una sottoscrizione separata — attiva le notifiche da ciascun dispositivo che vuoi usare.</span></li>
          </ul>
        </div>

        {!pushSupported ? (
          <div className="rounded-xl border border-amber-200/60 bg-amber-50/60 px-3 py-2.5 text-xs text-amber-700">
            Questo browser non supporta le notifiche push. Prova con Chrome o Firefox.
          </div>
        ) : pushStatus === "denied" ? (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2.5 space-y-1">
            <p className="text-xs font-medium text-destructive">Notifiche bloccate</p>
            <p className="text-[11px] text-destructive/80">
              Hai bloccato le notifiche per questo sito. Per riattivarle: clicca sull&apos;icona 🔒 accanto all&apos;indirizzo del browser → Notifiche → Consenti.
            </p>
          </div>
        ) : (
          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Questo dispositivo
            </label>
            {pushStatus === "subscribed" ? (
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Notifiche attive
                </span>
                <button
                  type="button"
                  onClick={unsubscribeFromPush}
                  disabled={pushLoading}
                  className="cursor-pointer rounded-lg border border-border/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
                >
                  {pushLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Disattiva"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={subscribeToPush}
                disabled={pushLoading}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-violet-300/50 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-700 transition-colors hover:bg-violet-100 disabled:opacity-50"
              >
                {pushLoading
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Smartphone className="h-4 w-4" />
                }
                Attiva notifiche su questo dispositivo
              </button>
            )}
          </div>
        )}

        <div>
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Quando inviare il reminder
          </label>
          <MinutesGrid
            selected={prefs.push.remind_minutes}
            onChange={(v) => update("push", { remind_minutes: v })}
          />
        </div>
      </ChannelSection>

      {/* ── Telegram ──────────────────────────────────────────────────────── */}
      <ChannelSection
        icon={MessageCircle}
        title="Telegram"
        color="sky"
        enabled={prefs.telegram.enabled}
        onToggle={(v) => update("telegram", { enabled: v })}
      >
        {/* Istruzioni step-by-step */}
        <div className="rounded-xl border border-border/30 bg-muted/20 px-3.5 py-3 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Come collegare Telegram</p>
          <ol className="space-y-2 text-[12px] text-muted-foreground list-none">
            <li className="flex items-start gap-2">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[9px] font-bold text-sky-700 mt-0.5">1</span>
              <span>
                {botUsername ? (
                  <>
                    Apri il bot{" "}
                    <a
                      href={`https://t.me/${botUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 font-semibold text-sky-600 hover:underline"
                    >
                      @{botUsername} <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                    {" "}su Telegram
                  </>
                ) : (
                  "Apri il bot InvigiTrack su Telegram"
                )}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[9px] font-bold text-sky-700 mt-0.5">2</span>
              <span>
                Premi <strong className="text-foreground">Start</strong> o invia{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">/start</code>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[9px] font-bold text-sky-700 mt-0.5">3</span>
              <span>Il bot ti risponde con il tuo <strong className="text-foreground">Chat ID</strong> — copialo e incollalo qui sotto</span>
            </li>
          </ol>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Il tuo Chat ID
          </label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="es. 123456789"
            value={prefs.telegram.chat_id ?? ""}
            onChange={(e) => update("telegram", { chat_id: e.target.value || null })}
            className="w-full rounded-xl border border-border/60 bg-white/70 px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary/60"
          />
        </div>

        <div>
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Quando inviare il reminder
          </label>
          <MinutesGrid
            selected={prefs.telegram.remind_minutes}
            onChange={(v) => update("telegram", { remind_minutes: v })}
          />
        </div>
      </ChannelSection>

      {/* Feedback */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-xs text-destructive">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Save */}
      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Salvato
          </span>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Salva impostazioni
        </button>
      </div>
    </div>
  )
}

// --- ChannelSection (collapsible) --------------------------------------------

const COLOR_MAP = {
  indigo: {
    icon:   "bg-indigo-100 text-indigo-600",
    badge:  "bg-indigo-50 text-indigo-700 border-indigo-200/60",
    border: "border-indigo-200/50",
    bg:     "bg-indigo-50/30",
  },
  violet: {
    icon:   "bg-violet-100 text-violet-600",
    badge:  "bg-violet-50 text-violet-700 border-violet-200/60",
    border: "border-violet-200/50",
    bg:     "bg-violet-50/30",
  },
  sky: {
    icon:   "bg-sky-100 text-sky-600",
    badge:  "bg-sky-50 text-sky-700 border-sky-200/60",
    border: "border-sky-200/50",
    bg:     "bg-sky-50/30",
  },
} as const

function ChannelSection({
  icon: Icon,
  title,
  color,
  enabled,
  onToggle,
  children,
}: {
  icon:     React.ElementType
  title:    string
  color:    keyof typeof COLOR_MAP
  enabled:  boolean
  onToggle: (v: boolean) => void
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(enabled)
  const colors = COLOR_MAP[color]

  useEffect(() => { if (enabled) setOpen(true) }, [enabled])

  return (
    <div className={cn("rounded-2xl border transition-colors", enabled ? `${colors.border} ${colors.bg}` : "border-border/40 bg-muted/20")}>
      <div className="flex items-center justify-between px-4 py-3.5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex flex-1 cursor-pointer items-center gap-3 text-left"
        >
          <span className={cn("flex h-8 w-8 items-center justify-center rounded-xl", enabled ? colors.icon : "bg-muted text-muted-foreground")}>
            <Icon className="h-4 w-4" />
          </span>
          <span className={cn("text-sm font-semibold", enabled ? "text-foreground" : "text-muted-foreground")}>
            {title}
          </span>
          {open
            ? <ChevronDown  className="h-3.5 w-3.5 text-muted-foreground/50" />
            : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
          }
          {enabled && (
            <span className={cn("ml-auto mr-2 rounded-full border px-2 py-0.5 text-[10px] font-semibold", colors.badge)}>
              Attivo
            </span>
          )}
        </button>
        <Toggle on={enabled} onChange={onToggle} />
      </div>

      {open && (
        <div className="space-y-4 border-t border-border/30 px-4 pb-4 pt-4">
          {children}
        </div>
      )}
    </div>
  )
}
