import "server-only"

import { randomUUID } from "node:crypto"
import { z } from "zod"
import { allowClientRequest, uuidPattern, type ClientManager } from "./access"
import { readPages } from "./records"

export const bucketName = "client-files"
const maxSize = 20 * 1024 * 1024
const mimeByExtension = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
} as const

type UploadKind = "material" | "attachment" | "submission"
type UploadActor = { db: ClientManager["db"]; id: string; owner?: string; workspace?: string; hash?: string }
type FileRow = { id: string; filename: string; mime: string; size_bytes: number }
type Batch = { id: string; kind: UploadKind; lesson_id: string | null; task_id: string | null; confirmed_at: string; client_files: FileRow[] }
export type ClientTask = { id: string; lesson_id: string; title: string; instructions: string; due_date: string | null; published: boolean }

export const uploadInput = z.discriminatedUnion("step", [
  z.object({
    step: z.literal("start"),
    target: z.string().regex(uuidPattern),
    files: z.array(z.object({
      name: z.string().min(1).max(160),
      size: z.number().int().min(1).max(maxSize),
    })).min(1).max(5),
  }),
  z.object({ step: z.literal("confirm"), batch: z.string().regex(uuidPattern) }),
])
export type UploadInput = z.infer<typeof uploadInput>

export const objectPath = (client: string, batch: string, file: string) => `${client}/${batch}/${file}`
function mimeFor(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() as keyof typeof mimeByExtension
  return Object.hasOwn(mimeByExtension, ext) ? mimeByExtension[ext] : null
}

export function matchesFileFormat(bytes: Buffer, mime: string) {
  switch (mime) {
    case mimeByExtension.pdf:
      return bytes.subarray(0, 5).toString("ascii") === "%PDF-"
    case mimeByExtension.png:
      return bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))
    case mimeByExtension.jpg:
      return bytes.subarray(0, 3).equals(Buffer.from("ffd8ff", "hex"))
    case mimeByExtension.txt:
      try {
        const value = new TextDecoder("utf-8", { fatal: true }).decode(bytes)
        return !/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/u.test(value)
      } catch { return false }
    case mimeByExtension.docx: {
      // Validate the ZIP central directory without decompressing user content.
      if (bytes.length < 22 || bytes.readUInt32LE(0) !== 0x04034b50) return false
      const end = bytes.lastIndexOf(Buffer.from("504b0506", "hex"))
      if (end < 0 || end + 22 > bytes.length || end + 22 + bytes.readUInt16LE(end + 20) !== bytes.length) return false
      const entries = bytes.readUInt16LE(end + 10)
      let offset = bytes.readUInt32LE(end + 16)
      const names = new Set<string>()
      for (let i = 0; i < entries; i++) {
        if (offset + 46 > end || bytes.readUInt32LE(offset) !== 0x02014b50) return false
        const length = bytes.readUInt16LE(offset + 28)
        if (offset + 46 + length > end) return false
        names.add(bytes.subarray(offset + 46, offset + 46 + length).toString("utf8"))
        offset += 46 + length + bytes.readUInt16LE(offset + 30) + bytes.readUInt16LE(offset + 32)
      }
      return names.has("[Content_Types].xml") && names.has("word/document.xml") && !names.has("word/vbaProject.bin")
    }
    default: return false
  }
}

