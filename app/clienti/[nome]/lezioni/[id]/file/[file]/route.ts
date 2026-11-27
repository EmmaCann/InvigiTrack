import { portalSession } from "@/lib/clients/location-lessons"
import { downloadLessonFile, removeLessonFile } from "@/lib/clients/lesson-files"

export async function GET(_request: Request, { params }: { params: Promise<{ nome: string; id: string; file: string }> }) {
  const { nome, id, file } = await params
  const actor = await portalSession(nome, id)
  return actor ? downloadLessonFile(actor, id, file, true) : new Response(null, { status: 404 })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ nome: string; id: string; file: string }> }) {
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return Response.json({ error: "Richiesta non autorizzata." }, { status: 403 })
  }
  const { nome, id, file } = await params
  const actor = await portalSession(nome, id)
  if (!actor) return Response.json({ error: "Il link personale non è più valido." }, { status: 403 })
  const result = await removeLessonFile(actor, id, file, true)
  return Response.json(result, { status: result.error ? 400 : 200 })
}
