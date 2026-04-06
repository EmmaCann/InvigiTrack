"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/data/auth"
import { grantCategoryAccess, updateWorkspaceSettings, deleteWorkspaceData } from "@/lib/data/categories"

/**
 * Cambia il workspace attivo dell'utente impostando il cookie.
 * Invalida la cache del layout in modo che tutti i dati vengano ricaricati.
 */
export async function switchWorkspace(slug: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set("invigitrack_workspace", slug, {
    path:     "/",
    maxAge:   60 * 60 * 24 * 365,  // 1 anno
    sameSite: "lax",
    secure:   process.env.NODE_ENV === "production",
    httpOnly: false,
  })
  revalidatePath("/dashboard", "layout")
}

/**
 * Aggiunge un workspace (categoria) all'account dell'utente corrente
 * con un nome personalizzato, e lo imposta subito come workspace attivo.
 */
export async function addWorkspace(
  categoryId: string,
  categorySlug: string,
  workspaceName: string,
): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: "Non autenticato" }

  const result = await grantCategoryAccess(user.id, categoryId, {
    name: workspaceName.trim() || undefined,
  })
  if (result.error) return { error: result.error }

  // Imposta subito il nuovo workspace come attivo
  const cookieStore = await cookies()
  cookieStore.set("invigitrack_workspace", categorySlug, {
    path:     "/",
    maxAge:   60 * 60 * 24 * 365,
    sameSite: "lax",
    secure:   process.env.NODE_ENV === "production",
    httpOnly: false,
  })

  revalidatePath("/dashboard", "layout")
  return {}
}

/** Aggiorna nome, emoji e colore di un workspace. */
export async function updateWorkspace(
  categoryId: string,
  name: string,
  emoji: string | null,
  color: string | null,
): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: "Non autenticato" }
  const result = await updateWorkspaceSettings(user.id, categoryId, { name, emoji, color })
  if (result.error) return { error: result.error }
  revalidatePath("/dashboard", "layout")
  return {}
}

/**
 * Elimina un workspace e tutti i dati correlati (sessioni, eventi, link pagamenti).
 * Se era il workspace attivo, reimposta il cookie al primo disponibile.
 */
export async function deleteWorkspace(
  categoryId: string,
  categorySlug: string,
): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: "Non autenticato" }

  const result = await deleteWorkspaceData(user.id, categoryId)
  if (result.error) return { error: result.error }

  // Se era il workspace attivo, resetta il cookie
  const cookieStore = await cookies()
  const current = cookieStore.get("invigitrack_workspace")?.value
  if (current === categorySlug) {
    cookieStore.delete("invigitrack_workspace")
  }

  revalidatePath("/dashboard", "layout")
  return {}
}
