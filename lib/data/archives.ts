/**
 * DAL — Yearly Archives
 * Query sulla tabella `yearly_archives` e logica di archiviazione anni.
 */

import { createClient } from "@/lib/supabase/server"
import type { Session, YearlyArchive } from "@/types/database"

// --- READ ---------------------------------------------------------------------

export async function getYearlyArchives(
  userId: string,
  workspaceId: string,
): Promise<YearlyArchive[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("yearly_archives")
    .select("*")
    .eq("user_id", userId)
    .eq("workspace_id", workspaceId)
    .order("year", { ascending: false })
  if (error || !data) return []
  return data as YearlyArchive[]
}

/**
 * Anni che hanno sessioni ma NON ancora un archivio — archiviabili.
 * Esclude l'anno corrente (non si può archiviare un anno in corso).
 */
export async function getArchivableYears(
  userId: string,
  workspaceId: string,
): Promise<number[]> {
  const supabase  = await createClient()
  const thisYear  = new Date().getFullYear()

  const [sessionsRes, archivesRes] = await Promise.all([
    supabase
      .from("sessions")
      .select("session_date")
      .is("archived_at", null)
      .eq("user_id", userId)
      .eq("workspace_id", workspaceId),
    supabase
      .from("yearly_archives")
      .select("year")
      .eq("user_id", userId)
      .eq("workspace_id", workspaceId),
  ])

  if (!sessionsRes.data) return []

  const archivedYears = new Set((archivesRes.data ?? []).map((r) => r.year as number))
  const years = new Set(
    sessionsRes.data
      .map((r) => parseInt(r.session_date.slice(0, 4), 10))
      .filter((y) => y < thisYear && !archivedYears.has(y)),
  )
  return Array.from(years).sort((a, b) => b - a)
}

// --- WRITE --------------------------------------------------------------------

/** Salva il riepilogo annuale e restituisce le righe originali per il CSV. */
export async function archiveYear(
  userId: string,
  workspaceId: string,
  year: number,
): Promise<{ sessions: Session[]; error?: string }> {
  if (!Number.isInteger(year) || year < 1 || year >= new Date().getFullYear()) {
    return { sessions: [], error: "Seleziona un anno passato." }
  }
  const supabase = await createClient()
  const { error, data } = await supabase.rpc("archive_workspace_sessions", {
    p_user: userId, p_workspace: workspaceId, p_year: year,
  })
  if (error) return { sessions: [], error: "Archiviazione non riuscita. Controlla che l’anno contenga sessioni e che il riepilogo non esista già." }
  return { sessions: (data ?? []) as Session[] }
}
