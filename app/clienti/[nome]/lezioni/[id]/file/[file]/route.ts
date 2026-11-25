import { portalSession } from "@/lib/clients/location-lessons"
import { downloadLessonFile } from "@/lib/clients/lesson-files"

export async function GET(_request: Request, { params }: { params: Promise<{ nome: string; id: string; file: string }> }) {
  const { nome, id, file } = await params
  const actor = await portalSession(nome, id)
  return actor ? downloadLessonFile(actor, id, file, true) : new Response(null, { status: 404 })
}
