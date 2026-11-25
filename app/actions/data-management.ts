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

  // 1. Sessioni (query semplice, senza join — evita problemi schema cache FK)
  const { data: sessionData, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("session_date", { ascending: false })

  if (error) return { error: error.message }

  const sessions = (sessionData ?? []) as Session[]

  // 2. Nomi workspace — query separata
  const workspaceIds = Array.from(
    new Set(sessions.map((s) => s.workspace_id).filter(Boolean))
  ) as string[]
  const workspaceNames = new Map<string, string>()

  if (workspaceIds.length > 0) {
    const { data: wsData } = await supabase
      .from("user_category_access")
      .select("id, name")
      .in("id", workspaceIds)
    for (const ws of wsData ?? []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      workspaceNames.set(ws.id, (ws as any).name ?? "")
    }
  }

  const rows: AllDataCsvRow[] = sessions.map((s) => {
    const meta = s.metadata as Record<string, unknown>
    return {
      workspace:   s.workspace_id ? (workspaceNames.get(s.workspace_id) ?? "") : "",
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
