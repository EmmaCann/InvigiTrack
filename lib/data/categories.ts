/**
 * DAL — Work Categories
 * Query sulla tabella `work_categories` e `user_category_access`.
 */

import { createClient } from "@/lib/supabase/server"
import type { WorkCategory, UserWorkspace } from "@/types/database"

// --- READ ---------------------------------------------------------------------

/**
 * Recupera tutte le categorie (attive e non).
 * Usato nell'onboarding admin per mostrare tutte le opzioni.
 */
export async function getAllCategories(): Promise<WorkCategory[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("work_categories")
    .select("*")
    .order("created_at")
  if (error || !data) return []
  return data as WorkCategory[]
}

/**
 * Recupera tutte le categorie attive.
 * Usato nella UI per mostrare le opzioni disponibili.
 */
export async function getActiveCategories(): Promise<WorkCategory[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("work_categories")
    .select("*")
    .eq("is_active", true)
    .order("created_at")
  if (error || !data) return []
  return data as WorkCategory[]
}

/**
 * Recupera una categoria per slug.
 * Usato per trovare l'id di 'invigilation' durante l'onboarding.
 */
export async function getCategoryBySlug(slug: string): Promise<WorkCategory | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("work_categories")
    .select("*")
    .eq("slug", slug)
    .single<WorkCategory>()
  if (error || !data) return null
  return data
}

/**
 * Recupera le categorie attive a cui l'utente NON ha ancora accesso.
 * Usato per il "Nuovo workspace" — mostra cosa si può aggiungere.
 */
