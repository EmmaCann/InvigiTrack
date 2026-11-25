"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getLesson, identifier, teacherSession } from "@/lib/clients/location-lessons"
import { lessonUploadInput, uploadLessonFiles, type LessonUploadResult } from "@/lib/clients/lesson-files"

const failure = { error: "Salvataggio non riuscito. Verifica i dati o le migrazioni Supabase." }
const unavailable = { error: "Sessione non disponibile." }
const fields = z.object({ title: z.string().trim().max(160), body: z.string().trim().max(6000) })
const teacherPath = (id: string) => `/dashboard/sessions/${id}/contenuti`

export async function saveLocationLesson(id: string, form: FormData) {
  const actor = await teacherSession(id)
  if (!actor) return unavailable
  const parsed = fields.safeParse({ title: form.get("title"), body: form.get("topics") })
  if (!parsed.success) return failure
  const { db, scope } = actor
  const existing = await getLesson(db, scope, id)
  if (existing.error) return failure
  const patch = { title: parsed.data.title, topics: parsed.data.body, published: form.has("published") }
  const result = existing.data
    ? await db.from("location_lessons").update(patch).eq("session_id", id)
        .eq("owner_id", scope.owner).eq("workspace_id", scope.workspace).eq("location", scope.location)
    : await db.from("location_lessons").insert({
        ...patch, session_id: id, owner_id: scope.owner, workspace_id: scope.workspace, location: scope.location,
      })
  if (result.error?.code === "23505") return { error: "La sessione ha già contenuti associati a un altro cliente." }
  if (result.error) return failure
  revalidatePath(teacherPath(id))
  return {}
}

export async function saveLocationTask(id: string, taskId: string | null, form: FormData) {
  const actor = await teacherSession(id)
  if (!actor || (taskId && !identifier.safeParse(taskId).success)) return unavailable
  const { db, scope } = actor
  if (!(await getLesson(db, scope, id)).data) return unavailable
  const parsed = fields.safeParse({ title: form.get("title"), body: form.get("instructions") })
  const due = form.get("due")
  const date = typeof due === "string" && due ? due : null
  if (!parsed.success || !parsed.data.title || (date && !z.iso.date().safeParse(date).success)) return failure
  const patch = { title: parsed.data.title, instructions: parsed.data.body, due_date: date || null, published: form.has("published") }
  const tasks = db.from("location_lesson_tasks")
  const query = taskId ? tasks.update(patch).eq("id", taskId).eq("session_id", id) : tasks.insert({ ...patch, session_id: id })
  if ((await query.select("id").single()).error) return failure
  revalidatePath(teacherPath(id))
  return {}
}

export async function uploadTeacherLessonFiles(id: string, kind: "material" | "assignment", payload: unknown): Promise<LessonUploadResult> {
  if (kind !== "material" && kind !== "assignment") return unavailable
  const actor = await teacherSession(id)
  if (!actor) return unavailable
  const input = lessonUploadInput.safeParse(payload)
  if (!input.success) return { error: "Seleziona fino a 5 file, massimo 20 MB ciascuno." }
  const result = await uploadLessonFiles(actor, id, kind, input.data)
  if (result.confirmed) revalidatePath(teacherPath(id))
  return result
}
