import "server-only"

import { createHash, createHmac, randomUUID } from "node:crypto"
import { getCurrentUser } from "@/lib/data/auth"
import { getProfileById } from "@/lib/data/profiles"
import { createAdminClient } from "@/lib/supabase/admin"

export type LocationScope = { owner: string; workspace: string; location: string }

export async function getLocationManager() {
  const user = await getCurrentUser()
  if (!user) return null
  const profile = await getProfileById(user.id)
  return profile?.platform_role === "super_admin" ? user : null
}

export function locationSlug(location: string) {
  return location.trim().toLocaleLowerCase("it-IT")
    .normalize("NFKC").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "cliente"
}

function portalKey() {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY
  return secret ? createHmac("sha256", secret).update("invigitrack-location-portal-v1").digest() : null
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

function deriveLocationToken(scope: LocationScope, issuanceId: string | null) {
  const key = portalKey()
  if (!key) return null
  const parts = ["short-link", scope.owner, scope.workspace, scope.location]
  if (issuanceId) parts.push(issuanceId)
  return createHmac("sha256", key).update(JSON.stringify(parts)).digest().subarray(0, 16).toString("base64url")
}

function portalPath(location: string, token: string) {
  return `/clienti/${encodeURIComponent(locationSlug(location))}#${token}`
}

export function existingLocationLink(scope: LocationScope, issuanceId: string | null, tokenHash: string) {
  const token = deriveLocationToken(scope, issuanceId)
  return token && hashToken(token) === tokenHash ? portalPath(scope.location, token) : undefined
}

export async function createLocationToken(scope: LocationScope) {
  const db = createAdminClient()
  const issuanceId = randomUUID()
  const token = deriveLocationToken(scope, issuanceId)
  if (!token || !db) return { error: "Configura la chiave di servizio Supabase sul server." }

  const { error } = await db.from("location_portal_links").insert({
    token_hash: hashToken(token),
    owner_id: scope.owner,
    workspace_id: scope.workspace,
    location: scope.location,
    issuance_id: issuanceId,
  })
  if (error?.code === "PGRST205" || error?.code === "PGRST204" || error?.code === "42P01" || error?.code === "42703") {
    return { error: "Applica la migrazione per la gestione dei link cliente su Supabase." }
  }
  return error ? { error: "Impossibile generare il link. Riprova." } : { path: portalPath(scope.location, token) }
}

export async function readLocationToken(token: string | undefined, slug: string): Promise<LocationScope | null> {
  if (!token || !/^[A-Za-z0-9_-]{22}$/.test(token)) return null
  const db = createAdminClient()
  if (!db) return null

  const { data, error } = await db.from("location_portal_links")
    .select("owner_id, workspace_id, location").eq("token_hash", hashToken(token)).is("revoked_at", null).maybeSingle()
  if (error || !data || locationSlug(data.location) !== slug) return null
  const scope = { owner: data.owner_id, workspace: data.workspace_id, location: data.location }

  const { data: owner, error: ownerError } = await db.from("profiles").select("id")
    .eq("id", scope.owner).eq("platform_role", "super_admin").maybeSingle()
  return !ownerError && owner ? scope : null
}

export const locationCookie = "invigitrack_accesso_cliente"
