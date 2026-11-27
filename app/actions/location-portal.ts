"use server"

import { getActiveWorkspace } from "@/lib/workspace"
import { createClient } from "@/lib/supabase/server"
import { createLocationToken, getLocationManager, locationSlug } from "@/lib/clients/location-access"

export async function getLocationPortalLink(workspaceId: string, location: string): Promise<{ path?: string; error?: string }> {
  const user = await getLocationManager()
  if (!user) return { error: "Solo i super admin possono generare link cliente." }
  const active = await getActiveWorkspace(user.id).catch(() => null)
  if (!active || active.category.workspaceId !== workspaceId || typeof location !== "string" || !location.trim() || location.length > 500) {
    return { error: "Seleziona un cliente del workspace attivo." }
  }

  const db = await createClient()
  const { data, error } = await db.from("sessions").select("id")
    .eq("user_id", user.id).eq("workspace_id", workspaceId).eq("location", location).limit(1)
  if (error || !data?.length) return { error: "Non risultano sessioni per questo cliente nel workspace attivo." }

  const { token, error: linkError } = await createLocationToken({ owner: user.id, workspace: workspaceId, location })
  if (!token) return { error: linkError }
  return { path: `/clienti/${encodeURIComponent(locationSlug(location))}#${token}` }
}
