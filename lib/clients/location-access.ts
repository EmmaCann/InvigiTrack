import "server-only"

import { createDecipheriv, createHash, createHmac } from "node:crypto"
import { createAdminClient } from "@/lib/supabase/admin"
import { z } from "zod"

const scopeSchema = z.object({
  owner: z.uuid(),
  workspace: z.uuid(),
  location: z.string().min(1).max(500),
})

export type LocationScope = z.infer<typeof scopeSchema>

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

export async function createLocationToken(scope: LocationScope) {
  const key = portalKey()
  const db = createAdminClient()
  if (!key || !db) return { error: "Configura la chiave di servizio Supabase sul server." }

  const token = createHmac("sha256", key)
    .update(JSON.stringify(["short-link", scope.owner, scope.workspace, scope.location]))
    .digest().subarray(0, 16).toString("base64url")
  const { error } = await db.from("location_portal_links").upsert({
    token_hash: hashToken(token),
    owner_id: scope.owner,
    workspace_id: scope.workspace,
    location: scope.location,
  }, { onConflict: "token_hash", ignoreDuplicates: true })
  if (error?.code === "PGRST205" || error?.code === "42P01") {
    return { error: "Applica la migrazione dei link brevi al progetto Supabase dell’app." }
  }
  return error ? { error: "Impossibile generare il link. Riprova." } : { token }
}

export async function readLocationToken(token: string | undefined, slug: string): Promise<LocationScope | null> {
  if (!token) return null
  if (/^[A-Za-z0-9_-]{22}$/.test(token)) {
    const db = createAdminClient()
    if (!db) return null
    const { data, error } = await db.from("location_portal_links")
      .select("owner_id, workspace_id, location").eq("token_hash", hashToken(token)).maybeSingle()
    if (error || !data || locationSlug(data.location) !== slug) return null
    return { owner: data.owner_id, workspace: data.workspace_id, location: data.location }
  }
  return readLegacyToken(token, slug)
}

function readLegacyToken(token: string, slug: string) {
  const key = portalKey()
  if (!key || !/^[A-Za-z0-9_-]{39,4096}$/.test(token)) return null
  try {
    const payload = Buffer.from(token, "base64url")
    const decipher = createDecipheriv("aes-256-gcm", key, payload.subarray(0, 12))
    decipher.setAuthTag(payload.subarray(12, 28))
    const json = Buffer.concat([decipher.update(payload.subarray(28)), decipher.final()]).toString("utf8")
    const result = scopeSchema.safeParse(JSON.parse(json))
    return result.success && locationSlug(result.data.location) === slug ? result.data : null
  } catch {
    return null
  }
}

export const locationCookie = "invigitrack_accesso_cliente"
