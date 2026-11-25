import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, BookOpen, ClipboardList, FolderOpen } from "lucide-react"
import { saveLocationLesson, saveLocationTask, uploadTeacherLessonFiles } from "@/app/actions/location-lessons"
import { getLesson, getLessonDetails, teacherSession, type Task } from "@/lib/clients/location-lessons"
import { LessonEditorForm } from "@/components/clients/lesson-editor-form"
import { LessonFileList, lessonDate } from "@/components/clients/lesson-content"
import { LessonUploadForm } from "@/components/clients/lesson-upload-form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

export default async function LessonEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const actor = await teacherSession(id)
  if (!actor) notFound()
  const { db, scope, session } = actor
  const { data: lesson, error } = await getLesson(db, scope, id)
  const details = lesson ? await getLessonDetails(db, id) : null
  const base = `/dashboard/sessions/${id}/contenuti`

  return <div className="mx-auto max-w-5xl space-y-5">
    <Link href="/dashboard/sessions" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
      <ArrowLeft className="size-4" aria-hidden /> Sessioni
    </Link>
    <header>
      <h1 className="text-2xl font-bold tracking-tight">Contenuti lezione</h1>
      <p className="mt-1 text-sm text-muted-foreground">{scope.location} · {lessonDate(session.session_date)}</p>
    </header>
    {error ? <p className="glass-dashboard rounded-2xl p-5 text-sm">Contenuti non disponibili. Verifica la migrazione dei contenuti lezione in Supabase.</p> :
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <section className="glass-dashboard space-y-4 rounded-2xl p-5">
          <h2 className="flex items-center gap-2 font-semibold"><BookOpen className="size-4 text-primary" aria-hidden /> Argomenti</h2>
          <LessonEditorForm label="Salva lezione" saveAction={saveLocationLesson.bind(null, id)}>
            <label className="grid gap-1.5 text-sm font-medium">Titolo pubblico<Input name="title" defaultValue={lesson?.title} maxLength={160} /></label>
            <label className="grid gap-1.5 text-sm font-medium">Argomenti svolti<Textarea name="topics" rows={5} defaultValue={lesson?.topics} maxLength={6000} /></label>
            <label className="flex items-center gap-2 text-sm"><input name="published" type="checkbox" defaultChecked={lesson?.published} className="accent-primary" /> Pubblica nell’area cliente</label>
          </LessonEditorForm>
        </section>
        {details ? <section className="glass-dashboard space-y-4 rounded-2xl p-5">
          <h2 className="flex items-center gap-2 font-semibold"><FolderOpen className="size-4 text-primary" aria-hidden /> Materiali della lezione</h2>
          <LessonFileList uploads={details.uploads.filter((upload) => upload.kind === "material")} base={base} />
          <LessonUploadForm task={null} label="Aggiungi materiali" uploadAction={uploadTeacherLessonFiles.bind(null, id, "material")} />
        </section> : <p className="glass-dashboard rounded-2xl p-5 text-sm text-muted-foreground">Salva la lezione per aggiungere materiali e compiti.</p>}
      </div>}
    {details && <section className="glass-dashboard space-y-4 rounded-2xl p-5">
      <h2 className="flex items-center gap-2 font-semibold"><ClipboardList className="size-4 text-primary" aria-hidden /> Compiti e consegne</h2>
      {details.tasks.map((task) => {
        const uploads = details.uploads.filter((upload) => upload.task_id === task.id)
        const submissions = uploads.filter((upload) => upload.kind === "submission")
        return <details key={task.id} className="rounded-xl border border-border/70 bg-white/40 p-4" open={submissions.length > 0 || undefined}>
          <summary className="cursor-pointer text-sm font-medium">
            {task.title} <Badge variant="outline" className="ml-2">{task.published ? "Pubblicato" : "Bozza"}</Badge>
            <span className="ml-2 text-muted-foreground">{submissions.length} {submissions.length === 1 ? "consegna" : "consegne"}</span>
          </summary>
          <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
            <TaskForm id={id} task={task} />
            <div className="space-y-3">
              <LessonFileList uploads={uploads.filter((upload) => upload.kind === "assignment")} base={base} />
              <LessonUploadForm task={task.id} label="Allega una scheda al compito" uploadAction={uploadTeacherLessonFiles.bind(null, id, "assignment")} />
              {submissions.length > 0 && <div className="space-y-2">
                <h3 className="text-sm font-semibold">Consegne ricevute</h3>
                <LessonFileList uploads={submissions} base={base} deliveries />
              </div>}
            </div>
          </div>
        </details>
      })}
      <details className="rounded-xl border border-border/70 bg-white/40 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-primary">Nuovo compito</summary>
        <div className="mt-4"><TaskForm id={id} /></div>
      </details>
    </section>}
  </div>
}

function TaskForm({ id, task }: { id: string; task?: Task }) {
  return <LessonEditorForm label={task ? "Salva compito" : "Crea compito"} resetOnSave={!task} saveAction={saveLocationTask.bind(null, id, task?.id ?? null)}>
    <label className="grid gap-1.5 text-sm font-medium">Titolo<Input name="title" defaultValue={task?.title} required maxLength={160} /></label>
    <label className="grid gap-1.5 text-sm font-medium">Istruzioni<Textarea name="instructions" rows={4} defaultValue={task?.instructions} maxLength={6000} /></label>
    <label className="grid gap-1.5 text-sm font-medium">Scadenza (facoltativa)<Input name="due" type="date" defaultValue={task?.due_date ?? ""} /></label>
    <label className="flex items-center gap-2 text-sm"><input name="published" type="checkbox" defaultChecked={task?.published} className="accent-primary" /> Pubblica il compito</label>
  </LessonEditorForm>
}
