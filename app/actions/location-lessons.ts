"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getLesson, identifier, teacherSession } from "@/lib/clients/location-lessons"
import { lessonUploadInput, uploadLessonFiles, type LessonUploadResult } from "@/lib/clients/lesson-files"

const failure = { error: "Salvataggio non riuscito. Verifica i dati o le migrazioni Supabase." }
const unavailable = { error: "Sessione non disponibile." }
const fields = z.object({ title: z.string().trim().max(160), body: z.string().trim().max(6000) })
const teacherPath = (id: string) => `/dashboard/sessions/${id}/contenuti`

async function ensureLessonDraft(actor: NonNullable<Awaited<ReturnType<typeof teacherSession>>>, id: string) {
  const { db, scope } = actor
  const existing = await getLesson(db, scope, id)
  if (existing.error) return false
  if (existing.data) return true

  // Ignore concurrent creation so uploading never overwrites a saved title or publication state.
  const { error } = await db.from("location_lessons").upsert({
    session_id: id, owner_id: scope.owner, workspace_id: scope.workspace, location: scope.location,
  }, { onConflict: "session_id", ignoreDuplicates: true })
  return !error
}

export async function saveLocationLesson(id: string, form: FormData) {
  const actor = await teacherSession(id)
  if (!actor) return unavailable
  const parsed = fields.safeParse({ title: form.get("title"), body: form.get("topics") })
  if (!parsed.success) return failure
  const { db, scope } = actor
  if (!await ensureLessonDraft(actor, id)) return failure
  const patch = { title: parsed.data.title, topics: parsed.data.body, published: form.has("published") }
  const { data, error } = await db.from("location_lessons").update(patch).eq("session_id", id)
    .eq("owner_id", scope.owner).eq("workspace_id", scope.workspace).eq("location", scope.location)
    .select("session_id").maybeSingle()
  if (error) return failure
  if (!data) return { error: "La sessione ha già contenuti associati a un altro cliente." }
  revalidatePath(teacherPath(id))
  return {}
}

export async function saveLocationTask(id: string, taskId: string, form: FormData) {
  const actor = await teacherSession(id)
  if (!actor || !identifier.safeParse(taskId).success) return unavailable
  const { db, scope } = actor
  const parsed = fields.safeParse({ title: form.get("title"), body: form.get("instructions") })
  const due = form.get("due")
  const date = typeof due === "string" && due ? due : null
  if (!parsed.success || !parsed.data.title || (date && !z.iso.date().safeParse(date).success)) return failure
  if (!(await getLesson(db, scope, id)).data) return unavailable
  const published = form.has("published")
  if (published) {
    const { data, error } = await db.from("location_lesson_uploads").select("id")
      .eq("session_id", id).eq("task_id", taskId).eq("kind", "assignment").not("confirmed_at", "is", null).limit(1)
    if (error) return failure
    if (!data?.length) return { error: "Allega un documento prima di pubblicare il compito." }
  }
  const { error } = await db.from("location_lesson_tasks")
    .update({ title: parsed.data.title, instructions: parsed.data.body, due_date: date, published })
    .eq("id", taskId).eq("session_id", id).select("id").single()
  if (error) return failure
  revalidatePath(teacherPath(id))
  return {}
}

export async function uploadTeacherLessonFiles(id: string, kind: "material" | "assignment", payload: unknown): Promise<LessonUploadResult> {
  if (kind !== "material" && kind !== "assignment") return unavailable
  const actor = await teacherSession(id)
  if (!actor) return unavailable
  const input = lessonUploadInput.safeParse(payload)
  if (!input.success) return { error: "Seleziona fino a 5 file, massimo 20 MB ciascuno." }
  if (kind === "material" && input.data.step === "start" && input.data.task === null && !await ensureLessonDraft(actor, id)) {
    return failure
  }
  const result = await uploadLessonFiles(actor, id, kind, input.data)
  if (result.confirmed) revalidatePath(teacherPath(id))
  return result
}


export async function startHomeworkUpload(id: string, draftId: string, payload: unknown): Promise<LessonUploadResult> {
  if (!identifier.safeParse(draftId).success) return unavailable
  const actor = await teacherSession(id)
  if (!actor) return unavailable
  const input = lessonUploadInput.safeParse(payload)
  if (!input.success || input.data.step !== "start" || input.data.task !== null) return failure
  if (!input.data.files.every(({ name }) => /\.(pdf|docx|txt|jpe?g|png)$/i.test(name))) {
    return { error: "Formati consentiti: PDF, DOCX, TXT, JPG e PNG." }
  }

  const { db, scope } = actor
  if (!await ensureLessonDraft(actor, id)) return failure
  if (!(await getLesson(db, scope, id)).data) return unavailable
  const title = input.data.files[0].name.replace(/\.[^.]+$/, "").trim().slice(0, 160) || "Compiti per casa"
  const { error } = await db.from("location_lesson_tasks")
    .upsert({ id: draftId, session_id: id, title }, { onConflict: "id", ignoreDuplicates: true })
  if (error) return failure
  return uploadLessonFiles(actor, id, "assignment", { ...input.data, task: draftId })
}
