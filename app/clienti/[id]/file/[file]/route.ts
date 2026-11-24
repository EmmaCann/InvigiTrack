import { authorizePortal } from "@/lib/clients/access"
import { downloadClientFile } from "@/lib/clients/files"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; file: string }> }) {
  const { id, file } = await params
  const access = await authorizePortal(id)
  if (!access) return new Response(null, { status: 404 })
  return downloadClientFile({ db: access.db, id, hash: access.hash }, file)
}
