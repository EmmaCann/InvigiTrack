import "server-only"

import { randomUUID } from "node:crypto"
import { z } from "zod"
import { identifier, getLesson, type LessonFile } from "./location-lessons"
import type { LocationScope } from "./location-access"
import type { createAdminClient } from "@/lib/supabase/admin"

import { allowedLessonFilesMessage, detectLessonFileExtension, lessonBucket, lessonFileExtension, lessonFileTypes } from "./lesson-storage"

export { lessonBucket }
const maxFileBytes = 20 * 1024 * 1024
type Db = NonNullable<ReturnType<typeof createAdminClient>>
type Kind = "material" | "assignment" | "submission"
type Actor = { db: Db; scope: LocationScope }
export const lessonUploadInput = z.discriminatedUnion("step", [
  z.object({ step: z.literal("start"), task: identifier.nullable(), files: z.array(z.object({
    name: z.string().min(1).max(160), size: z.number().int().min(1).max(maxFileBytes),
  })).min(1).max(5) }),
  z.object({ step: z.literal("confirm"), upload: identifier }),
])
export type LessonUploadInput = z.infer<typeof lessonUploadInput>
export type LessonUploadResult = { error?: string; upload?: string; files?: { path: string; token: string; mime: string }[]; confirmed?: boolean }

export const lessonFilePath = (session: string, upload: string, file: string) => `${session}/${upload}/${file}`

export async function uploadLessonFiles(actor: Actor, session: string, kind: Kind, input: LessonUploadInput): Promise<LessonUploadResult> {
  const { db, scope } = actor
  const failure = { error: "Caricamento non riuscito. Verifica i file e riprova." }
  const client = kind === "submission"
  if (!(await getLesson(db, scope, session, client)).data) return failure
  const storage = db.storage.from(lessonBucket)

  if (input.step === "start") {
    if ((kind === "material") !== (input.task === null)) return failure
    if (input.task) {
      const task = db.from("location_lesson_tasks").select("id").eq("id", input.task).eq("session_id", session)
      if (client) task.eq("published", true)
      if (!(await task.maybeSingle()).data) return failure
      if (client) {
        const { data } = await db.from("location_lesson_uploads").select("id, location_lesson_files!inner(id)")
          .eq("task_id", input.task).eq("session_id", session).eq("kind", "assignment").not("confirmed_at", "is", null).is("location_lesson_files.removed_at", null).limit(1)
        if (!data?.length) return failure
      }
    }

    const files: LessonFile[] = []
    for (const file of input.files) {
      const ext = lessonFileExtension(file.name)
      if (!ext) return { error: allowedLessonFilesMessage }
      files.push({
        id: randomUUID(),
        name: Array.from(file.name, (char) => {
          const code = char.charCodeAt(0)
          return code < 32 || code === 127 || char === "/" || char === "\\" ? "_" : char
        }).join(""),
        mime: lessonFileTypes[ext], size_bytes: file.size,
      })
    }
    const upload = randomUUID()
    const reserved = await db.rpc("reserve_location_lesson_upload", {
      p_id: upload, p_session: session, p_task: input.task, p_kind: kind, p_files: files,
    })
    if (reserved.error?.code === "PGRST202") return { error: "La migrazione Supabase per i materiali non è disponibile." }
    if (reserved.error) return { error: "Impossibile registrare il caricamento. Riprova." }
    if (!reserved.data) return { error: "Quota giornaliera raggiunta. Riprova domani." }

    const signed = await Promise.all(files.map(async (file) => {
      const path = lessonFilePath(session, upload, file.id)
      const { data } = await storage.createSignedUploadUrl(path, { upsert: false })
      return data ? { path, token: data.token, mime: file.mime } : null
    }))
    if (signed.some((item) => !item)) return { error: "Storage non ha autorizzato il caricamento. Verifica il bucket privato dei materiali." }
    return { upload, files: signed.filter((item) => item !== null) }
  }

  const { data } = await db.from("location_lesson_uploads")
    .select("confirmed_at, created_at, location_lesson_files(id, name, mime, size_bytes)")
    .eq("id", input.upload).eq("session_id", session).eq("kind", kind).maybeSingle()
  if (!data) return { error: "Caricamento non trovato. Seleziona di nuovo i file." }
  if (!data.confirmed_at) {
    if (!data.location_lesson_files.length) return { error: "Non risultano documenti da confermare." }
    if (Date.now() - Date.parse(data.created_at) >= 2 * 60 * 60 * 1000) return { error: "Caricamento scaduto. Seleziona di nuovo i file." }
    for (const file of data.location_lesson_files) {
      const { data: object } = await storage.download(lessonFilePath(session, input.upload, file.id))
      if (!object) return { error: `Storage non ha restituito «${file.name}». Riprova la conferma.` }
      if (object.size !== file.size_bytes) return { error: `«${file.name}» è incompleto. Seleziona di nuovo il file.` }
      const extension = detectLessonFileExtension(new Uint8Array(await object.arrayBuffer()), file.mime === lessonFileTypes.pages)
      if (!extension || lessonFileTypes[extension] !== file.mime) {
        return { error: `«${file.name}» non corrisponde al formato indicato dall’estensione.` }
      }
    }
  }

  const result = await db.rpc("confirm_location_lesson_upload", { p_id: input.upload, p_session: session, p_kind: kind })
  return result.data === true && !result.error ? { confirmed: true } : { error: "I file sono arrivati a Storage, ma il salvataggio non è stato confermato. Riprova la conferma." }
}

