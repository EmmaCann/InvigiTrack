/**
 * Workspace utility — legge il cookie `invigitrack_workspace` e restituisce
 * la categoria attiva + tutte le categorie dell'utente.
 *
 * Il cookie ora contiene il `workspaceId` (UUID di user_category_access.id)
 * invece dello slug, per supportare workspace multipli della stessa categoria.
 */

import { cookies } from "next/headers"
import { getUserCategories } from "@/lib/data/categories"
import type { UserWorkspace } from "@/types/database"

export interface ActiveWorkspace {
  category:       UserWorkspace
  userCategories: UserWorkspace[]
}

/**
 * Restituisce il workspace attivo dell'utente.
 *
 * Logica:
 * 1. Legge il cookie `invigitrack_workspace` (workspaceId UUID)
 * 2. Recupera i workspace a cui l'utente ha accesso
 * 3. Se il cookie corrisponde a un workspaceId valido, lo usa
 * 4. Altrimenti usa il primo workspace disponibile (default)
 */
export async function getActiveWorkspace(userId: string): Promise<ActiveWorkspace> {
  const cookieStore = await cookies()
  const cookieValue = cookieStore.get("invigitrack_workspace")?.value

  const userCategories = await getUserCategories(userId)

  if (userCategories.length === 0) {
    throw new Error("Nessuna categoria assegnata all'utente")
  }

  // Il cookie può contenere un workspaceId (UUID) o uno slug (legacy)
  const found = cookieValue
    ? userCategories.find((c) => c.workspaceId === cookieValue || c.slug === cookieValue)
    : undefined

  const category = found ?? userCategories[0]
  return { category, userCategories }
}
