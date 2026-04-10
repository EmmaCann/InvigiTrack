"use server"

import { getCurrentUser } from "@/lib/data/auth"
import { createClient } from "@/lib/supabase/server"
import { getUserCategories } from "@/lib/data/categories"
import { archiveYear } from "@/lib/data/archives"
import type { Session } from "@/types/database"

export interface AllDataCsvRow {
  workspace:    string
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

/**
 * Esporta TUTTE le sessioni di tutti i workspace come CSV.
 */
export async function exportAllDataCsv(): Promise<{ rows?: AllDataCsvRow[]; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: "Non autenticato" }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("sessions")
    .select("*, user_category_access!workspace_id(label:name)")
    .eq("user_id", user.id)
    .order("session_date", { ascending: false })

  if (error) return { error: error.message }

  // Fallback se il join non c'è
  const sessions = (data ?? []) as (Session & { user_category_access?: { label?: string } })[]

  const rows: AllDataCsvRow[] = sessions.map((s) => {
    const meta = s.metadata as Record<string, unknown>
    return {
      workspace:   s.user_category_access?.label ?? "",
      data:        s.session_date,
      inizio:      s.start_time.slice(0, 5),
      fine:        s.end_time.slice(0, 5),
      durata_min:  s.duration_minutes,
      tariffa:     s.hourly_rate,
      guadagnato:  s.earned,
      pagamento:   s.payment_status,
      pagato_il:   s.paid_at ?? "",
      luogo:       s.location ?? "",
      note:        s.notes ?? "",
      esame:       String(meta.exam_name ?? ""),
      studente:    String(meta.student_name ?? ""),
      materia:     String(meta.subject ?? ""),
    }
  })

  return { rows }
}

/**
 * Archivia tutti gli anni passati (<= anno corrente - 1) per tutti i workspace.
 * Ritorna il numero di archivi creati.
 */
export async function archiveAllPastYears(): Promise<{ archived: number; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { archived: 0, error: "Non autenticato" }

  const workspaces = await getUserCategories(user.id)
  const thisYear   = new Date().getFullYear()
  const supabase   = await createClient()

  let archived = 0
  const errors: string[] = []

  for (const ws of workspaces) {
    // Trova anni con sessioni non ancora archiviati
    const { data: sessionYears } = await supabase
      .from("sessions")
      .select("session_date")
      .eq("user_id", user.id)
      .eq("workspace_id", ws.workspaceId)

    const { data: existingArchives } = await supabase
      .from("yearly_archives")
      .select("year")
      .eq("user_id", user.id)
      .eq("workspace_id", ws.workspaceId)

    const archivedYears = new Set((existingArchives ?? []).map((r) => r.year as number))
    const years = Array.from(
      new Set(
        (sessionYears ?? [])
          .map((r) => parseInt(r.session_date.slice(0, 4), 10))
          .filter((y) => y < thisYear && !archivedYears.has(y)),
      ),
    )

    for (const year of years) {
      const result = await archiveYear(user.id, ws.workspaceId, year)
      if (result.error) {
        errors.push(`${ws.label} ${year}: ${result.error}`)
      } else {
        archived++
      }
    }
  }

  if (errors.length > 0) {
    return { archived, error: errors.join("; ") }
  }
  return { archived }
}
