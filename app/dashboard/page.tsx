import { getCurrentUser } from "@/lib/data/auth"
import { getProfileById } from "@/lib/data/profiles"
import { getPaymentSummary, getSessionsByUser } from "@/lib/data/sessions"
import { OnboardingDialog } from "@/components/auth/onboarding-dialog"
import { Badge } from "@/components/ui/badge"
import { Clock, PoundSterling, AlertCircle, CalendarCheck, ArrowRight, MapPin, ShieldCheck, BarChart3 } from "lucide-react"
import Link from "next/link"
import type { Session } from "@/types/database"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(t: string) { return t.slice(0, 5) }

const STATUS_STYLE: Record<string, string> = {
  unpaid:  "bg-amber-100/80 text-amber-700 border-amber-200/60",
  pending: "bg-blue-100/80 text-blue-700 border-blue-200/60",
  paid:    "bg-emerald-100/80 text-emerald-700 border-emerald-200/60",
}

const STATUS_LABEL: Record<string, string> = {
  unpaid:  "Non pagato",
  pending: "In attesa",
  paid:    "Pagato",
}


// ─── Pagina ───────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const user = await getCurrentUser()
  const profile = user ? await getProfileById(user.id) : null

  if (!profile) {
    const isAdmin = user?.user_metadata?.platform_role === "admin"
    return <OnboardingDialog isAdmin={isAdmin} />
  }

  const [summary, allSessions] = await Promise.all([
    getPaymentSummary(user!.id),
    getSessionsByUser(user!.id),
  ])

  const recentSessions = allSessions.slice(0, 5)
  const displayName    = profile.full_name ?? profile.email

  // Hours trend — last 6 months
  const monthsData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - (5 - i))
    const key   = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const label = d.toLocaleDateString("it-IT", { month: "short" }).replace(".", "").toUpperCase()
    const hours = allSessions
      .filter((s) => s.session_date.startsWith(key))
      .reduce((a, s) => a + s.duration_minutes / 60, 0)
    return { label, hours, isCurrent: i === 5 }
  })
  const maxMonthHours = Math.max(...monthsData.map((m) => m.hours), 1)

  // Unpaid alerts
  const unpaidAlerts = allSessions.filter((s) => s.payment_status !== "paid").slice(0, 3)
  const unpaidTotal  = allSessions.filter((s) => s.payment_status !== "paid").length

  const stats = [
    {
      label: "Ore questo mese",
      value: summary.total_hours > 0 ? `${summary.total_hours.toFixed(1)}h` : "—",
      sub:   summary.total_hours > 0 ? "registrate" : "nessuna sessione",
      icon:  Clock,
      color: "text-blue-600",
      bg:    "bg-blue-500/10",
    },
    {
      label: "Guadagno totale",
      value: summary.total_earned > 0 ? `£${summary.total_earned.toFixed(2)}` : "—",
      sub:   "storico",
      icon:  PoundSterling,
      color: "text-emerald-600",
      bg:    "bg-emerald-500/10",
    },
    {
      label: "Non pagato",
      value: summary.total_unpaid > 0 ? `£${summary.total_unpaid.toFixed(2)}` : "—",
      sub:   summary.total_unpaid > 0 ? "in attesa" : "tutto in ordine",
      icon:  AlertCircle,
      color: summary.total_unpaid > 0 ? "text-amber-600" : "text-muted-foreground",
      bg:    summary.total_unpaid > 0 ? "bg-amber-500/10" : "bg-muted/50",
    },
    {
      label: "Sessioni",
      value: allSessions.length > 0 ? `${allSessions.length}` : "—",
      sub:   "totali",
      icon:  CalendarCheck,
      color: "text-primary",
      bg:    "bg-primary/10",
    },
  ]

  return (
    <div className="space-y-7">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
            Bentornato/a
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">{displayName}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ecco il riepilogo della tua attività
          </p>
        </div>
        {profile.platform_role === "admin" && (
          <Badge variant="secondary" className="gap-1 text-[11px] bg-primary/10 text-primary border-primary/20">
            <ShieldCheck className="h-3 w-3" /> Admin
          </Badge>
        )}
      </div>

      {/* ── Stat cards — vetro dashboard ───────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="glass-dashboard rounded-2xl px-5 py-5 transition-shadow hover:shadow-[0_12px_40px_rgba(15,23,42,0.08)]"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                {stat.label}
              </p>
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-[1.05rem] w-[1.05rem] ${stat.color}`} />
              </div>
            </div>
            <p className={`text-[1.65rem] font-bold leading-tight tabular-nums ${stat.color}`}>
              {stat.value}
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Main content — 2 colonne ───────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_300px]">

        {/* ── Sessioni recenti (sinistra) ───────────────────────────── */}
        <div className="glass-dashboard rounded-2xl">
          <div className="flex items-start justify-between gap-4 border-b border-white/50 px-5 pb-4 pt-5">
            <div>
              <h3 className="text-base font-semibold text-foreground">Sessioni recenti</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Le tue ultime sessioni registrate
              </p>
            </div>
            <Link
              href="/dashboard/sessions"
              className="mt-0.5 flex shrink-0 items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              Vedi tutte <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="p-4 sm:p-5">
            {recentSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/8 mb-3">
                  <CalendarCheck className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">Nessuna sessione</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Registra la prima sessione per vederla qui.
                </p>
                <Link
                  href="/dashboard/sessions"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  + Prima Sessione
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentSessions.map((session: Session) => {
                  const meta = session.metadata as { exam_name?: string; role_type?: string }
                  return (
                    <div
                      key={session.id}
                      className="glass relative flex flex-wrap items-center gap-4 overflow-hidden rounded-xl px-4 py-3.5 transition-[box-shadow] hover:shadow-[0_8px_28px_rgba(15,23,42,0.06)] sm:flex-nowrap"
                    >
                      {/* Data */}
                      <div className="w-11 shrink-0 text-center">
                        <p className="text-lg font-bold leading-none text-foreground tabular-nums">
                          {new Date(session.session_date + "T00:00:00").getDate()}
                        </p>
                        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {new Date(session.session_date + "T00:00:00").toLocaleDateString("it-IT", { month: "short" })}
                        </p>
                      </div>

                      <div className="hidden h-10 w-px shrink-0 bg-border/50 sm:block" />

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {meta.exam_name ?? "Sessione"}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                          <span>{formatTime(session.start_time)} – {formatTime(session.end_time)}</span>
                          {session.location && (
                            <>
                              <span className="text-border">·</span>
                              <span className="flex items-center gap-0.5">
                                <MapPin className="h-3 w-3 shrink-0" />
                                {session.location}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Earned + Status */}
                      <div className="flex w-full shrink-0 items-center justify-between gap-3 sm:w-auto sm:justify-end">
                        <span className="text-base font-bold tabular-nums text-foreground">
                          £{session.earned.toFixed(2)}
                        </span>
                        <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${STATUS_STYLE[session.payment_status]}`}>
                          {STATUS_LABEL[session.payment_status] ?? session.payment_status}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Destra — Hours Trend + Unpaid Alerts ─────────────────── */}
        <div className="flex flex-col gap-4">

          {/* Hours Trend */}
          <div className="glass-dashboard rounded-2xl px-5 pt-5 pb-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Hours Trend
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">Ultimi 6 mesi</p>
              </div>
              <BarChart3 className="h-4 w-4 text-primary/40" />
            </div>
            <div className="flex items-end gap-1.5" style={{ height: "80px" }}>
              {monthsData.map((m) => (
                <div key={m.label} className="flex flex-1 flex-col items-center gap-1.5">
                  <div
                    className={`w-full rounded-t-md transition-all ${m.isCurrent ? "bg-primary" : "bg-primary/25"}`}
                    style={{ height: `${Math.max(m.hours > 0 ? (m.hours / maxMonthHours) * 64 : 0, m.hours > 0 ? 4 : 0)}px` }}
                  />
                  <span className="text-[9px] font-semibold text-muted-foreground">{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Unpaid Alerts */}
          <div className="glass-dashboard rounded-2xl px-5 pt-5 pb-4">
            <div className="mb-4 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-600">
                Unpaid Alerts
              </p>
            </div>
            {unpaidAlerts.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Nessuna sessione in attesa
              </p>
            ) : (
              <div className="space-y-2">
                {unpaidAlerts.map((s) => {
                  const meta = s.metadata as { exam_name?: string }
                  return (
                    <Link
                      key={s.id}
                      href="/dashboard/sessions"
                      className="flex items-center justify-between rounded-xl border border-border/40 bg-white/60 px-3.5 py-2.5 transition-colors hover:bg-white/80"
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {meta.exam_name ?? "Sessione"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(s.session_date + "T00:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "short" })}
                          {" · "}£{s.earned.toFixed(2)}
                        </p>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    </Link>
                  )
                })}
                <Link
                  href="/dashboard/payments"
                  className="mt-1 flex w-full items-center justify-center rounded-xl border border-primary/20 bg-primary/5 py-2 text-xs font-bold uppercase tracking-[0.1em] text-primary transition-colors hover:bg-primary/10"
                >
                  Risolvi tutto
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  )
}
