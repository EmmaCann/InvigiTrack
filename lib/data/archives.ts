/**
 * DAL — Yearly Archives
 * Query sulla tabella `yearly_archives` e logica di archiviazione anni.
 */

import { createClient } from "@/lib/supabase/server"
import type { Session, YearlyArchive, MonthlyArchiveEntry } from "@/types/database"

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

/**
 * Aggrega le sessioni di un anno, inserisce l'archivio, elimina le sessioni
 * (e i payment_sessions collegati — le sessions RLS cascade si occupano dei payments).
 *
 * Ritorna anche le sessioni raw per il CSV export prima dell'eliminazione.
 */
export async function archiveYear(
  userId: string,
  workspaceId: string,
  year: number,
): Promise<{ sessions: Session[]; error?: string }> {
  const supabase = await createClient()
  const thisYear = new Date().getFullYear()

  if (year >= thisYear) {
    return { sessions: [], error: "Non puoi archiviare l'anno corrente." }
  }

  // Fetch sessioni dell'anno
  const { data: sessions, error: fetchErr } = await supabase
    .from("sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("workspace_id", workspaceId)
    .gte("session_date", `${year}-01-01`)
    .lte("session_date", `${year}-12-31`)
  if (fetchErr || !sessions) return { sessions: [], error: fetchErr?.message ?? "Errore fetch" }
  if (sessions.length === 0) return { sessions: [], error: "Nessuna sessione da archiviare per questo anno." }

  const typed = sessions as Session[]

  // --- Aggregazione ---
  const totals = typed.reduce(
    (acc, s) => {
      acc.sessions++
      acc.hours   += s.duration_minutes / 60
      acc.earned  += s.earned
      if (s.payment_status === "paid")    acc.paid   += s.earned
      if (s.payment_status !== "paid")    acc.unpaid += s.earned
      return acc
    },
    { sessions: 0, hours: 0, earned: 0, paid: 0, unpaid: 0 },
  )

  // Monthly
  const monthMap = new Map<number, MonthlyArchiveEntry>()
  for (let m = 1; m <= 12; m++) {
    monthMap.set(m, { month: m, sessions: 0, hours: 0, earned: 0, paid: 0, unpaid: 0 })
  }
  for (const s of typed) {
    const m = parseInt(s.session_date.slice(5, 7), 10)
    const e = monthMap.get(m)!
    e.sessions++
    e.hours   += s.duration_minutes / 60
    e.earned  += s.earned
    if (s.payment_status === "paid") e.paid   += s.earned
    else                             e.unpaid += s.earned
  }
  const monthly = Array.from(monthMap.values())

  // Day of week (0=Lun)
  const dowMap = new Map<number, number>()
  for (const s of typed) {
    const d = new Date(s.session_date + "T00:00:00")
    const dow = (d.getDay() + 6) % 7  // 0=Lun
    dowMap.set(dow, (dowMap.get(dow) ?? 0) + 1)
  }
  const day_of_week = Array.from({ length: 7 }, (_, i) => ({
    day: i,
    sessions: dowMap.get(i) ?? 0,
  }))

  // Top locations
  const locMap = new Map<string, number>()
  for (const s of typed) {
    if (s.location) locMap.set(s.location, (locMap.get(s.location) ?? 0) + 1)
  }
  const top_locations = Array.from(locMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, sessions]) => ({ name, sessions }))

  // --- Inserisci archivio ---
  const { error: insertErr } = await supabase.from("yearly_archives").insert({
    user_id:        userId,
    workspace_id:   workspaceId,
    year,
    total_sessions: totals.sessions,
    total_hours:    Math.round(totals.hours  * 100) / 100,
    total_earned:   Math.round(totals.earned * 100) / 100,
    total_paid:     Math.round(totals.paid   * 100) / 100,
    total_unpaid:   Math.round(totals.unpaid * 100) / 100,
    archive_data:   { monthly, day_of_week, top_locations },
  })
  if (insertErr) return { sessions: typed, error: insertErr.message }

  // --- Elimina sessioni (payment_sessions ha ON DELETE CASCADE) ---
  const sessionIds = typed.map((s) => s.id)
  const { error: delErr } = await supabase
    .from("sessions")
    .delete()
    .in("id", sessionIds)
  if (delErr) return { sessions: typed, error: delErr.message }

  return { sessions: typed }
}
