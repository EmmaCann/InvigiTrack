import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { saveClientTask, uploadClientMaterial } from "@/app/actions/clients"
import type { ClientTask, getClientMaterials } from "@/lib/clients/files"
import type { Lesson } from "@/lib/clients/records"
import { ClientForm } from "./client-controls"
import { ClientPanel, dateLabel } from "./portal-view"
import { UploadForm } from "./upload-form"

type Materials = Awaited<ReturnType<typeof getClientMaterials>>
type Batch = Materials["batches"][number]

function FileList({ batches, base, showDate = false }: { batches: Batch[]; base?: string; showDate?: boolean }) {
  if (!batches.length) return null
  return <ul className="space-y-2 text-sm">{batches.map((batch) => <li key={batch.id} id={`consegna-${batch.id}`} className="scroll-mt-4">
    {showDate && <p className="text-xs text-muted-foreground">{new Intl.DateTimeFormat("it-IT", {
      dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Rome",
    }).format(new Date(batch.confirmed_at))}</p>}
    <ul className="space-y-1">{batch.client_files.map((file) => <li key={file.id}>
      {base ? <a href={`${base}/file/${file.id}`} className="break-all font-medium text-primary underline underline-offset-2">{file.filename}</a>
        : <span className="break-all">{file.filename}</span>}
    </li>)}</ul>
  </li>)}</ul>
}

export function PortalMaterials({ id, materials, lessons, preview = false }: {
  id: string; materials: Materials; lessons: Lesson[]; preview?: boolean
}) {
  const base = preview ? undefined : `/clienti/${id}`
  return <>
    {lessons.map((lesson) => {
      const files = materials.batches.filter((batch) => batch.lesson_id === lesson.id)
      if (!files.length) return null
      return <ClientPanel key={lesson.id} title={`Materiali · ${lesson.title || "Lezione"}`}>
        <FileList batches={files} base={base} />
      </ClientPanel>
    })}
    {materials.tasks.map((task) => {
      const batches = materials.batches.filter((batch) => batch.task_id === task.id)
      const submissions = batches.filter((batch) => batch.kind === "submission")
      return <ClientPanel key={task.id} title={task.title}>
        <Badge variant={submissions.length ? "secondary" : "outline"}>{submissions.length ? "Consegnato" : "Da consegnare"}</Badge>
        {task.due_date && <p className="text-sm text-muted-foreground">Scadenza {dateLabel(task.due_date)}</p>}
        {task.instructions && <p className="whitespace-pre-wrap text-sm">{task.instructions}</p>}
        <FileList batches={batches.filter((batch) => batch.kind === "attachment")} base={base} />
        {submissions.length > 0 && <div className="space-y-2"><h3 className="text-sm font-semibold">Consegne precedenti</h3>
          <FileList batches={submissions} base={base} showDate />
        </div>}
        {base && <UploadForm target={task.id} label={submissions.length ? "Nuova consegna" : "Consegna il compito"} endpoint={`${base}/consegne`} />}
      </ClientPanel>
    })}
  </>
}

export function TeacherMaterials({ id, workspace, lesson, materials, highlighted }: {
  id: string; workspace: string; lesson: Lesson; materials: Materials; highlighted?: string
}) {
  const base = `/dashboard/clients/${id}`
  const tasks = materials.tasks.filter((task) => task.lesson_id === lesson.id)
  return <div className="mt-5 space-y-4 border-t border-border pt-4">
    <FileList base={base} batches={materials.batches.filter((batch) => batch.lesson_id === lesson.id)} />
    <UploadForm target={lesson.id} label="Aggiungi materiali" uploadAction={uploadClientMaterial.bind(null, workspace, id, "material")} />
    <details className="rounded-xl border border-border p-3">
      <summary className="cursor-pointer text-sm font-medium">Nuovo compito</summary>
      <TaskForm submit={saveClientTask.bind(null, workspace, id, lesson.id, null)} />
    </details>
    {tasks.map((task) => {
      const batches = materials.batches.filter((batch) => batch.task_id === task.id)
      const submissions = batches.filter((batch) => batch.kind === "submission")
      return <details key={task.id} open={highlighted && submissions.some((batch) => batch.id === highlighted) ? true : undefined}
        className="rounded-xl border border-border p-3">
        <summary className="cursor-pointer text-sm font-medium">
          {task.title} · {task.published ? "Pubblicato" : "Bozza"} · {submissions.length} {submissions.length === 1 ? "consegna" : "consegne"}
        </summary>
        <TaskForm task={task} submit={saveClientTask.bind(null, workspace, id, lesson.id, task.id)} />
        <div className="mt-4 space-y-3">
          <FileList base={base} batches={batches.filter((batch) => batch.kind === "attachment")} />
          <UploadForm target={task.id} label="Allegati del compito" uploadAction={uploadClientMaterial.bind(null, workspace, id, "attachment")} />
          <FileList base={base} batches={submissions} showDate />
        </div>
      </details>
    })}
  </div>
}

function TaskForm({ task, submit }: { task?: ClientTask; submit: (form: FormData) => Promise<{ error?: string }> }) {
  return <div className="mt-3"><ClientForm label={task ? "Salva compito" : "Crea compito"} submitAction={submit} resetOnSuccess={!task}>
    <label className="grid gap-1 text-sm">Titolo<Input name="title" defaultValue={task?.title} maxLength={160} required /></label>
    <label className="grid gap-1 text-sm">Istruzioni<Textarea name="instructions" defaultValue={task?.instructions} maxLength={6000} /></label>
    <label className="grid gap-1 text-sm">Scadenza (facoltativa)<Input name="due" type="date" defaultValue={task?.due_date ?? ""} /></label>
    <label className="flex items-center gap-2 text-sm"><input name="published" type="checkbox" className="accent-primary" defaultChecked={task?.published} /> Pubblicato</label>
  </ClientForm></div>
}

export function pendingTaskCount(materials: Materials) {
  const submitted = new Set(materials.batches.filter((batch) => batch.kind === "submission").map((batch) => batch.task_id))
  return materials.tasks.filter((task) => !submitted.has(task.id)).length
}
