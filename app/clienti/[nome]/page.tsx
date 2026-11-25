import type { Metadata } from "next"
import { cookies } from "next/headers"
import { Badge } from "@/components/ui/badge"
import { PortalEntry } from "@/components/clients/portal-entry"
import { locationCookie, readLocationToken, type LocationScope } from "@/lib/clients/location-access"
import { createAdminClient } from "@/lib/supabase/admin"
import type { PaymentStatus } from "@/types/database"

export const dynamic = "force-dynamic"
export const metadata: Metadata = {
  title: "Area cliente",
  robots: { index: false, follow: false },
}

const euro = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" })
const dateLabel = new Intl.DateTimeFormat("it-IT", { dateStyle: "long", timeZone: "UTC" })
const statuses: Record<PaymentStatus, string> = { paid: "Pagata", unpaid: "Da saldare", pending: "In attesa" }

async function loadSessions(scope: LocationScope) {
  const db = createAdminClient()
  if (!db) return null

  const { data: workspace, error } = await db.from("user_category_access").select("id")
    .eq("id", scope.workspace).eq("user_id", scope.owner).maybeSingle()
  if (error || !workspace) return null

  const query = db.from("sessions").select("id, session_date, start_time, end_time, duration_minutes, earned, payment_status")
    .eq("user_id", scope.owner).eq("workspace_id", scope.workspace).eq("location", scope.location)
    .order("session_date", { ascending: false }).order("start_time", { ascending: false }).order("id")

  const sessions = []
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
  const outstanding = sessions?.reduce((total, session) =>
    session.payment_status === "paid" ? total : total + Number(session.earned), 0)

  return (
    <main className="min-h-dvh bg-[#f3f6fc] px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-3xl space-y-5">
        <PortalEntry id={nome} authorized={Boolean(scope && sessions)} />
        {scope && sessions && (
          <>
            <header>
              <p className="text-sm font-semibold text-primary">Area cliente</p>
              <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{scope.location}</h1>
            </header>
            <section className="glass-card rounded-2xl p-5">
              <h2 className="text-sm font-medium text-muted-foreground">Da saldare</h2>
              <p className="mt-1 text-2xl font-bold tabular-nums">{euro.format(outstanding ?? 0)}</p>
            </section>
            <section className="glass-card rounded-2xl p-5">
              <h2 className="font-semibold">Lezioni</h2>
              {sessions.length ? <ul className="mt-2 divide-y divide-border">
                {sessions.map((session) => (
                  <li key={session.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <div>
                      <p className="text-sm font-medium">{dateLabel.format(new Date(`${session.session_date}T00:00:00Z`))}</p>
                      <p className="text-xs text-muted-foreground">
                        {session.start_time.slice(0, 5)} – {session.end_time.slice(0, 5)} · {session.duration_minutes} min
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant={session.payment_status === "paid" ? "secondary" : "outline"}>{statuses[session.payment_status as PaymentStatus]}</Badge>
                      <span className="font-semibold tabular-nums">{euro.format(session.earned)}</span>
                    </div>
                  </li>
                ))}
              </ul> : <p className="mt-2 text-sm text-muted-foreground">Nessuna lezione registrata.</p>}
            </section>
          </>
        )}
      </div>
    </main>
  )
}
