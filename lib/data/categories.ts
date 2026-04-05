/**
 * DAL — Work Categories
 * Query sulla tabella `work_categories` e `user_category_access`.
 */

import { createClient } from "@/lib/supabase/server"
import type { WorkCategory } from "@/types/database"

// ─── READ ─────────────────────────────────────────────────────────────────────

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
 * Recupera le categorie a cui l'utente ha accesso, ordinate per data di concessione.
 * Se l'utente ha impostato un nome personalizzato per il workspace, sovrascrive `label`.
 */
export async function getUserCategories(userId: string): Promise<WorkCategory[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("user_category_access")
    .select("name, work_categories(*)")
    .eq("user_id", userId)
    .order("granted_at")
  if (error || !data) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((row) => ({
    ...row.work_categories,
    label: row.name ?? row.work_categories.label,  // nome custom se impostato
  })) as WorkCategory[]
}

// ─── WRITE ────────────────────────────────────────────────────────────────────

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
