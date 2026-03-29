/**
 * DAL — Work Categories
 * Query sulla tabella `work_categories` e `user_category_access`.
 */

import { createClient } from "@/lib/supabase/server"
import type { WorkCategory } from "@/types/database"

// ─── READ ─────────────────────────────────────────────────────────────────────

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

// ─── WRITE ────────────────────────────────────────────────────────────────────

/**
 * Concede l'accesso a una categoria a un utente.
 * Chiamato automaticamente durante l'onboarding per 'invigilation'.
 * Può essere chiamato dall'admin per sbloccare categorie extra.
 */
export async function grantCategoryAccess(
  userId: string,
  categoryId: string,
  grantedBy?: string,  // undefined = assegnato automaticamente dal sistema
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("user_category_access")
    .insert({
      user_id: userId,
      category_id: categoryId,
      granted_by: grantedBy ?? null,
    })
  if (error) return { error: error.message }
  return {}
}
