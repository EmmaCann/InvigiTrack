import { getClientManager, managedClient } from "@/lib/clients/access"
import { downloadClientFile } from "@/lib/clients/files"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; file: string }> }) {
  const { id, file } = await params
  const manager = await getClientManager()
  if (!manager || !await managedClient(manager, id)) return new Response(null, { status: 404 })
  return downloadClientFile({ db: manager.db, id, owner: manager.userId, workspace: manager.workspaceId }, file)
}
