/**
 * Workspace utility — legge il cookie `invigitrack_workspace` e restituisce
 * la categoria attiva + tutte le categorie dell'utente.
 *
 * Usato da ogni Server Component page per filtrare i dati per workspace.
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
 * 1. Legge il cookie `invigitrack_workspace` (slug, es. "invigilation")
 * 2. Recupera le categorie a cui l'utente ha accesso
 * 3. Se il cookie corrisponde a una categoria valida, la usa
 * 4. Altrimenti usa la prima categoria disponibile (default)
 */
export async function getActiveWorkspace(userId: string): Promise<ActiveWorkspace> {
  const cookieStore = await cookies()
  const slug = cookieStore.get("invigitrack_workspace")?.value

  const userCategories = await getUserCategories(userId)

  if (userCategories.length === 0) {
    // Fallback di sicurezza — non dovrebbe mai succedere dopo l'onboarding
    throw new Error("Nessuna categoria assegnata all'utente")
  }

  const found = slug ? userCategories.find((c) => c.slug === slug) : undefined
  const category = found ?? userCategories[0]
  return { category, userCategories }
}
