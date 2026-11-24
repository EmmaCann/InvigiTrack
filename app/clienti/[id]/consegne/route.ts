import { readSmallBody } from "@/lib/clients/request-body"
import { authorizePortal, sameOrigin } from "@/lib/clients/access"
import { handleClientUpload, uploadInput } from "@/lib/clients/files"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 })
  const { id } = await params
  const access = await authorizePortal(id)
  if (!access) return new Response(null, { status: 403 })
  const text = await readSmallBody(request, 4096)
  if (text === null) return new Response(null, { status: 413 })
  let payload: unknown
  try { payload = JSON.parse(text) } catch { return new Response(null, { status: 400 }) }
  const input = uploadInput.safeParse(payload)
  if (!input.success) return Response.json({ error: "Seleziona fino a 5 file, massimo 20 MB ciascuno." }, { status: 400 })
  const result = await handleClientUpload({ db: access.db, id, hash: access.hash }, "submission", input.data)
  return Response.json(result, { status: result.error ? 400 : 200 })
}
