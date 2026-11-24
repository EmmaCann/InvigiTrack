import { getClientMaterials } from "@/lib/clients/files"
import { PortalMaterials, TeacherMaterials, pendingTaskCount } from "@/components/clients/materials"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getClientManager, managedClient } from "@/lib/clients/access"
import { getClientRecords, readPages, type Lesson } from "@/lib/clients/records"
import { ClientForm, ClientLinkControls, ClientNameForm } from "@/components/clients/client-controls"
import { ClientPanel, dateLabel, euro, PortalView } from "@/components/clients/portal-view"
import { associateClientHistory, saveClientLesson } from "@/app/actions/clients"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type Candidate = { id: string; location: string | null; date: string; detail: string; kind: "sessions" | "events" }

export default async function ClientPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ consegna?: string }> }) {
  const manager = await getClientManager()
  if (!manager) notFound()
  const [{ id }, { consegna }] = await Promise.all([params, searchParams])
  const client = await managedClient(manager, id)
  if (!client) notFound()
  const { db, userId, workspaceId } = manager
  const scope = { id, user_id: userId, workspace_id: workspaceId }

  const [records, preview, link, sessions, events] = await Promise.all([
    getClientRecords(db, scope, true),
    getClientRecords(db, scope),
    db.from("client_links").select("client_id").eq("client_id", id).maybeSingle(),
    readPages<{ id: string; location: string | null; session_date: string; start_time: string; earned: number }>(
      db.from("sessions").select("id, location, session_date, start_time, earned").eq("user_id", userId)
        .eq("workspace_id", workspaceId).is("client_id", null).order("session_date", { ascending: false }).order("id"),
    ),
    readPages<{ id: string; location: string | null; event_date: string; title: string }>(
      db.from("calendar_events").select("id, location, event_date, title").eq("user_id", userId)
        .eq("workspace_id", workspaceId).is("client_id", null).eq("is_converted", false).order("event_date").order("id"),
    ),
  ])
  const [materials, previewMaterials] = await Promise.all([
    getClientMaterials(db, id, records.lessons.map((lesson) => lesson.id), true),
    getClientMaterials(db, id, preview.lessons.map((lesson) => lesson.id)),
  ])
  const highlighted = materials.batches.find((batch) => batch.id === consegna && batch.kind === "submission")
  const highlightedTask = materials.tasks.find((task) => task.id === highlighted?.task_id)
  const groups = new Map<string, Candidate[]>()
  const candidates: Candidate[] = [
    ...sessions.map((row): Candidate => ({ ...row, date: row.session_date, detail: `${row.start_time.slice(0, 5)} · ${euro(row.earned)}`, kind: "sessions" })),
    ...events.map((row): Candidate => ({ ...row, date: row.event_date, detail: row.title, kind: "events" })),
  ]
  for (const row of candidates) {
    const location = row.location || "Senza luogo"
    const group = groups.get(location) ?? []
    group.push(row)
    groups.set(location, group)
  }
  const lessons = new Map(records.lessons.map((lesson) => [lesson.id, lesson]))
  return (
    <div className="space-y-6">
      <header>
        <Link href="/dashboard/clients" className="text-sm font-medium text-primary">← Clienti</Link>
        <h1 className="mt-2 text-2xl font-bold">{client.name}</h1>
      </header>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <ClientPanel title="Anagrafica"><ClientNameForm workspaceId={workspaceId} client={client} /></ClientPanel>
        <ClientPanel title="Link personale">
          <ClientLinkControls workspaceId={workspaceId} id={id} activeLink={Boolean(link.data)} disabled={Boolean(client.disabled_at)} />
        </ClientPanel>
      </div>
      {!client.disabled_at && <ClientPanel title="Associa sessioni e appuntamenti">
        {groups.size ? <ClientForm label="Associa selezionati" submitAction={associateClientHistory.bind(null, workspaceId, id)}>
          {[...groups].sort(([a], [b]) => a.localeCompare(b, "it")).map(([location, rows]) => (
            <details key={location} className="rounded-xl border border-border p-3">
              <summary className="cursor-pointer text-sm font-medium">{location} ({rows.length})</summary>
              <div className="mt-3 grid gap-2">
                {rows.map((row) => <label key={row.id} className="flex items-start gap-2 text-sm">
                  <input className="mt-1 accent-primary" type="checkbox" name={row.kind} value={row.id} />
                  <span>{dateLabel(row.date)} · {row.kind === "sessions" ? "Sessione" : "Appuntamento"} · {row.detail}</span>
                </label>)}
              </div>
            </details>
          ))}
        </ClientForm> : <p className="text-sm text-muted-foreground">Nessuna voce da associare.</p>}
      </ClientPanel>}
      {!client.disabled_at && <ClientPanel title="Contenuti delle lezioni">
        {[...records.sessions, ...records.events].map((row) => {
          const event = "event_date" in row
          const lesson = row.client_lesson_id ? lessons.get(row.client_lesson_id) : undefined
          return <details key={row.id} open={lesson && highlightedTask?.lesson_id === lesson.id ? true : undefined} className="rounded-xl border border-border p-3">
            <summary className="cursor-pointer text-sm font-medium">
              {dateLabel(event ? row.event_date : row.session_date)} · {event ? "Appuntamento" : "Lezione"} {lesson?.title && `· ${lesson.title}`}
              <Badge className="ml-2" variant={lesson?.published ? "secondary" : "outline"}>{lesson?.published ? "Pubblicato" : "Bozza"}</Badge>
            </summary>
            <LessonForm key={JSON.stringify(lesson)} lesson={lesson} submit={saveClientLesson.bind(null, workspaceId, id, row.id, event)} />
            {lesson && <TeacherMaterials id={id} workspace={workspaceId} lesson={lesson} materials={materials} highlighted={highlighted?.id} />}
          </details>
        })}
        {!records.sessions.length && !records.events.length && <p className="text-sm text-muted-foreground">Associa una sessione o un appuntamento per aggiungere contenuti.</p>}
      </ClientPanel>}
      <details className="glass-card rounded-2xl p-4">
        <summary className="cursor-pointer font-semibold">Anteprima pagina cliente</summary>
        <div className="mt-4"><PortalView name={client.name} records={preview} taskCount={pendingTaskCount(previewMaterials)}
          materials={previewMaterials.tasks.length || previewMaterials.batches.length
            ? <PortalMaterials id={id} materials={previewMaterials} lessons={preview.lessons} preview /> : undefined} /></div>
      </details>
    </div>
  )
}

function LessonForm({ lesson, submit }: { lesson?: Lesson; submit: (form: FormData) => Promise<{ error?: string }> }) {
  return <div className="mt-4"><ClientForm label="Salva contenuto" submitAction={submit}>
    <label className="grid gap-1 text-sm">Titolo pubblico<Input name="title" defaultValue={lesson?.title} maxLength={160} /></label>
    <label className="grid gap-1 text-sm">Argomenti<Textarea name="topics" defaultValue={lesson?.topics} maxLength={2000} /></label>
    <label className="grid gap-1 text-sm">Descrizione<Textarea name="description" defaultValue={lesson?.description} maxLength={6000} /></label>
    <label className="flex items-center gap-2 text-sm"><input name="published" type="checkbox" defaultChecked={lesson?.published} className="accent-primary" /> Pubblicato</label>
  </ClientForm></div>
}
