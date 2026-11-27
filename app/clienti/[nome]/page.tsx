import Link from "next/link"
import { ArrowRight, ArrowUpRight, BookOpen, CalendarDays, ClipboardList, Clock3, FolderOpen, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"
import { cookies } from "next/headers"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

type PublishedLesson = {
  session_id: string
  title: string
  location_lesson_tasks: { id: string; title: string; due_date: string | null }[]
  location_lesson_uploads: { kind: string; task_id: string | null }[]
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
  const published = new Map<string, PublishedLesson>()
  if (db) {
    for (let offset = 0; offset < sessions.length; offset += 100) {
      const { data } = await db.from("location_lessons")
        .select("session_id, title, location_lesson_tasks(id, title, due_date), location_lesson_uploads(kind, task_id, location_lesson_files!inner(id))")
        .eq("owner_id", scope.owner).eq("workspace_id", scope.workspace).eq("location", scope.location)
        .eq("published", true).in("session_id", sessions.slice(offset, offset + 100).map((session) => session.id))
        .eq("location_lesson_tasks.published", true).not("location_lesson_uploads.confirmed_at", "is", null)
        .is("location_lesson_uploads.location_lesson_files.removed_at", null)
      for (const row of data ?? []) published.set(row.session_id, row)
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

  const lessonsWithMaterials = []
  const homework = []
  const lessonRoot = `/clienti/${encodeURIComponent(nome)}/lezioni`
  for (const session of sessions) {
    const lesson = published.get(session.id)
    if (!lesson) continue
    const date = dateLabel.format(new Date(`${session.session_date}T00:00:00Z`))
    const title = lesson.title || "Lezione"
    const href = `${lessonRoot}/${session.id}`
    if (lesson.location_lesson_uploads.some((upload) => upload.kind === "material")) {
      lessonsWithMaterials.push({ id: session.id, title, date, href: `${href}#materiali` })
    }
    const assigned = new Set<string | null>()
    const submitted = new Set<string | null>()
    for (const upload of lesson.location_lesson_uploads) {
      if (upload.kind === "assignment") assigned.add(upload.task_id)
      if (upload.kind === "submission") submitted.add(upload.task_id)
    }
    for (const task of lesson.location_lesson_tasks) {
      if (!assigned.has(task.id)) continue
      homework.push({ ...task, lessonTitle: title, date, submitted: submitted.has(task.id), href: `${href}#compito-${task.id}` })
    }
  }
  homework.sort((a, b) => Number(a.submitted) - Number(b.submitted)
    || (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"))
  const tasksDue = homework.filter((task) => !task.submitted).length
  const latest = sessions.find((session) => published.has(session.id))
  const latestTitle = latest && published.get(latest.id)?.title

  return <div className="space-y-6">
    <PortalEntry id={nome} authorized />
    <header className="glass-dashboard relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-white/80 to-blue-100/50 p-5 sm:p-8">
      <div className="relative grid items-center gap-5 sm:grid-cols-[1fr_auto]">
        <div className="min-w-0">
          <div className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><BookOpen className="size-5" aria-hidden /></div>
          <h1 className="break-words text-3xl font-bold tracking-tight sm:text-4xl">Le lezioni di {scope.location}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Ripassa gli argomenti, scarica i materiali e consegna i tuoi compiti.</p>
          {latest && <Link href={`${lessonRoot}/${latest.id}`} prefetch={false}
            className="mt-4 flex w-fit max-w-sm items-center gap-4 rounded-2xl bg-primary px-4 py-3 text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90">
            <span className="min-w-0">
              <span className="block text-xs font-semibold">Apri l’ultima lezione</span>
              <span className="mt-0.5 block break-words text-sm font-medium">{latestTitle || dateLabel.format(new Date(`${latest.session_date}T00:00:00Z`))}</span>
            </span>
            <ArrowRight className="size-4 shrink-0" aria-hidden />
          </Link>}
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
    <Tabs defaultValue="lessons" className="space-y-4">
      <TabsList className="glass-sm grid w-full grid-cols-3 gap-1 rounded-2xl p-1.5 group-data-horizontal/tabs:h-auto">
        <TabsTrigger value="lessons" className="h-auto min-h-10 whitespace-normal rounded-xl px-1 text-xs sm:text-sm">
          <BookOpen aria-hidden className="hidden size-4 sm:block" /> Lezioni
        </TabsTrigger>
        <TabsTrigger value="materials" className="h-auto min-h-10 whitespace-normal rounded-xl px-1 text-xs sm:text-sm">
          <FolderOpen aria-hidden className="hidden size-4 sm:block" /> Materiali
        </TabsTrigger>
        <TabsTrigger value="homework" className="h-auto min-h-10 whitespace-normal rounded-xl px-1 text-xs sm:text-sm">
          <ClipboardList aria-hidden className="hidden size-4 sm:block" /> Compiti per casa
          {tasksDue > 0 && <span aria-label={`${tasksDue} da consegnare`} className="rounded-full bg-amber-100 px-1.5 text-[10px] font-bold text-amber-800">{tasksDue}</span>}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="lessons" className="space-y-5">
        {!months.size && <p className="glass-dashboard rounded-2xl p-5 text-sm text-muted-foreground">Nessuna lezione registrata.</p>}
        {[...months].map(([month, entries]) => (
          <section key={month} className="space-y-2.5">
            <h3 className="text-sm font-semibold capitalize text-muted-foreground">{monthLabel.format(new Date(`${month}-01T00:00:00Z`))}</h3>
            <ul className="space-y-2">
              {entries.map((session) => {
                const date = new Date(`${session.session_date}T00:00:00Z`)
                const title = published.get(session.id)?.title
                const hasContent = published.has(session.id)
                const status = statuses[session.payment_status] ?? statuses.pending
                return <li key={session.id} className={cn("glass-card grid grid-cols-[auto_1fr] items-center gap-3 rounded-2xl border-l-2 p-3 sm:grid-cols-[auto_1fr_auto] sm:gap-x-4 sm:px-4", status.edge)}>
                  <div aria-hidden className="flex min-w-12 flex-col items-center rounded-xl bg-primary/5 px-2 py-1.5 text-primary">
                    <span className="text-lg font-bold leading-tight tabular-nums">{date.getUTCDate()}</span>
                    <span className="text-[10px] font-semibold uppercase">{monthDay.format(date)}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold">{title || dateLabel.format(date)}{title && <span className="sr-only"> · {dateLabel.format(date)}</span>}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock3 className="size-3.5" aria-hidden /> {session.start_time.slice(0, 5)} – {session.end_time.slice(0, 5)} · {session.duration_minutes} min
                    </p>
                    {hasContent && <Link href={`${lessonRoot}/${session.id}`} prefetch={false}
                      className="mt-2 inline-flex w-fit items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/15">
                      <BookOpen className="size-4" aria-hidden /> Contenuti della lezione
                      <span className="sr-only"> del {dateLabel.format(date)}</span><ArrowUpRight className="size-3.5" aria-hidden />
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
      </TabsContent>
      <TabsContent value="materials" className="space-y-2.5">
        {!lessonsWithMaterials.length && <p className="glass-dashboard rounded-2xl p-5 text-sm text-muted-foreground">Nessun materiale pubblicato.</p>}
        {lessonsWithMaterials.map((lesson) => <Link key={lesson.id} href={lesson.href} prefetch={false}
          className="glass-card flex items-center gap-3 rounded-2xl p-4 hover:bg-white/80">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><FolderOpen className="size-5" aria-hidden /></span>
          <span className="min-w-0 flex-1">
            <span className="block break-words text-sm font-semibold">{lesson.title}</span>
            <span className="block text-xs text-muted-foreground">{lesson.date}</span>
          </span>
          <ArrowUpRight className="size-4 shrink-0 text-primary" aria-hidden />
        </Link>)}
      </TabsContent>
      <TabsContent value="homework" className="space-y-2.5">
        {!homework.length && <p className="glass-dashboard rounded-2xl p-5 text-sm text-muted-foreground">Nessun compito assegnato.</p>}
        {homework.map((task) => <Link key={task.id} href={task.href} prefetch={false}
          className="glass-card flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl p-4 hover:bg-white/80">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700"><ClipboardList className="size-5" aria-hidden /></span>
          <span className="min-w-0 flex-1 basis-36">
            <span className="block break-words text-sm font-semibold">{task.title}</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {task.due_date ? `Scadenza ${dateLabel.format(new Date(`${task.due_date}T00:00:00Z`))}` : `${task.lessonTitle} · ${task.date}`}
            </span>
          </span>
          <Badge className={task.submitted ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}>{task.submitted ? "Consegnato" : "Da consegnare"}</Badge>
          <ArrowUpRight className="size-4 shrink-0 text-primary" aria-hidden />
        </Link>)}
      </TabsContent>
    </Tabs>
  </div>
}
