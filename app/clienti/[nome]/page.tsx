import Link from "next/link"
import { ArrowUpRight, BookOpen, CalendarDays, Clock3, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"
import { cookies } from "next/headers"
import { Badge } from "@/components/ui/badge"
import { PortalEntry } from "@/components/clients/portal-entry"
import { locationCookie, readLocationToken, type LocationScope } from "@/lib/clients/location-access"
import { createAdminClient } from "@/lib/supabase/admin"
import type { PaymentStatus } from "@/types/database"

export const dynamic = "force-dynamic"

const euro = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" })
const dateLabel = new Intl.DateTimeFormat("it-IT", { dateStyle: "long", timeZone: "UTC" })
const statuses: Record<PaymentStatus, { label: string; style: string; edge: string }> = {
  paid: { label: "Pagata", style: "bg-emerald-50 text-emerald-700 ring-emerald-200/70", edge: "border-l-emerald-400" },
  unpaid: { label: "Da saldare", style: "bg-amber-50 text-amber-800 ring-amber-200/80", edge: "border-l-amber-400" },
  pending: { label: "In attesa", style: "bg-blue-50 text-blue-700 ring-blue-200/80", edge: "border-l-blue-400" },
}
const monthLabel = new Intl.DateTimeFormat("it-IT", { month: "long", year: "numeric", timeZone: "UTC" })
const monthDay = new Intl.DateTimeFormat("it-IT", { month: "short", timeZone: "UTC" })
type SessionRow = {
  id: string; session_date: string; start_time: string; end_time: string
  duration_minutes: number; earned: number; payment_status: PaymentStatus
}

async function loadSessions(scope: LocationScope) {
  const db = createAdminClient()
  if (!db) return null

  const { data: workspace, error } = await db.from("user_category_access").select("id")
    .eq("id", scope.workspace).eq("user_id", scope.owner).maybeSingle()
  if (error || !workspace) return null

  const query = db.from("sessions").select("id, session_date, start_time, end_time, duration_minutes, earned, payment_status")
    .eq("user_id", scope.owner).eq("workspace_id", scope.workspace).eq("location", scope.location)
    .order("session_date", { ascending: false }).order("start_time", { ascending: false }).order("id")

  const sessions: SessionRow[] = []
  const pageSize = 250
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await query.range(offset, offset + pageSize - 1)
    if (error || !data) return null
    sessions.push(...data)
    if (data.length < pageSize) return sessions
  }
}

export default async function LocationPortal({ params }: { params: Promise<{ nome: string }> }) {
  const { nome } = await params
  const token = (await cookies()).get(locationCookie)?.value
  const scope = await readLocationToken(token, nome)
  const sessions = scope ? await loadSessions(scope) : null
  if (!scope || !sessions) return <PortalEntry id={nome} authorized={false} />

  const db = createAdminClient()
  const published = new Map<string, string>()
  if (db) {
    for (let offset = 0; offset < sessions.length; offset += 100) {
      const { data } = await db.from("location_lessons").select("session_id, title")
        .eq("owner_id", scope.owner).eq("workspace_id", scope.workspace).eq("location", scope.location)
        .eq("published", true).in("session_id", sessions.slice(offset, offset + 100).map((session) => session.id))
      for (const row of data ?? []) published.set(row.session_id, row.title)
    }
  }
  const outstanding = sessions.reduce((total, session) =>
    session.payment_status === "paid" ? total : total + Number(session.earned), 0)
  const months = new Map<string, SessionRow[]>()
  for (const session of sessions) {
    const month = session.session_date.slice(0, 7)
    const entries = months.get(month) ?? []
    entries.push(session)
    months.set(month, entries)
  }

  return <div className="space-y-6">
    <PortalEntry id={nome} authorized />
    <header className="glass-dashboard relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-white/80 to-blue-100/50 p-5 sm:p-8">
      <div className="relative grid items-center gap-5 sm:grid-cols-[1fr_auto]">
        <div className="min-w-0">
          <div className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><BookOpen className="size-5" aria-hidden /></div>
          <h1 className="break-words text-3xl font-bold tracking-tight sm:text-4xl">{scope.location}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Le tue lezioni, i materiali e i compiti assegnati.</p>
        </div>
        <dl className="grid grid-cols-2 gap-2 sm:min-w-[280px]">
          <div className="rounded-2xl border border-white/90 bg-white/70 px-3 py-3 sm:px-4">
            <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Wallet className="size-3.5 text-amber-600" aria-hidden /> Da saldare</dt>
            <dd className="mt-1 text-xl font-bold tabular-nums sm:text-2xl">{euro.format(outstanding)}</dd>
          </div>
          <div className="rounded-2xl border border-white/90 bg-white/70 px-3 py-3 sm:px-4">
            <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><CalendarDays className="size-3.5 text-primary" aria-hidden /> Lezioni svolte</dt>
            <dd className="mt-1 text-xl font-bold tabular-nums sm:text-2xl">{sessions.length}</dd>
          </div>
        </dl>
      </div>
    </header>
    <section aria-labelledby="lessons-heading" className="space-y-5">
      <h2 id="lessons-heading" className="text-lg font-bold">Lezioni</h2>
      {!months.size && <p className="glass-dashboard rounded-2xl p-5 text-sm text-muted-foreground">Nessuna lezione registrata.</p>}
      {[...months].map(([month, entries]) => (
        <section key={month} className="space-y-2.5">
          <h3 className="text-sm font-semibold capitalize text-muted-foreground">{monthLabel.format(new Date(`${month}-01T00:00:00Z`))}</h3>
          <ul className="space-y-2">
            {entries.map((session) => {
              const status = statuses[session.payment_status] ?? statuses.pending
              const date = new Date(`${session.session_date}T00:00:00Z`)
              const title = published.get(session.id)
              return <li key={session.id} className={cn("glass-card grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 rounded-2xl border-l-2 p-3 sm:grid-cols-[auto_1fr_auto] sm:gap-x-4 sm:px-4", status.edge)}>
                <div aria-hidden className="flex min-w-12 flex-col items-center rounded-xl bg-primary/5 px-2 py-1.5 text-primary">
                  <span className="text-lg font-bold leading-tight tabular-nums">{date.getUTCDate()}</span>
                  <span className="text-[10px] font-semibold uppercase">{monthDay.format(date)}</span>
                </div>
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold">{title || dateLabel.format(date)}{title && <span className="sr-only"> · {dateLabel.format(date)}</span>}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock3 className="size-3.5" aria-hidden /> {session.start_time.slice(0, 5)} – {session.end_time.slice(0, 5)} · {session.duration_minutes} min
                  </p>
                  {published.has(session.id) && <Link href={`/clienti/${encodeURIComponent(nome)}/lezioni/${session.id}`}
                    className="mt-2 inline-flex items-center gap-1 rounded-md text-xs font-semibold text-primary hover:underline">
                    Apri contenuti <span className="sr-only">del {dateLabel.format(date)}</span><ArrowUpRight className="size-3.5" aria-hidden />
                  </Link>}
                </div>
                <div className="col-start-2 flex flex-wrap items-center gap-2 sm:col-start-3">
                  <Badge className={cn("ring-1 ring-inset", status.style)}>{status.label}</Badge>
                  <span className="text-sm font-bold tabular-nums">{euro.format(session.earned)}</span>
                </div>
              </li>
            })}
          </ul>
        </section>
      ))}
    </section>
  </div>
}
