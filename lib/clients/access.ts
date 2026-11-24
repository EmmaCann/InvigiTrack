import "server-only"

import { createHash, randomBytes, timingSafeEqual } from "node:crypto"
import { cache } from "react"
import { cookies } from "next/headers"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/lib/data/auth"
import { readPages } from "./records"
import { getActiveWorkspace } from "@/lib/workspace"

export const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const tokenPattern = /^[A-Za-z0-9_-]{43}$/

export const secretHash = (secret: string) => createHash("sha256").update(secret).digest("hex")
export const newSecret = () => randomBytes(32).toString("base64url")
export const portalCookie = (id: string) => `invigitrack_cliente_${id}`

export const getClientWorkspace = cache(async (userId: string, workspaceId: string) => {
  const db = createAdminClient()
  if (!db) return null
  const { data } = await db.from("user_category_access")
    .select("clients_enabled, retain_session_history").eq("id", workspaceId).eq("user_id", userId).maybeSingle()
  return data
})

export async function getClientManager(requireEnabled = true) {
  const user = await getCurrentUser()
  if (!user) return null
  const active = await getActiveWorkspace(user.id).catch(() => null)
  if (!active) return null
  const { category } = active
  const flags = await getClientWorkspace(user.id, category.workspaceId)
  if (!flags || (requireEnabled && !flags.clients_enabled)) return null
  const db = createAdminClient()
  if (!db) return null
  return { db, userId: user.id, workspaceId: category.workspaceId, enabled: Boolean(flags.clients_enabled) }
}

export type ClientManager = NonNullable<Awaited<ReturnType<typeof getClientManager>>>

export async function managedClient(manager: ClientManager, id: string) {
  if (!uuidPattern.test(id)) return null
  const { data } = await manager.db.from("clients")
    .select("id, name, disabled_at")
    .eq("id", id).eq("user_id", manager.userId).eq("workspace_id", manager.workspaceId).maybeSingle()
  return data
}

export const getClientOptions = cache(async () => {
  const manager = await getClientManager()
  if (!manager) return null
  return readPages<{ id: string; name: string }>(
    manager.db.from("clients").select("id, name")
      .eq("user_id", manager.userId).eq("workspace_id", manager.workspaceId)
      .is("disabled_at", null).order("name").order("id"),
  )
})

export async function authorizePortal(id: string, secret?: string) {
  if (!uuidPattern.test(id)) return null
  const token = secret ?? (await cookies()).get(portalCookie(id))?.value
  if (!token || !tokenPattern.test(token)) return null
  const db = createAdminClient()
  if (!db) return null
  const { data } = await db.from("client_links")
    .select("secret_hash, clients!inner(id, name, user_id, workspace_id, disabled_at)")
    .eq("client_id", id).maybeSingle()
  if (!data || !/^[a-f0-9]{64}$/.test(data.secret_hash)) return null
  if (!timingSafeEqual(Buffer.from(data.secret_hash, "hex"), Buffer.from(secretHash(token), "hex"))) return null
  const client = Array.isArray(data.clients) ? data.clients[0] : data.clients
  if (!client || client.disabled_at) return null
  const workspace = await getClientWorkspace(client.user_id, client.workspace_id)
  if (!workspace?.clients_enabled) return null
  return { db, client, hash: data.secret_hash as string }
}

export function sameOrigin(request: Request) {
  return request.headers.get("origin") === new URL(request.url).origin
}

export async function allowClientRequest(db: ClientManager["db"], scope: string, limit: number) {
  const { data, error } = await db.rpc("client_rate_limit", { p_scope: scope, p_limit: limit })
  return !error && data === true
}
