import { portalSession } from "@/lib/clients/location-lessons"
import { lessonUploadInput, uploadLessonFiles } from "@/lib/clients/lesson-files"
import { readSmallBody } from "@/lib/clients/request-body"

export async function POST(request: Request, { params }: { params: Promise<{ nome: string; id: string }> }) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return new Response(null, { status: 403 })
  const { nome, id } = await params
  const actor = await portalSession(nome, id)
  if (!actor) return new Response(null, { status: 403 })
  const body = await readSmallBody(request, 4096)
  if (body === null) return new Response(null, { status: 413 })
  let payload: unknown
  try { payload = JSON.parse(body) } catch { return new Response(null, { status: 400 }) }
  const input = lessonUploadInput.safeParse(payload)
  if (!input.success) return Response.json({ error: "Seleziona fino a 5 file, massimo 20 MB ciascuno." }, { status: 400 })
  const result = await uploadLessonFiles(actor, id, "submission", input.data)
  return Response.json(result, { status: result.error ? 400 : 200 })
}
