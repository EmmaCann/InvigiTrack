/**
 * PAGINA DASHBOARD — Server Component.
 *
 * Due casi:
 *  - Nessun profilo → mostra OnboardingDialog (primo login)
 *  - Profilo trovato → mostra la dashboard con le stat card
 *
 * Nota: il layout.tsx fetcha già il profilo per l'header.
 * Questa pagina lo fetcha di nuovo per gestire il caso
 * "nessun profilo" (onboarding). È accettabile perché:
 *  a) il caso è raro (solo al primo login)
 *  b) Next.js memorizza le chiamate al DB nello stesso render cycle
 */

import { getCurrentUser } from "@/lib/data/auth"
import { getProfileByEmail } from "@/lib/data/profiles"
import { OnboardingDialog } from "@/components/auth/onboarding-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, PoundSterling, AlertCircle, CalendarCheck } from "lucide-react"

export default async function DashboardPage() {
  const user = await getCurrentUser()
  const profile = user ? await getProfileByEmail(user.email!) : null

  // Primo login → onboarding
  if (!profile) {
    return <OnboardingDialog />
  }

  // Dati placeholder — sostituiti con query reali quando avremo la tabella sessions
  const stats = [
    {
      label: "Total Hours",
      value: "—",
      sub: "this month",
      icon: Clock,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Total Earned",
      value: "—",
      sub: "expected earnings",
      icon: PoundSterling,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Unpaid",
      value: "—",
      sub: "awaiting payment",
      icon: AlertCircle,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Upcoming",
      value: "—",
      sub: "scheduled sessions",
      icon: CalendarCheck,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
  ]

  const displayName = profile.full_name ?? profile.email

  return (
    <div className="space-y-6">

      {/* ── Intestazione pagina ─────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
            Welcome back
          </p>
          <h2 className="text-2xl font-bold text-foreground">{displayName}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Academic Overview
          </p>
        </div>
        <Badge variant="secondary" className="capitalize text-xs">
          {profile.role_type}
        </Badge>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="shadow-none border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {stat.label}
              </p>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Sezione sessioni recenti ────────────────────────────────── */}
      <Card className="shadow-none border-border">
        <CardHeader className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Recent Sessions</CardTitle>
            <a
              href="/dashboard/sessions"
              className="text-xs font-medium text-primary hover:underline"
            >
              View all →
            </a>
          </div>
          <p className="text-xs text-muted-foreground">
            Detailed log of your latest invigilation activity
          </p>
        </CardHeader>
        <CardContent className="px-5 pb-8">
          {/* Empty state — rimosso quando avremo dati reali */}
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
              <CalendarCheck className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No sessions yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Your invigilation sessions will appear here once logged.
            </p>
            <a
              href="/dashboard/sessions"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              + Log First Session
            </a>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
