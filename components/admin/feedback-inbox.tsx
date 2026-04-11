"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react"
import { markFeedbackReadAction } from "@/app/actions/feedback"
import { cn } from "@/lib/utils"
import type { Feedback, FeedbackType } from "@/types/database"

const TYPE_CONFIG: Record<FeedbackType, { label: string; emoji: string; color: string; bg: string }> = {
  feature_request: { label: "Funzionalità", emoji: "💡", color: "text-blue-700",   bg: "bg-blue-50 border-blue-200"    },
  bug_report:      { label: "Problema",      emoji: "🐛", color: "text-red-700",    bg: "bg-red-50 border-red-200"      },
  suggestion:      { label: "Altro",          emoji: "💬", color: "text-violet-700", bg: "bg-violet-50 border-violet-200" },
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (m < 1) return "Adesso"
  if (m < 60) return `${m}min fa`
  if (h < 24) return `${h}h fa`
  return `${d}g fa`
}

export function FeedbackInbox({ initialFeedback }: { initialFeedback: Feedback[] }) {
  const [feedbackList, setFeedbackList] = useState(initialFeedback)
  const [expandedId,   setExpandedId]   = useState<string | null>(null)
  const [loadingId,    setLoadingId]    = useState<string | null>(null)

  const newCount  = feedbackList.filter((f) => f.status === "new").length
  const readCount = feedbackList.filter((f) => f.status === "read").length

  async function handleMarkRead(id: string) {
    setLoadingId(id)
    const res = await markFeedbackReadAction(id)
    setLoadingId(null)
    if (!res.error) {
      setFeedbackList((prev) => prev.map((f) => f.id === id ? { ...f, status: "read" as const } : f))
    }
  }

  if (feedbackList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="text-4xl">📭</span>
        <p className="mt-3 text-sm text-muted-foreground">Nessun feedback ancora</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex gap-4">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-center">
          <p className="text-xl font-bold text-red-600">{newCount}</p>
          <p className="text-[11px] text-red-500">Nuovi</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-muted/30 px-4 py-2.5 text-center">
          <p className="text-xl font-bold text-muted-foreground">{readCount}</p>
          <p className="text-[11px] text-muted-foreground">Letti</p>
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {feedbackList.map((f) => {
          const conf     = TYPE_CONFIG[f.type]
          const expanded = expandedId === f.id
          return (
            <div
              key={f.id}
              className={cn(
                "rounded-2xl border bg-white/60 transition-all",
                f.status === "new" ? "border-primary/20 shadow-sm" : "border-border/40",
              )}
            >
              {/* Row header */}
              <button
                type="button"
                onClick={() => setExpandedId(expanded ? null : f.id)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
              >
                {/* Badge tipo */}
                <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold", conf.bg, conf.color)}>
                  {conf.emoji} {conf.label}
                </span>

                {/* Oggetto + email */}
                <div className="min-w-0 flex-1">
                  <p className={cn("truncate text-sm font-semibold", f.status === "new" ? "text-foreground" : "text-foreground/70")}>
                    {f.subject}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {f.user_email ?? "Utente anonimo"} · {timeAgo(f.created_at)}
                  </p>
                </div>

                {/* Badge nuovo */}
                {f.status === "new" && (
                  <span className="shrink-0 rounded-full bg-red-500 px-2 py-0.5 text-[9px] font-bold text-white">
                    NUOVO
                  </span>
                )}

                {expanded
                  ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                  : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                }
              </button>

              {/* Expanded content */}
              {expanded && (
                <div className="border-t border-border/30 px-4 py-3.5">
                  <p className="whitespace-pre-wrap text-sm text-foreground">{f.message}</p>
                  {f.status === "new" && (
                    <button
                      onClick={() => handleMarkRead(f.id)}
                      disabled={loadingId === f.id}
                      className="mt-3 flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-opacity hover:opacity-80 disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {loadingId === f.id ? "Aggiornamento…" : "Segna come letto"}
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
