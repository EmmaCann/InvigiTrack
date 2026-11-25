import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, BookOpen, ClipboardList, FolderOpen } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { LessonFileList, lessonDate } from "@/components/clients/lesson-content"
import { LessonUploadForm } from "@/components/clients/lesson-upload-form"
import { getLesson, getLessonDetails, portalSession } from "@/lib/clients/location-lessons"

export default async function PortalLesson({ params }: { params: Promise<{ nome: string; id: string }> }) {
  const { nome, id } = await params
  const actor = await portalSession(nome, id)
  if (!actor) notFound()
  const { db, scope } = actor
  const { data: lesson } = await getLesson(db, scope, id, true)
  if (!lesson) notFound()
  const { uploads, tasks } = await getLessonDetails(db, id, true)
  const home = `/clienti/${encodeURIComponent(nome)}`
  const base = `${home}/lezioni/${id}`
  const materials = uploads.filter((upload) => upload.kind === "material")

  return <div className="space-y-5">
    <Link href={home} className="inline-flex items-center gap-2 text-sm font-semibold text-primary"><ArrowLeft className="size-4" aria-hidden /> Lezioni</Link>
    <header className="glass-dashboard rounded-3xl bg-gradient-to-br from-white/95 to-blue-50/60 p-5 sm:p-7">
      <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><BookOpen className="size-5" aria-hidden /></div>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{lesson.title || "Lezione"}</h1>
      {lesson.topics && <div className="mt-4 space-y-1">
        <h2 className="text-sm font-semibold">Argomenti svolti</h2>
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">{lesson.topics}</p>
      </div>}
    </header>
    {materials.length > 0 && <section className="glass-dashboard space-y-3 rounded-2xl p-5">
      <h2 className="flex items-center gap-2 font-semibold"><FolderOpen className="size-4 text-primary" aria-hidden /> Materiali</h2>
      <LessonFileList uploads={materials} base={base} />
    </section>}
    {tasks.length > 0 && <section aria-label="Compiti" className="space-y-3">
      {tasks.map((task) => {
        const files = uploads.filter((upload) => upload.task_id === task.id)
        const deliveries = files.filter((upload) => upload.kind === "submission")
        return <article key={task.id} className="glass-dashboard space-y-3 rounded-2xl p-5">
          <header className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 font-semibold"><ClipboardList className="size-4 text-primary" aria-hidden />{task.title}</h2>
            <Badge className={deliveries.length ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}>
              {deliveries.length ? "Consegnato" : "Da consegnare"}
            </Badge>
          </header>
          {task.due_date && <p className="text-xs font-medium text-muted-foreground">Scadenza {lessonDate(task.due_date)}</p>}
          {task.instructions && <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{task.instructions}</p>}
          <LessonFileList uploads={files.filter((upload) => upload.kind === "assignment")} base={base} />
          {deliveries.length > 0 && <div className="space-y-2">
            <h3 className="text-sm font-semibold">Consegne precedenti</h3>
            <LessonFileList uploads={deliveries} base={base} deliveries />
          </div>}
          <div className="border-t border-border/60 pt-3">
            <LessonUploadForm task={task.id} label={deliveries.length ? "Nuova consegna" : "Consegna il compito"} endpoint={`${base}/consegne`} />
          </div>
        </article>
      })}
    </section>}
  </div>
}
