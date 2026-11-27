import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, BookOpen, ClipboardList, FolderOpen } from "lucide-react"
import { publishLocationHomework, removeTeacherLessonFile, saveLocationLesson, saveLocationTask, uploadTeacherLessonFiles } from "@/app/actions/location-lessons"
import { getLesson, getLessonDetails, teacherSession, type Task } from "@/lib/clients/location-lessons"
import { LessonEditorForm } from "@/components/clients/lesson-editor-form"
import { LessonFileList, lessonDate } from "@/components/clients/lesson-content"
import { HomeworkUploadForm } from "@/components/clients/homework-upload-form"
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
      <div className="space-y-5">
        <section className="glass-dashboard space-y-4 rounded-2xl p-5">
          <h2 className="flex items-center gap-2 font-semibold"><BookOpen className="size-4 text-primary" aria-hidden /> Argomenti</h2>
          <LessonEditorForm label="Salva lezione" saveAction={saveLocationLesson.bind(null, id)}>
            <label className="grid gap-1.5 text-sm font-medium">Titolo pubblico (facoltativo)<Input name="title" defaultValue={lesson?.title} maxLength={160} placeholder="Es. Il verbo avere alla forma interrogativa" /></label>
            <label className="grid gap-1.5 text-sm font-medium">Argomenti svolti<Textarea name="topics" rows={12} className="min-h-64 leading-relaxed" defaultValue={lesson?.topics} maxLength={6000} /></label>
            <label className="flex items-center gap-2 text-sm"><input name="published" type="checkbox" defaultChecked={lesson?.published} className="accent-primary" /> Pubblica nell’area cliente</label>
          </LessonEditorForm>
        </section>
        <section className="glass-dashboard space-y-4 rounded-2xl p-5">
          <h2 className="flex items-center gap-2 font-semibold"><FolderOpen className="size-4 text-primary" aria-hidden /> Materiali della lezione</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-dashed border-primary/25 bg-primary/[0.035] p-4 sm:p-5">
              <LessonUploadForm task={null} label="Scegli documenti da allegare" uploadAction={uploadTeacherLessonFiles.bind(null, id, "material")} />
            </div>
            <div className="space-y-2 rounded-xl border border-border/70 bg-white/40 p-4 sm:p-5">
              <h3 className="text-sm font-semibold">Documenti allegati</h3>
              <p className="text-xs text-muted-foreground">{lesson?.published ? "I documenti confermati sono visibili al cliente." : "I documenti saranno visibili quando pubblichi la lezione."}</p>
              {details?.uploads.some((upload) => upload.kind === "material") ? (
                <LessonFileList uploads={details.uploads.filter((upload) => upload.kind === "material")} base={base} removeAction={removeTeacherLessonFile.bind(null, id)} />
              ) : <p className="text-sm text-muted-foreground">Nessun documento allegato.</p>}
            </div>
          </div>
        </section>
      </div>}
    {!error && <section aria-labelledby="homework-heading" className="glass-dashboard space-y-4 rounded-2xl p-5">
      <h2 id="homework-heading" className="flex items-center gap-2 font-semibold"><ClipboardList className="size-4 text-primary" aria-hidden /> Compiti per casa</h2>
      {details?.tasks.map((task) => {
        const uploads = details.uploads.filter((upload) => upload.task_id === task.id)
        const submissions = uploads.filter((upload) => upload.kind === "submission")
        const documents = uploads.filter((upload) => upload.kind === "assignment")
        const status = task.published && lesson?.published ? "Visibile al cliente" : task.published ? "In attesa della pubblicazione della lezione" : "Bozza"
        return <details key={task.id} className="rounded-xl border border-border/70 bg-white/40 p-4" open={(submissions.length > 0 || !task.published || !documents.length) || undefined}>
          <summary className="cursor-pointer text-sm font-medium">
            {task.title} <Badge variant="outline" className="ml-2">{status}</Badge>
            <span className="ml-2 text-muted-foreground">{submissions.length} {submissions.length === 1 ? "consegna" : "consegne"}</span>
          </summary>
          <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
            <TaskForm id={id} task={task} />
            <div className="space-y-3">
              <LessonFileList uploads={documents} base={base} removeAction={removeTeacherLessonFile.bind(null, id)} />
              {!task.published && documents.length > 0 && <LessonEditorForm
                label="Pubblica compito" saveAction={publishLocationHomework.bind(null, id, task.id)} />}
              <LessonUploadForm task={task.id} label="Documenti del compito" uploadAction={uploadTeacherLessonFiles.bind(null, id, "assignment")} />
              {submissions.length > 0 && <div className="space-y-2">
                <h3 className="text-sm font-semibold">Consegne ricevute</h3>
                <LessonFileList uploads={submissions} base={base} deliveries />
              </div>}
            </div>
          </div>
        </details>
      })}
      <details className="rounded-xl border border-border/70 bg-white/40 p-4" open={!details?.tasks.length || undefined}>
        <summary className="cursor-pointer text-sm font-semibold text-primary">Nuovo compito</summary>
        <div className="mt-3"><HomeworkUploadForm sessionId={id} /></div>
      </details>
    </section>}
  </div>
}

function TaskForm({ id, task }: { id: string; task: Task }) {
  return <LessonEditorForm label="Salva compito" saveAction={saveLocationTask.bind(null, id, task.id)}>
    <label className="grid gap-1.5 text-sm font-medium">Titolo<Input name="title" defaultValue={task?.title} required maxLength={160} /></label>
    <label className="grid gap-1.5 text-sm font-medium">Istruzioni<Textarea name="instructions" rows={4} defaultValue={task?.instructions} maxLength={6000} /></label>
    <label className="grid gap-1.5 text-sm font-medium">Scadenza (facoltativa)<Input name="due" type="date" defaultValue={task?.due_date ?? ""} /></label>
    <label className="flex items-center gap-2 text-sm"><input name="published" type="checkbox" defaultChecked={task?.published} className="accent-primary" /> Pubblica il compito</label>
  </LessonEditorForm>
}
