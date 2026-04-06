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

/**
 * Recupera i workspace dell'utente con nome, emoji e colore personalizzati.
 * Se le colonne emoji/color non esistono ancora nel DB (migrazione non eseguita),
 * esegue automaticamente un fallback alla query senza di esse.
 */
export async function getUserCategories(userId: string): Promise<UserWorkspace[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("user_category_access")
    .select("name, emoji, color, work_categories(*)")
    .eq("user_id", userId)
    .order("granted_at")

  if (error) {
    // Fallback: colonne emoji/color non ancora presenti nel DB
    const { data: fb, error: fbErr } = await supabase
      .from("user_category_access")
      .select("name, work_categories(*)")
      .eq("user_id", userId)
      .order("granted_at")
    if (fbErr || !fb) return []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (fb as any[]).map((row) => ({
      ...row.work_categories,
      label: row.name ?? row.work_categories.label,
      emoji: null,
      color: null,
    })) as UserWorkspace[]
  }

  if (!data) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((row) => ({
    ...row.work_categories,
    label: row.name  ?? row.work_categories.label,
    emoji: row.emoji ?? null,
    color: row.color ?? null,
  })) as UserWorkspace[]
}

/** Aggiorna nome, emoji e colore di un workspace (in user_category_access). */
export async function updateWorkspaceSettings(
  userId: string,
  categoryId: string,
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
    .eq("category_id", categoryId)
  if (error) return { error: error.message }
  return {}
}

/** Conta sessioni ed eventi del workspace — usato nel dialog di conferma eliminazione. */
export async function getWorkspaceStats(
  userId: string,
  categoryId: string,
): Promise<{ sessions: number; events: number }> {
  const supabase = await createClient()
  const [{ count: s }, { count: e }] = await Promise.all([
    supabase.from("sessions").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("category_id", categoryId),
    supabase.from("calendar_events").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("category_id", categoryId),
  ])
  return { sessions: s ?? 0, events: e ?? 0 }
}

/**
 * Elimina tutti i dati del workspace in cascata:
 * payment_sessions → sessions → calendar_events → user_category_access.
 */
export async function deleteWorkspaceData(
  userId: string,
  categoryId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()

  // 1. Session IDs da eliminare
  const { data: sessRows } = await supabase
    .from("sessions")
    .select("id")
    .eq("user_id", userId)
    .eq("category_id", categoryId)
  const sessionIds = (sessRows ?? []).map((r: { id: string }) => r.id)

  // 2. Elimina i link payment_sessions
  if (sessionIds.length > 0) {
    const { error } = await supabase.from("payment_sessions").delete().in("session_id", sessionIds)
    if (error) return { error: error.message }
  }

  // 3. Elimina sessioni
  const { error: eS } = await supabase.from("sessions").delete().eq("user_id", userId).eq("category_id", categoryId)
  if (eS) return { error: eS.message }

  // 4. Elimina eventi calendario
  const { error: eE } = await supabase.from("calendar_events").delete().eq("user_id", userId).eq("category_id", categoryId)
  if (eE) return { error: eE.message }

  // 5. Rimuovi accesso workspace
  const { error: eA } = await supabase.from("user_category_access").delete().eq("user_id", userId).eq("category_id", categoryId)
  if (eA) return { error: eA.message }

  return {}
}

// --- WRITE --------------------------------------------------------------------

/**
 * Concede l'accesso a una categoria a un utente.
 * `name` è il nome personalizzato del workspace (es. "Cambridge Invigilation").
 * Se omesso, in fase di display viene usato il label della categoria.
 */
export async function grantCategoryAccess(
  userId: string,
  categoryId: string,
  options?: { name?: string; grantedBy?: string },
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("user_category_access")
    .insert({
      user_id:    userId,
      category_id: categoryId,
      name:        options?.name       ?? null,
      granted_by:  options?.grantedBy  ?? null,
    })
  if (error) return { error: error.message }
  return {}
}