export async function getAvailableCategories(userId: string): Promise<WorkCategory[]> {
  const supabase = await createClient()
  // Prende gli id già assegnati all'utente
  const { data: access } = await supabase
    .from("user_category_access")
    .select("category_id")
    .eq("user_id", userId)
  const assignedIds = (access ?? []).map((r: { category_id: string }) => r.category_id)

  // Tutte le categorie attive non ancora assegnate
  let query = supabase.from("work_categories").select("*").eq("is_active", true)
  if (assignedIds.length > 0) {
    query = query.not("id", "in", `(${assignedIds.join(",")})`)
  }
  const { data, error } = await query.order("created_at")
  if (error || !data) return []
  return data as WorkCategory[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapWorkspaceRows(rows: any[], hasId: boolean, hasEmojiColor: boolean, hasRate = false): UserWorkspace[] {
  return rows.map((row) => ({
    ...row.work_categories,
    workspaceId:        hasId       ? (row.id    ?? row.work_categories.id) : row.work_categories.id,
    label:              row.name    ?? row.work_categories.label,
    emoji:              hasEmojiColor ? (row.emoji ?? null) : null,
    color:              hasEmojiColor ? (row.color ?? null) : null,
    default_hourly_rate: hasRate    ? (row.default_hourly_rate ?? null) : null,
  })) as UserWorkspace[]
}

/**
 * Recupera i workspace dell'utente con nome, emoji e colore personalizzati.
 * Tenta query a cascata per compatibilità con diversi stati della migrazione DB:
 *   1. id + emoji + color  (schema completo)
 *   2. id senza emoji/color (emoji/color migration non eseguita)
 *   3. senza id             (id migration non eseguita — usa category_id come workspaceId)
 */
export async function getUserCategories(userId: string): Promise<UserWorkspace[]> {
  const supabase = await createClient()

  // 1. Schema completo (con rate)
  {
    const { data, error } = await supabase
      .from("user_category_access")
      .select("id, name, emoji, color, default_hourly_rate, work_categories(*)")
      .eq("user_id", userId)
      .order("granted_at")
    if (!error && data) return mapWorkspaceRows(data, true, true, true)
  }

  // 2. Senza rate (migration rate non eseguita)
  {
    const { data, error } = await supabase
      .from("user_category_access")
      .select("id, name, emoji, color, work_categories(*)")
      .eq("user_id", userId)
      .order("granted_at")
    if (!error && data) return mapWorkspaceRows(data, true, true, false)
  }

  // 3. Senza emoji/color
  {
    const { data, error } = await supabase
      .from("user_category_access")
      .select("id, name, work_categories(*)")
      .eq("user_id", userId)
      .order("granted_at")
    if (!error && data) return mapWorkspaceRows(data, true, false, false)
  }

  // 4. Senza id (schema vecchio) — workspaceId = category_id
  {
    const { data, error } = await supabase
      .from("user_category_access")
      .select("name, work_categories(*)")
      .eq("user_id", userId)
      .order("granted_at")
    if (error || !data) return []
    return mapWorkspaceRows(data, false, false, false)
  }
}

/** Aggiorna nome, emoji e colore di un workspace (in user_category_access). */
export async function updateWorkspaceSettings(
  userId: string,
  workspaceId: string,
  settings: { name?: string; emoji?: string | null; color?: string | null },
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const patch: Record<string, string | null> = {}
  if (settings.name  !== undefined) patch.name  = settings.name  || null
  if (settings.emoji !== undefined) patch.emoji = settings.emoji
  if (settings.color !== undefined) patch.color = settings.color
  const { error } = await supabase
    .from("user_category_access")
    .update(patch)
    .eq("user_id", userId)
    .eq("id", workspaceId)
  if (error) return { error: error.message }
  return {}
}

/** Conta sessioni ed eventi del workspace — usato nel dialog di conferma eliminazione. */
export async function getWorkspaceStats(
  userId: string,
  workspaceId: string,
): Promise<{ sessions: number; events: number }> {
  const supabase = await createClient()
  const [{ count: s }, { count: e }] = await Promise.all([
    supabase.from("sessions").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("workspace_id", workspaceId),
    supabase.from("calendar_events").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("workspace_id", workspaceId),
  ])
  return { sessions: s ?? 0, events: e ?? 0 }
}

/**
 * Elimina un workspace e (se è l'unico di quella categoria) tutti i dati correlati:
 * payment_sessions → sessions → calendar_events → user_category_access.
 *
 * Se esistono altri workspace con la stessa categoria, elimina solo la riga
 * di user_category_access senza toccare sessioni ed eventi (condivisi).
 */
export async function deleteWorkspaceData(
  userId: string,
  workspaceId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()

  // 1. Session IDs di questo workspace specifico
  const { data: sessRows } = await supabase
    .from("sessions")
    .select("id")
    .eq("user_id", userId)
    .eq("workspace_id", workspaceId)
  const sessionIds = (sessRows ?? []).map((r: { id: string }) => r.id)

  // 2. Elimina i link payment_sessions
  if (sessionIds.length > 0) {
    const { error } = await supabase.from("payment_sessions").delete().in("session_id", sessionIds)
    if (error) return { error: error.message }
  }

  // 3. Elimina sessioni di questo workspace
  const { error: eS } = await supabase.from("sessions").delete().eq("user_id", userId).eq("workspace_id", workspaceId)
  if (eS) return { error: eS.message }

  // 4. Elimina eventi calendario di questo workspace
  const { error: eE } = await supabase.from("calendar_events").delete().eq("user_id", userId).eq("workspace_id", workspaceId)
  if (eE) return { error: eE.message }

  // 5. Rimuovi questa riga workspace specifica
  const { error: eA } = await supabase
    .from("user_category_access")
    .delete()
    .eq("user_id", userId)
    .eq("id", workspaceId)
  if (eA) return { error: eA.message }

  return {}
}

// --- WRITE --------------------------------------------------------------------

/**
 * Inserisce una nuova categoria nel DB (visibile a tutti gli utenti).
 * Il slug viene derivato dal label: minuscolo, spazi → `_`, caratteri speciali rimossi.
 * Usato per le categorie personalizzate create dagli admin.
 */
export async function insertCategory(data: {
  label:        string
  description?: string
}): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient()

  // Genera slug da label — es. "Life Coaching" → "life_coaching"
  const baseSlug = data.label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40)

  // Verifica unicità slug — se esiste già, aggiunge suffisso timestamp
  const { data: existing } = await supabase
    .from("work_categories")
    .select("id")
    .eq("slug", baseSlug)
    .maybeSingle()

  const slug = existing ? `${baseSlug}_${Date.now()}` : baseSlug

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: row, error } = await supabase
    .from("work_categories")
    .insert({
      slug,
      label:       data.label.trim(),
      description: data.description?.trim() || null,
      is_active:   true,
    })
    .select("id")
    .single()

  if (error) return { error: error.message }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { id: (row as any)?.id as string | undefined }
}

/**
 * Concede l'accesso a una categoria a un utente.
 * `name` è il nome personalizzato del workspace (es. "Cambridge Invigilation").
 * Se omesso, in fase di display viene usato il label della categoria.
 */
export async function grantCategoryAccess(
  userId: string,
  categoryId: string,
  options?: { name?: string; grantedBy?: string },
): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("user_category_access")
    .insert({
      user_id:     userId,
      category_id: categoryId,
      name:        options?.name      ?? null,
      granted_by:  options?.grantedBy ?? null,
    })
    .select("id")
    .single()
  if (error) return { error: error.message }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { id: (data as any)?.id as string | undefined }
}
