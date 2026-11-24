import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { getClientRecords } from "@/lib/clients/records"

export const dateLabel = (date: string) => new Intl.DateTimeFormat("it-IT", { dateStyle: "long", timeZone: "UTC" })
  .format(new Date(date + "T00:00:00Z"))
export const euro = (amount: number) => new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(amount)
const statusLabel = { paid: "Pagata", unpaid: "Da saldare", pending: "In attesa" }

export function ClientPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="glass-card space-y-3 rounded-2xl p-4 sm:p-5">
    <h2 className="font-semibold">{title}</h2>
    {children}
  </section>
}

export function PortalView({ name, records, materials, taskCount = 0 }: {
  name: string
  records: Awaited<ReturnType<typeof getClientRecords>>
  materials?: React.ReactNode
  taskCount?: number
}) {
  const { sessions, events, lessons } = records
  const byId = new Map(lessons.map((lesson) => [lesson.id, lesson]))
  const title = (id: string | null) => (id && byId.get(id)?.title) || "Lezione"
  const outstanding = sessions.filter((lesson) => lesson.payment_status !== "paid").reduce((sum, lesson) => sum + Number(lesson.earned), 0)
  const years = [...new Set(sessions.map((session) => session.session_date.slice(0, 4)))]

  return <div className="space-y-5">
    <header>
      <p className="text-sm font-semibold text-primary">Area cliente</p>
      <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{name}</h1>
    </header>
    <Tabs defaultValue="summary">
      <TabsList className="grid h-auto w-full grid-cols-2 sm:grid-cols-4">
        <TabsTrigger value="summary">Riepilogo</TabsTrigger>
        <TabsTrigger value="lessons">Lezioni</TabsTrigger>
        <TabsTrigger value="calendar">Calendario</TabsTrigger>
        <TabsTrigger value="materials">Materiali e compiti</TabsTrigger>
      </TabsList>
      <TabsContent value="summary" className="mt-4 grid gap-3 sm:grid-cols-3">
        <ClientPanel title="Prossima lezione">{events[0] ? <p>{title(events[0].client_lesson_id)} · {dateLabel(events[0].event_date)}</p> : <p>Nessun appuntamento previsto.</p>}</ClientPanel>
        <ClientPanel title="Da saldare"><p className="text-2xl font-bold">{euro(outstanding)}</p></ClientPanel>
        <ClientPanel title="Compiti da consegnare"><p className="text-2xl font-bold">{taskCount}</p></ClientPanel>
      </TabsContent>
      <TabsContent value="lessons" className="mt-4 space-y-3">
        {years.length === 0 && <ClientPanel title="Lezioni svolte"><p>Nessuna lezione svolta.</p></ClientPanel>}
        {years.map((year) => <ClientPanel key={year} title={year}>
          <ul className="divide-y divide-border">
            {sessions.filter((session) => session.session_date.startsWith(year)).map((session) => <li key={session.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div><p className="font-medium">{title(session.client_lesson_id)}</p>
                <p className="text-sm text-muted-foreground">{dateLabel(session.session_date)} · {session.duration_minutes} min</p></div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {session.archived_at && <Badge variant="outline">Archiviata</Badge>}
                <Badge variant={session.payment_status === "paid" ? "secondary" : "outline"}>{statusLabel[session.payment_status]}</Badge>
                <span className="font-medium tabular-nums">{euro(session.earned)}</span>
              </div>
            </li>)}
          </ul>
        </ClientPanel>)}
      </TabsContent>
      <TabsContent value="calendar" className="mt-4">
        <ClientPanel title="Prossimi appuntamenti">
          {events.length ? <ul className="divide-y divide-border">{events.map((event) => <li key={event.id} className="py-3">
            <p className="font-medium">{title(event.client_lesson_id)}</p>
            <p className="text-sm text-muted-foreground">{[dateLabel(event.event_date), event.start_time?.slice(0, 5), event.end_time?.slice(0, 5)].filter(Boolean).join(" · ")}</p>
          </li>)}</ul> : <p>Nessun appuntamento previsto.</p>}
        </ClientPanel>
      </TabsContent>
      <TabsContent value="materials" className="mt-4 space-y-3">
        {materials}
        {lessons.filter((lesson) => lesson.topics || lesson.description).map((lesson) => <ClientPanel key={lesson.id} title={lesson.title || "Lezione"}>
          {lesson.topics && <p className="whitespace-pre-wrap text-sm font-medium">{lesson.topics}</p>}
          {lesson.description && <p className="whitespace-pre-wrap text-sm text-muted-foreground">{lesson.description}</p>}
        </ClientPanel>)}
        {!materials && !lessons.some((lesson) => lesson.topics || lesson.description) &&
          <ClientPanel title="Materiali e compiti"><p>Nessun contenuto pubblicato.</p></ClientPanel>}
      </TabsContent>
    </Tabs>
  </div>
}
