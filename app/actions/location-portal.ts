"use server"

import { getActiveWorkspace } from "@/lib/workspace"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createLocationToken, existingLocationLink, getLocationManager } from "@/lib/clients/location-access"

type ManagedLink = { id: string; location: string; createdAt: string | null; revokedAt: string | null; path?: string }
const unavailable = { error: "La gestione dei link è riservata ai super admin del workspace attivo." }
const migration = { error: "Applica la migrazione per la gestione dei link cliente su Supabase." }

async function managedWorkspace(workspaceId: string) {
  const user = await getLocationManager()
  if (!user) return null
  const active = await getActiveWorkspace(user.id).catch(() => null)
  return active?.category.workspaceId === workspaceId ? user.id : null
}

export async function getLocationPortalLink(workspaceId: string, location: string): Promise<{ path?: string; error?: string }> {
  const owner = await managedWorkspace(workspaceId)
  if (!owner) return unavailable
  if (typeof location !== "string" || !location.trim() || location.length > 500) {
    return { error: "Seleziona un cliente del workspace attivo." }
  }

  const db = await createClient()
  const { data, error } = await db.from("sessions").select("id")
    .eq("user_id", owner).eq("workspace_id", workspaceId).eq("location", location).limit(1)
  if (error || !data?.length) return { error: "Non risultano sessioni per questo cliente nel workspace attivo." }

  return createLocationToken({ owner, workspace: workspaceId, location })
}

export async function listLocationPortalLinks(workspaceId: string): Promise<{ links?: ManagedLink[]; error?: string }> {
  const owner = await managedWorkspace(workspaceId)
  if (!owner) return unavailable
  const db = createAdminClient()
  if (!db) return { error: "Configurazione Supabase mancante." }

  const links: ManagedLink[] = []
  const query = db.from("location_portal_links").select("token_hash, location, issuance_id, created_at, revoked_at")
    .eq("owner_id", owner).eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false, nullsFirst: false }).order("token_hash")
  const pageSize = 200
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await query.range(offset, offset + pageSize - 1)
    if (error?.code === "42703" || error?.code === "42P01" || error?.code === "PGRST205") return migration
    if (error || !data) return { error: "Impossibile caricare i link. Riprova." }

    for (const row of data) {
      links.push({
        id: row.token_hash,
        location: row.location,
        createdAt: row.created_at,
        revokedAt: row.revoked_at,
        path: row.revoked_at ? undefined : existingLocationLink(
          { owner, workspace: workspaceId, location: row.location }, row.issuance_id, row.token_hash,
        ),
      })
    }
    if (data.length < pageSize) return { links }
  }
}

export async function revokeLocationPortalLink(workspaceId: string, id: string): Promise<{ error?: string }> {
  const owner = await managedWorkspace(workspaceId)
  if (!owner || !/^[a-f0-9]{64}$/.test(id)) return unavailable
  const db = createAdminClient()
  if (!db) return { error: "Configurazione Supabase mancante." }

  const { error } = await db.from("location_portal_links").update({ revoked_at: new Date().toISOString() })
    .eq("token_hash", id).eq("owner_id", owner).eq("workspace_id", workspaceId).is("revoked_at", null)
  return error ? { error: "Impossibile revocare il link. Riprova." } : {}
}
