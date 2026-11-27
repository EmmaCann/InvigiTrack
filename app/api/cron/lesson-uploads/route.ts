import { createAdminClient } from "@/lib/supabase/admin"
import { lessonBucket, lessonFilePath } from "@/lib/clients/lesson-files"

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response(null, { status: 401 })
  }
  const db = createAdminClient()
  if (!db) return new Response(null, { status: 503 })
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await db.from("location_lesson_uploads")
    .select("id, session_id, location_lesson_files(id)").is("confirmed_at", null)
    .lt("created_at", cutoff).order("created_at").limit(100)
  if (error) return new Response(null, { status: 503 })
  const storage = db.storage.from(lessonBucket)
  for (const upload of data) {
    const paths = upload.location_lesson_files.map((file) => lessonFilePath(upload.session_id, upload.id, file.id))
    if (paths.length && (await storage.remove(paths)).error) return new Response(null, { status: 503 })
    if ((await db.from("location_lesson_uploads").delete().eq("id", upload.id).is("confirmed_at", null)).error) {
      return new Response(null, { status: 503 })
    }
  }
  const removed = await db.from("location_lesson_files")
    .select("id, upload_id, location_lesson_uploads!inner(session_id)")
    .lt("removed_at", cutoff).order("removed_at").limit(100)
  if (removed.error) return new Response(null, { status: 503 })
  const paths = removed.data.flatMap((file) => {
    const upload = Array.isArray(file.location_lesson_uploads) ? file.location_lesson_uploads[0] : file.location_lesson_uploads
    return upload ? [lessonFilePath(upload.session_id, file.upload_id, file.id)] : []
  })
  if (paths.length) {
    if ((await storage.remove(paths)).error) return new Response(null, { status: 503 })
    const { error: deletionError } = await db.from("location_lesson_files").delete()
      .in("id", removed.data.map((file) => file.id)).lt("removed_at", cutoff)
    if (deletionError) return new Response(null, { status: 503 })
  }
  return new Response(null, { status: 204 })
}
