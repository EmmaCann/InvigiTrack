"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Trash2,
  MapPin,
  CalendarCheck,
  Download,
  Clock,
  ChevronRight,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { SessionDialog } from "./session-dialog"
import { changePaymentStatus, removeSession } from "@/app/actions/sessions"
import type { Session, Profile, PaymentStatus } from "@/types/database"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CYCLE: Record<PaymentStatus, PaymentStatus> = {
  unpaid:  "pending",
  pending: "paid",
  paid:    "unpaid",
}

const STATUS_CONFIG: Record<PaymentStatus, { label: string; className: string; dot: string }> = {
  unpaid: {
    label: "Unpaid",
    className: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/50",
    dot: "bg-amber-400",
  },
  pending: {
    label: "Pending",
    className: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800/50",
    dot: "bg-blue-400",
  },
  paid: {
    label: "Paid",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50",
    dot: "bg-emerald-400",
  },
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "short",
    day:     "numeric",
    month:   "short",
  })
}

function formatTime(t: string) { return t.slice(0, 5) }

function formatMonthKey(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", {
    month: "long",
    year:  "numeric",
  })
}

function groupByMonth(sessions: Session[]) {
  const map = new Map<string, Session[]>()
  for (const s of sessions) {
    const key = formatMonthKey(s.session_date)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(s)
  }
  return map
}

function thisMonthStats(sessions: Session[]) {
  const now = new Date()
  const m = sessions.filter((s) => {
    const d = new Date(s.session_date + "T00:00:00")
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  return {
    count:   m.length,
    hours:   m.reduce((a, s) => a + s.duration_minutes / 60, 0),
    earned:  m.reduce((a, s) => a + s.earned, 0),
    unpaid:  m.filter((s) => s.payment_status !== "paid").reduce((a, s) => a + s.earned, 0),
  }
}

function exportCSV(sessions: Session[]) {
  const headers = ["Date","Start","End","Duration (min)","Location","Exam","Role","Rate (£)","Earned (£)","Status"]
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
  const csv  = [headers, ...rows].map((r) => r.join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement("a"), { href: url, download: `sessions-${todayStr()}.csv` })
  a.click()
  URL.revokeObjectURL(url)
}

function todayStr() { return new Date().toISOString().split("T")[0] }

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  sessions: Session[]
  profile:  Profile
}

// ─── Componente ──────────────────────────────────────────────────────────────

export function SessionList({ sessions, profile }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmId, setConfirmId]   = useState<string | null>(null)

  const grouped = groupByMonth(sessions)
  const stats   = thisMonthStats(sessions)

  function handleStatusClick(session: Session) {
    startTransition(async () => {
      await changePaymentStatus(session.id, STATUS_CYCLE[session.payment_status])
      router.refresh()
    })
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    await removeSession(id)
    setDeletingId(null)
    setConfirmId(null)
    router.refresh()
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 py-24 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <CalendarCheck className="h-7 w-7 text-primary" />
        </div>
        <p className="text-base font-semibold text-foreground">No sessions yet</p>
        <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
          Log your first session using the <strong>New Session</strong> button above.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* ── Stats this month ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "This month",    value: `${stats.count}`,                   sub: "sessions",      color: "text-foreground"   },
          { label: "Hours logged",  value: `${stats.hours.toFixed(1)}`,         sub: "hours",         color: "text-blue-600"     },
          { label: "Total earned",  value: `£${stats.earned.toFixed(2)}`,       sub: "this month",    color: "text-emerald-600"  },
          { label: "Awaiting",      value: `£${stats.unpaid.toFixed(2)}`,       sub: "unpaid",        color: "text-amber-600"    },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card px-4 py-3.5 shadow-sm">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className={`mt-1 text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[11px] text-muted-foreground">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Toolbar ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end">
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-xs font-medium"
          onClick={() => exportCSV(sessions)}
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </Button>
      </div>

      {/* ── Grouped list ───────────────────────────────────────────── */}
      <div className="space-y-8">
        {Array.from(grouped.entries()).map(([month, items]) => {
          const monthTotal  = items.reduce((a, s) => a + s.earned, 0)
          const monthHours  = items.reduce((a, s) => a + s.duration_minutes / 60, 0)

          return (
            <div key={month}>
              {/* Month header */}
              <div className="mb-3 flex items-center gap-3">
                <h3 className="text-sm font-bold text-foreground">{month}</h3>
                <div className="h-px flex-1 bg-border" />
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {monthHours.toFixed(1)}h
                  </span>
                  <ChevronRight className="h-3 w-3" />
                  <span className="font-semibold text-foreground">£{monthTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Session cards */}
              <div className="space-y-2">
                {items.map((session) => {
                  const meta       = session.metadata as { exam_name?: string; role_type?: string }
                  const statusConf = STATUS_CONFIG[session.payment_status]
                  const isConf     = confirmId === session.id
                  const isDel      = deletingId === session.id

                  return (
                    <div
                      key={session.id}
                      className="group relative flex flex-col gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center"
                    >
                      {/* Status accent bar */}
                      <div className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-full ${statusConf.dot}`} />

                      {/* Left: info */}
                      <div className="flex min-w-0 flex-1 flex-col gap-1 pl-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-foreground truncate">
                            {meta.exam_name ?? "Session"}
                          </span>
                          <span className="rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-medium capitalize text-muted-foreground">
                            {meta.role_type ?? profile.role_type}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                          <span>{formatDate(session.session_date)}</span>
                          <span className="text-border">·</span>
                          <span>{formatTime(session.start_time)} – {formatTime(session.end_time)}</span>
                          <span className="text-border">·</span>
                          <span className="font-medium text-foreground/70">
                            {Math.floor(session.duration_minutes / 60) > 0
                              ? `${Math.floor(session.duration_minutes / 60)}h${session.duration_minutes % 60 > 0 ? ` ${session.duration_minutes % 60}min` : ""}`
                              : `${session.duration_minutes}min`
                            }
                          </span>
                          {session.location && (
                            <>
                              <span className="text-border">·</span>
                              <span className="flex items-center gap-0.5">
                                <MapPin className="h-3 w-3" />
                                {session.location}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Right: earned + status + actions */}
                      <div className="flex items-center gap-3 pl-3 sm:pl-0">
                        <span className="text-base font-bold text-foreground tabular-nums">
                          £{session.earned.toFixed(2)}
                        </span>

                        {/* Status badge cliccabile */}
                        <button
                          onClick={() => handleStatusClick(session)}
                          className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer ${statusConf.className}`}
                          title="Click to change payment status"
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${statusConf.dot}`} />
                          {statusConf.label}
                        </button>

                        {/* Azioni — visibili all'hover */}
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <SessionDialog profile={profile} session={session} />

                          {isConf ? (
                            <div className="flex items-center gap-1 ml-1">
                              <button
                                onClick={() => handleDelete(session.id)}
                                disabled={isDel}
                                className="rounded-lg px-2.5 py-1 text-[11px] font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                              >
                                {isDel ? "…" : "Delete"}
                              </button>
                              <button
                                onClick={() => setConfirmId(null)}
                                className="rounded-lg px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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
          )
        })}
      </div>
    </div>
  )
}
