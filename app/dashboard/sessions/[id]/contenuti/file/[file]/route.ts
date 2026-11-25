import { teacherSession } from "@/lib/clients/location-lessons"
import { downloadLessonFile } from "@/lib/clients/lesson-files"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; file: string }> }) {
  const { id, file } = await params
  const actor = await teacherSession(id)
  return actor ? downloadLessonFile(actor, id, file) : new Response(null, { status: 404 })
}
