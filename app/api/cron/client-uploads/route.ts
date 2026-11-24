import { createAdminClient } from "@/lib/supabase/admin"
import { bucketName, objectPath } from "@/lib/clients/files"

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response(null, { status: 401 })
  }
  const db = createAdminClient()
  if (!db) return new Response(null, { status: 503 })
  const cutoff = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
  const { data, error } = await db.from("client_uploads")
    .select("id, client_id, client_files(id)").is("confirmed_at", null).lt("created_at", cutoff).limit(100)
  if (error) return new Response(null, { status: 503 })
  for (const batch of data) {
    const paths = batch.client_files.map((file) => objectPath(batch.client_id, batch.id, file.id))
    if (paths.length && (await db.storage.from(bucketName).remove(paths)).error) return new Response(null, { status: 503 })
    const { error: deleteError } = await db.from("client_uploads").delete().eq("id", batch.id).is("confirmed_at", null)
    if (deleteError) return new Response(null, { status: 503 })
  }
  await db.from("client_rate_limits").delete().lt("window_start", cutoff)
  return new Response(null, { status: 204 })
}
