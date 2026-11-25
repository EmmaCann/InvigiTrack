"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/data/auth"
import { getProfileById } from "@/lib/data/profiles"
import { grantCategoryAccess, updateWorkspaceSettings, deleteWorkspaceData, insertCategory } from "@/lib/data/categories"

/** Imposta il cookie con il workspaceId (UUID di user_category_access.id). */
async function setWorkspaceCookie(workspaceId: string) {
  const cookieStore = await cookies()
  cookieStore.set("invigitrack_workspace", workspaceId, {
    path:     "/",
    maxAge:   60 * 60 * 24 * 365,
    sameSite: "lax",
    secure:   process.env.NODE_ENV === "production",
    httpOnly: false,
  })
}

/**
 * Cambia il workspace attivo impostando il cookie con il workspaceId.
 * Invalida la cache del layout in modo che tutti i dati vengano ricaricati.
 */
export async function switchWorkspace(workspaceId: string): Promise<void> {
  await setWorkspaceCookie(workspaceId)
  revalidatePath("/dashboard", "layout")
}

/**
 * Aggiunge un nuovo workspace all'account dell'utente corrente
 * e lo imposta subito come workspace attivo.
 */
export async function addWorkspace(
  categoryId: string,
  workspaceName: string,
): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: "Non autenticato" }

  const profile = await getProfileById(user.id)
  if (!profile || profile.platform_role === "user") return { error: "Non autorizzato" }

  const result = await grantCategoryAccess(user.id, categoryId, {
    name: workspaceName.trim() || undefined,
  })
  if (result.error) return { error: result.error }

  // Imposta subito il nuovo workspace come attivo (se l'id è disponibile)
  if (result.id) {
    await setWorkspaceCookie(result.id)
  }

  revalidatePath("/dashboard", "layout")
  return {}
}

/**
 * Crea una nuova categoria personalizzata nel DB e la aggiunge come workspace
 * dell'utente corrente, impostandola subito come workspace attivo.
 *
 * ⚠️ La categoria creata sarà visibile a tutti gli utenti della piattaforma.
 * Disponibile solo per admin/super_admin.
 */
export async function createCategoryAndWorkspace(
  label:         string,
  description:   string,
  workspaceName: string,
): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: "Non autenticato" }

  const profile = await getProfileById(user.id)
  if (!profile || profile.platform_role === "user") return { error: "Non autorizzato" }

  // 1. Crea la nuova categoria
  const catResult = await insertCategory({ label, description: description || undefined })
  if (catResult.error) return { error: catResult.error }

  // 2. Concedi l'accesso all'utente corrente
  const accessResult = await grantCategoryAccess(user.id, catResult.id!, {
    name: workspaceName.trim() || undefined,
  })
  if (accessResult.error) return { error: accessResult.error }

  // 3. Imposta come workspace attivo
  if (accessResult.id) {
    await setWorkspaceCookie(accessResult.id)
  }

  revalidatePath("/dashboard", "layout")
  return {}
}

/** Aggiorna nome, emoji e colore di un workspace. */
export async function updateWorkspace(
  workspaceId: string,
  name: string,
  emoji: string | null,
  color: string | null,
): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: "Non autenticato" }
  const result = await updateWorkspaceSettings(user.id, workspaceId, { name, emoji, color })
  if (result.error) return { error: result.error }
  revalidatePath("/dashboard", "layout")
  return {}
}

/**
 * Elimina un workspace e (se è l'unico della sua categoria) tutti i dati correlati.
 * Se era il workspace attivo, resetta il cookie.
 */
export async function deleteWorkspace(
  workspaceId: string,
): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: "Non autenticato" }

  const result = await deleteWorkspaceData(user.id, workspaceId)
  if (result.error) return { error: result.error }

  // Se era il workspace attivo, resetta il cookie
  const cookieStore = await cookies()
  const current = cookieStore.get("invigitrack_workspace")?.value
  if (current === workspaceId) {
    cookieStore.delete("invigitrack_workspace")
  }

  revalidatePath("/dashboard", "layout")
  return {}
}
