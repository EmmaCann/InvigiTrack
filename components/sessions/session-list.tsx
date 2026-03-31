"use client"

/**
 * Lista sessioni con tutte le azioni inline.
 *
 * Funzionalità:
 * - Raggruppata per mese
 * - Payment badge cliccabile (unpaid → pending → paid)
 * - Edit via SessionSheet
 * - Delete con conferma inline
 * - Stats mensili in cima
 * - CSV export
 */

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Trash2,
  MapPin,
  CalendarCheck,
  Download,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SessionSheet } from "./session-sheet"
import { changePaymentStatus, removeSession } from "@/app/actions/sessions"
import type { Session, Profile, PaymentStatus } from "@/types/database"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CYCLE: Record<PaymentStatus, PaymentStatus> = {
  unpaid:  "pending",
  pending: "paid",
  paid:    "unpaid",
}

const STATUS_STYLE: Record<PaymentStatus, string> = {
  unpaid:  "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
  pending: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
  paid:    "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
}

const STATUS_LABEL: Record<PaymentStatus, string> = {
  unpaid:  "Unpaid",
  pending: "Pending",
  paid:    "Paid",
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "short",
    day:     "numeric",
    month:   "short",
  })
}

function formatTime(timeStr: string) {
  return timeStr.slice(0, 5)
}

function formatMonthKey(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", {
    month: "long",
    year:  "numeric",
  })
}

function groupByMonth(sessions: Session[]): Map<string, Session[]> {
  const map = new Map<string, Session[]>()
  for (const s of sessions) {
    const key = formatMonthKey(s.session_date)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(s)
  }
  return map
}

function monthStats(sessions: Session[]) {
  const now = new Date()
  const thisMonth = sessions.filter((s) => {
    const d = new Date(s.session_date + "T00:00:00")
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const hours   = thisMonth.reduce((a, s) => a + s.duration_minutes / 60, 0)
  const earned  = thisMonth.reduce((a, s) => a + s.earned, 0)
  const unpaid  = thisMonth.filter((s) => s.payment_status !== "paid").reduce((a, s) => a + s.earned, 0)
  return { count: thisMonth.length, hours, earned, unpaid }
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

function exportCSV(sessions: Session[]) {
  const headers = ["Date", "Start", "End", "Duration (min)", "Location", "Exam", "Role", "Rate (£)", "Earned (£)", "Status"]
  const rows = sessions.map((s) => {
    const meta = s.metadata as { exam_name?: string; role_type?: string }
    return [
      s.session_date,
      formatTime(s.start_time),
      formatTime(s.end_time),
      s.duration_minutes,
      s.location ?? "",
      meta.exam_name ?? "",
      meta.role_type ?? "",
      s.hourly_rate.toFixed(2),
      s.earned.toFixed(2),
      s.payment_status,
    ]
  })
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement("a")
  a.href     = url
  a.download = `invigitrack-sessions-${new Date().toISOString().split("T")[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  sessions: Session[]
  profile:  Profile
}

// ─── Componente ──────────────────────────────────────────────────────────────

export function SessionList({ sessions, profile }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId]  = useState<string | null>(null)
  const [confirmId, setConfirmId]    = useState<string | null>(null)

  const lastSession = sessions[0] ?? undefined
  const grouped     = groupByMonth(sessions)
  const stats       = monthStats(sessions)

  // ── Payment status cycling ─────────────────────────────────────────────────
  function handleStatusClick(session: Session) {
    const next = STATUS_CYCLE[session.payment_status]
    startTransition(async () => {
      await changePaymentStatus(session.id, next)
      router.refresh()
    })
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  async function handleDelete(sessionId: string) {
    setDeletingId(sessionId)
    await removeSession(sessionId)
    setDeletingId(null)
    setConfirmId(null)
    router.refresh()
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (sessions.length === 0) {
    return (
      <Card className="shadow-none border-border">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
            <CalendarCheck className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-base font-semibold text-foreground">No sessions yet</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Log your first invigilation session using the button above.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">

      {/* ── Stats mensili ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Sessions this month", value: stats.count.toString() },
          { label: "Hours this month",    value: `${stats.hours.toFixed(1)}h` },
          { label: "Earned this month",   value: `£${stats.earned.toFixed(2)}` },
          { label: "Awaiting payment",    value: `£${stats.unpaid.toFixed(2)}` },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="mt-0.5 text-lg font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ── Toolbar ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => exportCSV(sessions)}
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </Button>
      </div>

      {/* ── Lista per mese ─────────────────────────────────────────── */}
      {Array.from(grouped.entries()).map(([month, items]) => (
        <div key={month} className="space-y-2">

          {/* Month header */}
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {month}
            </h3>
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">
              {items.length} session{items.length !== 1 ? "s" : ""} ·{" "}
              £{items.reduce((a, s) => a + s.earned, 0).toFixed(2)}
            </span>
          </div>

          {/* Session rows */}
          <div className="space-y-2">
            {items.map((session) => {
              const meta = session.metadata as { exam_name?: string; role_type?: string }
              const isDeleting = deletingId === session.id
              const isConfirming = confirmId === session.id

              return (
                <div
                  key={session.id}
                  className="group flex flex-col gap-2 rounded-xl border border-border bg-card px-4 py-3 sm:flex-row sm:items-center"
                >
                  {/* ── Info principale ─────────────────────────── */}
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground truncate">
                        {meta.exam_name ?? "Session"}
                      </span>
                      <Badge variant="outline" className="text-[10px] shrink-0 capitalize">
                        {meta.role_type ?? profile.role_type}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span>{formatDate(session.session_date)}</span>
                      <span>{formatTime(session.start_time)} – {formatTime(session.end_time)}</span>
                      <span>{session.duration_minutes}min</span>
                      {session.location && (
                        <span className="flex items-center gap-0.5">
                          <MapPin className="h-3 w-3" />
                          {session.location}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ── Earned ──────────────────────────────────── */}
                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className="text-sm font-bold text-foreground">
                      £{session.earned.toFixed(2)}
                    </span>

                    {/* Payment badge — cliccabile */}
                    <button
                      onClick={() => handleStatusClick(session)}
                      disabled={isPending}
                      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors cursor-pointer ${STATUS_STYLE[session.payment_status]}`}
                      title="Click to cycle payment status"
                    >
                      {STATUS_LABEL[session.payment_status]}
                    </button>

                    {/* ── Azioni ────────────────────────────────── */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <SessionSheet
                        profile={profile}
                        session={session}
                      />

                      {/* Delete con conferma inline */}
                      {isConfirming ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(session.id)}
                            disabled={isDeleting}
                            className="rounded px-2 py-1 text-[11px] font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                          >
                            {isDeleting ? "…" : "Delete"}
                          </button>
                          <button
                            onClick={() => setConfirmId(null)}
                            className="rounded px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setConfirmId(session.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