async function getAccessibleFile(actor: Actor, session: string, fileId: string, client: boolean) {
  const { db, scope } = actor
  if (!identifier.safeParse(fileId).success || !(await getLesson(db, scope, session, client)).data) return null
  const { data: file } = await db.from("location_lesson_files")
    .select("id, name, location_lesson_uploads!inner(id, task_id, kind)")
    .eq("id", fileId).is("removed_at", null).eq("location_lesson_uploads.session_id", session)
    .not("location_lesson_uploads.confirmed_at", "is", null).maybeSingle()
  if (!file) return null
  const upload = Array.isArray(file.location_lesson_uploads) ? file.location_lesson_uploads[0] : file.location_lesson_uploads
  if (!upload) return null

  if (client && upload.task_id) {
    const { data } = await db.from("location_lesson_tasks").select("id")
      .eq("id", upload.task_id).eq("session_id", session).eq("published", true).maybeSingle()
    if (!data) return null
  }
  return { id: file.id, name: file.name, uploadId: upload.id, kind: upload.kind }
}

export async function removeLessonFile(actor: Actor, session: string, fileId: string, client = false): Promise<{ error?: string }> {
  const file = await getAccessibleFile(actor, session, fileId, client)
  if (!file || (client ? file.kind !== "submission" : !["material", "assignment"].includes(file.kind))) {
    return { error: "Questo file non è disponibile per la rimozione." }
  }
  const { error } = await actor.db.from("location_lesson_files").update({ removed_at: new Date().toISOString() })
    .eq("id", file.id).eq("upload_id", file.uploadId).is("removed_at", null)
  return error ? { error: "Impossibile rimuovere il file. Riprova." } : {}
}

export async function downloadLessonFile(actor: Actor, session: string, fileId: string, client = false) {
  const missing = () => new Response(null, { status: 404 })
  const file = await getAccessibleFile(actor, session, fileId, client)
  if (!file) return missing()
  const { db } = actor
  const { data: object } = await db.storage.from(lessonBucket).download(lessonFilePath(session, file.uploadId, file.id))
  if (!object) return missing()
  const filename = encodeURIComponent(file.name).replace(/[!'()*]/g, (char) => "%" + char.charCodeAt(0).toString(16))
  return new Response(object.stream(), { headers: {
    "Content-Type": "application/octet-stream",
    "Content-Disposition": `attachment; filename="allegato"; filename*=UTF-8''${filename}`,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  } })
}
