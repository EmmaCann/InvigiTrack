import { getCurrentUser } from "@/lib/data/auth"
import { getProfileById } from "@/lib/data/profiles"
import { getPaymentSummary, getSessionsByUser } from "@/lib/data/sessions"
import { OnboardingDialog } from "@/components/auth/onboarding-dialog"
import { Badge } from "@/components/ui/badge"
import { Clock, PoundSterling, AlertCircle, CalendarCheck, ArrowRight, MapPin, ShieldCheck } from "lucide-react"
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
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
            Bentornato/a
          </p>
          <h2 className="text-2xl font-bold text-foreground">{displayName}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Ecco il riepilogo della tua attività
          </p>
        </div>
        {profile.platform_role === "admin" && (
          <Badge variant="secondary" className="gap-1 text-[11px] bg-primary/10 text-primary border-primary/20">
            <ShieldCheck className="h-3 w-3" /> Admin
          </Badge>
        )}
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="relative overflow-hidden rounded-2xl border border-white/78 bg-gradient-to-br from-white/52 via-white/38 to-teal-50/22 px-4 py-4 shadow-[0_10px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl backdrop-saturate-150"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </p>
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Sessioni recenti ───────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-white/78 bg-gradient-to-b from-white/50 via-white/36 to-teal-50/18 shadow-[0_12px_48px_rgba(15,23,42,0.06)] backdrop-blur-xl backdrop-saturate-150">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h3 className="text-base font-semibold text-foreground">Sessioni recenti</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Le tue ultime sessioni registrate
            </p>
          </div>
          <Link
            href="/dashboard/sessions"
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Vedi tutte <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="px-5 pb-5">
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
            <div className="space-y-2">
              {recentSessions.map((session: Session) => {
                const meta = session.metadata as { exam_name?: string; role_type?: string }
                return (
                  <div
                    key={session.id}
                    className="group relative flex items-center gap-4 overflow-hidden rounded-2xl rounded-r-xl border border-teal-100/45 bg-gradient-to-r from-teal-50/35 via-white/35 to-white/28 py-3 pl-3.5 pr-5 shadow-[0_8px_32px_rgba(15,23,42,0.05)] backdrop-blur-xl backdrop-saturate-[1.35] transition-all hover:border-teal-200/50"
                  >
                    <span
                      className="absolute right-0 top-1/2 h-1/2 w-1 -translate-y-1/2 rounded-full bg-teal-600 shadow-[2px_0_12px_rgba(13,148,136,0.28)]"
                      aria-hidden
                    />
                    {/* Data */}
                    <div className="w-10 shrink-0 text-center">
                      <p className="text-base font-bold text-foreground leading-none">
                        {new Date(session.session_date + "T00:00:00").getDate()}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase">
                        {new Date(session.session_date + "T00:00:00").toLocaleDateString("it-IT", { month: "short" })}
                      </p>
                    </div>

                    <div className="h-8 w-px bg-border/60" />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {meta.exam_name ?? "Sessione"}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span>{formatTime(session.start_time)} – {formatTime(session.end_time)}</span>
                        {session.location && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-0.5">
                              <MapPin className="h-3 w-3" />
                              {session.location}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Earned + Status */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-bold text-foreground tabular-nums">
                        £{session.earned.toFixed(2)}
                      </span>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLE[session.payment_status]}`}>
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

    </div>
  )
}
