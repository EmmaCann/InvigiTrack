import "server-only"

import type { ClientManager } from "./access"
import type { PaymentStatus } from "@/types/database"

export type Lesson = { id: string; title: string; topics: string; description: string; published: boolean }
export type LessonSession = {
  id: string; client_lesson_id: string | null; session_date: string; duration_minutes: number
  earned: number; payment_status: PaymentStatus; archived_at: string | null
}
export type LessonEvent = {
  id: string; client_lesson_id: string | null; event_date: string; start_time: string | null; end_time: string | null
}

export async function getClientRecords(
  db: ClientManager["db"], client: { id: string; user_id: string; workspace_id: string }, preview = false,
) {
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Rome" }).format(new Date())
  const sessions = db.from("sessions")
    .select("id, client_lesson_id, session_date, duration_minutes, earned, payment_status, archived_at")
    .eq("user_id", client.user_id).eq("workspace_id", client.workspace_id).eq("client_id", client.id)
    .order("session_date", { ascending: false }).order("id")
  const events = db.from("calendar_events")
    .select("id, client_lesson_id, event_date, start_time, end_time")
    .eq("user_id", client.user_id).eq("workspace_id", client.workspace_id).eq("client_id", client.id)
    .eq("is_converted", false).order("event_date").order("start_time").order("id")
  const lessons = db.from("client_lessons").select("id, title, topics, description, published").eq("client_id", client.id).order("id")
  if (!preview) lessons.eq("published", true)

  const [sessionRows, eventRows, lessonRows] = await Promise.all([
    readPages<LessonSession>(sessions), readPages<LessonEvent>(events), readPages<Lesson>(lessons),
  ])
  const linkedLessons = new Set([...sessionRows, ...eventRows].map((row) => row.client_lesson_id))
  return {
    sessions: sessionRows,
    events: preview ? eventRows : eventRows.filter((row) => row.event_date >= today),
    lessons: lessonRows.filter((row) => linkedLessons.has(row.id)),
  }
}

export async function readPages<T>(query: {
  range: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>
}) {
  const rows: T[] = []
  for (let offset = 0; ; offset += 250) {
    const { data, error } = await query.range(offset, offset + 249)
    if (error || !data) throw new Error("Impossibile caricare i dati dell’area clienti")
    rows.push(...data)
    if (data.length < 250) return rows
  }
}