export async function handleClientUpload(actor: UploadActor, kind: UploadKind, input: UploadInput) {
  const { db, id } = actor
  const failure = { error: "Caricamento non riuscito. Verifica i file e riprova." }
  if (!await allowClientRequest(db, `upload:${kind}:${id}`, 20)) return { error: "Attendi un minuto prima di riprovare." }
  const scope = { p_client: id, p_owner: actor.owner ?? null, p_workspace: actor.workspace ?? null, p_hash: actor.hash ?? null }
  const bucket = db.storage.from(bucketName)
  if (input.step === "start") {
    const batch = randomUUID()
    const files = input.files.map((file) => ({
      id: randomUUID(),
      filename: file.name.replace(/[\/\\\u0000-\u001F\u007F]/gu, "_"),
      mime: mimeFor(file.name),
      size_bytes: file.size,
    }))
    if (files.some((file) => !file.mime)) return { error: "Formati consentiti: PDF, DOCX, TXT, JPG e PNG." }
    const { error } = await db.rpc("reserve_client_upload", {
      ...scope, p_id: batch, p_kind: kind, p_target: input.target, p_files: files,
    })
    if (error) return { error: "Caricamento non disponibile. Controlla la pubblicazione e la quota giornaliera." }

    const uploads = await Promise.all(files.map(async (file) => {
      const path = objectPath(id, batch, file.id)
      const { data } = await bucket.createSignedUploadUrl(path, { upsert: false })
      return data ? { url: data.signedUrl, mime: file.mime! } : null
    }))
    if (uploads.some((item) => item === null)) return failure
    return { batch, uploads: uploads.filter((item) => item !== null) }
  }

  const { data } = await db.from("client_uploads").select(
    "id, kind, access_hash, confirmed_at, created_at, client_files(id, filename, mime, size_bytes)",
  ).eq("client_id", id).eq("id", input.batch).eq("kind", kind).maybeSingle()
  if (!data || data.access_hash !== scope.p_hash) return failure
  if (!data.confirmed_at) {
    if (Date.now() - Date.parse(data.created_at) > 2 * 60 * 60 * 1000 || !data.client_files.length) return failure
    for (const file of data.client_files) {
      const path = objectPath(id, input.batch, file.id)
      const { data: object } = await bucket.download(path)
      if (!object || object.size !== file.size_bytes || !matchesFileFormat(Buffer.from(await object.arrayBuffer()), file.mime)) return failure
    }
  }
  const { error } = await db.rpc("confirm_client_upload", { ...scope, p_id: input.batch })
  return error ? failure : { confirmed: true }
}

export async function getClientMaterials(db: ClientManager["db"], clientId: string, lessons: string[], teacher = false) {
  if (!lessons.length) return { tasks: [], batches: [] as Batch[] }
  const tasks: ClientTask[] = []
  for (let offset = 0; offset < lessons.length; offset += 80) {
    const query = db.from("client_tasks").select("id, lesson_id, title, instructions, due_date, published")
      .in("lesson_id", lessons.slice(offset, offset + 80)).order("due_date").order("id")
    if (!teacher) query.eq("published", true)
    tasks.push(...await readPages<ClientTask>(query))
  }
  tasks.sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999") || a.id.localeCompare(b.id))
  const lessonIds = new Set(lessons)
  const taskIds = new Set(tasks.map((task) => task.id))
  const batches = await readPages<Batch>(
    db.from("client_uploads").select("id, kind, lesson_id, task_id, confirmed_at, client_files(id, filename, mime, size_bytes)")
      .eq("client_id", clientId).not("confirmed_at", "is", null).order("confirmed_at", { ascending: false }).order("id"),
  )
  return {
    tasks,
    batches: batches.filter((batch) => (batch.lesson_id && lessonIds.has(batch.lesson_id)) || (batch.task_id && taskIds.has(batch.task_id))),
  }
}

export async function downloadClientFile(actor: UploadActor, fileId: string) {
  if (!uuidPattern.test(fileId)) return new Response(null, { status: 404 })
  const { db, id } = actor
  const { data: file } = await db.from("client_files")
    .select("id, filename, client_uploads!inner(id, kind, lesson_id, task_id, confirmed_at)")
    .eq("id", fileId).eq("client_uploads.client_id", id).not("client_uploads.confirmed_at", "is", null).maybeSingle()
  const batch = file && (Array.isArray(file.client_uploads) ? file.client_uploads[0] : file.client_uploads)
  if (!file || !batch) return new Response(null, { status: 404 })

  let lessonId = batch.lesson_id
  if (batch.task_id) {
    const { data: task } = await db.from("client_tasks").select("lesson_id, published").eq("id", batch.task_id).maybeSingle()
    if (!task || (actor.hash && !task.published)) return new Response(null, { status: 404 })
    lessonId = task.lesson_id
  }
  if (!lessonId) return new Response(null, { status: 404 })
  const { data: allowed } = await db.rpc("client_file_allowed", {
    p_client: id, p_lesson: lessonId, p_task: batch.task_id,
    p_owner: actor.owner ?? null, p_workspace: actor.workspace ?? null, p_hash: actor.hash ?? null,
  })
  if (!allowed) return new Response(null, { status: 404 })
  const { data: fileData } = await db.storage.from(bucketName).download(objectPath(id, batch.id, file.id))
  if (!fileData) return new Response(null, { status: 404 })
  return new Response(fileData, { headers: {
    "Content-Type": "application/octet-stream",
    "Content-Disposition": `attachment; filename="file"; filename*=UTF-8''${encodeURIComponent(file.filename).replace(/[!'()*]/g, (char) => "%" + char.charCodeAt(0).toString(16))}`,
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "private, no-store",
  } })
}
