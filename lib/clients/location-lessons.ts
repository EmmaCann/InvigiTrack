import "server-only"

import { cookies } from "next/headers"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/lib/data/auth"
import { locationCookie, readLocationToken, type LocationScope } from "./location-access"

export const identifier = z.uuid()
export type Lesson = {
  session_id: string; owner_id: string; workspace_id: string; location: string
  title: string; topics: string; published: boolean
}
export type Task = { id: string; title: string; instructions: string; due_date: string | null; published: boolean }
export type LessonFile = { id: string; name: string; mime: string; size_bytes: number }
export type Upload = {
  id: string; kind: "material" | "assignment" | "submission"; task_id: string | null
  confirmed_at: string; location_lesson_files: LessonFile[]
}
type Db = NonNullable<ReturnType<typeof createAdminClient>>

export async function authorizedLocation(slug: string) {
  const token = (await cookies()).get(locationCookie)?.value
  const scope = await readLocationToken(token, slug)
  return scope
}

export async function teacherSession(id: string) {
  if (!identifier.safeParse(id).success) return null
  const user = await getCurrentUser()
  const db = user && createAdminClient()
  if (!user || !db) return null
  const { data: session } = await db.from("sessions").select("id, location, workspace_id, session_date")
    .eq("id", id).eq("user_id", user.id).maybeSingle()
  if (!session?.location?.trim() || !session.workspace_id) return null
  const { data: workspace } = await db.from("user_category_access").select("id")
    .eq("id", session.workspace_id).eq("user_id", user.id).maybeSingle()
  if (!workspace) return null
  const scope: LocationScope = { owner: user.id, workspace: session.workspace_id, location: session.location }
  return { db, scope, session }
}

export async function portalSession(slug: string, id: string) {
  if (!identifier.safeParse(id).success) return null
  const scope = await authorizedLocation(slug)
  const db = scope && createAdminClient()
  if (!scope || !db) return null
  const [session, workspace] = await Promise.all([
    db.from("sessions").select("id").eq("id", id).eq("user_id", scope.owner)
      .eq("workspace_id", scope.workspace).eq("location", scope.location).maybeSingle(),
    db.from("user_category_access").select("id").eq("id", scope.workspace).eq("user_id", scope.owner).maybeSingle(),
  ])
  if (!session.data || !workspace.data) return null
  return { db, scope }
}

export async function getLesson(db: Db, scope: LocationScope, id: string, client = false) {
  const query = db.from("location_lessons").select("session_id, owner_id, workspace_id, location, title, topics, published")
    .eq("session_id", id).eq("owner_id", scope.owner).eq("workspace_id", scope.workspace).eq("location", scope.location)
  if (client) query.eq("published", true)
  return query.maybeSingle<Lesson>()
}

export async function getLessonDetails(db: Db, sessionId: string, client = false) {
  const tasks = db.from("location_lesson_tasks").select("id, title, instructions, due_date, published")
    .eq("session_id", sessionId).order("id")
  if (client) tasks.eq("published", true)
  const uploads = db.from("location_lesson_uploads")
    .select("id, kind, task_id, confirmed_at, location_lesson_files(id, name, mime, size_bytes)")
    .eq("session_id", sessionId).not("confirmed_at", "is", null).order("confirmed_at", { ascending: false })
  const [{ data: taskRows, error: taskError }, { data: uploadRows, error: uploadError }] = await Promise.all([tasks, uploads])
  if (taskError || uploadError) throw new Error("Impossibile caricare i contenuti della lezione.")
  const visible = new Set((taskRows ?? []).map((task) => task.id))
  return {
    tasks: (taskRows ?? []) as Task[],
    uploads: ((uploadRows ?? []) as Upload[]).filter((file) => !file.task_id || visible.has(file.task_id)),
  }
}
