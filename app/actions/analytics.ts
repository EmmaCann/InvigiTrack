"use server"

import { getCurrentUser } from "@/lib/data/auth"
import { updateAnalyticsPrefs as dbUpdatePrefs } from "@/lib/data/profiles"
import { archiveYear as dbArchiveYear } from "@/lib/data/archives"
import type { AnalyticsPrefs } from "@/types/database"

export async function updateAnalyticsPrefs(
  prefs: AnalyticsPrefs,
): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: "Non autenticato" }
  return dbUpdatePrefs(user.id, prefs)
}

/**
 * Archivia un anno: aggrega le sessioni, salva in yearly_archives, elimina le sessioni.
 * Ritorna le sessioni raw (già eliminate dal DB) per il CSV export lato client.
 */
export async function archiveYearAction(
  workspaceId: string,
  year: number,
): Promise<{ csvRows?: ArchiveCsvRow[]; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: "Non autenticato" }

  const { sessions, error } = await dbArchiveYear(user.id, workspaceId, year)
  if (error) return { error }

  // Prepara righe CSV da restituire al client
  const csvRows: ArchiveCsvRow[] = sessions.map((s) => {
    const meta = s.metadata as Record<string, unknown>
    return {
      data:            s.session_date,
      inizio:          s.start_time.slice(0, 5),
      fine:            s.end_time.slice(0, 5),
      durata_min:      s.duration_minutes,
      tariffa:         s.hourly_rate,
      guadagnato:      s.earned,
      pagamento:       s.payment_status,
      pagato_il:       s.paid_at ?? "",
      luogo:           s.location ?? "",
      note:            s.notes ?? "",
      esame:           String(meta.exam_name ?? ""),
      studente:        String(meta.student_name ?? ""),
      materia:         String(meta.subject ?? ""),
    }
  })
  return { csvRows }
}

export interface ArchiveCsvRow {
  data:         string
  inizio:       string
  fine:         string
  durata_min:   number
  tariffa:      number
  guadagnato:   number
  pagamento:    string
  pagato_il:    string
  luogo:        string
  note:         string
  esame:        string
  studente:     string
  materia:      string
}
