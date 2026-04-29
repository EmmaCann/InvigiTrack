/**
 * DAL — Timetables
 * Query sulla tabella `timetables`.
 * Ogni timetable è un PDF per-evento (Cambridge exam document).
 */

import { createClient } from "@/lib/supabase/server"
import type { Timetable } from "@/types/database"

// --- READ ---------------------------------------------------------------------

/** Tutti i timetable dell'utente corrente (RLS garantisce che siano solo i suoi) */
export async function getTimetablesByUser(userId: string): Promise<Timetable[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("timetables")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
  if (error || !data) return []
  return data as Timetable[]
}

// --- WRITE --------------------------------------------------------------------

/** Inserisce un nuovo record timetable (il file è già stato caricato su Storage) */
export async function insertTimetable(
  userId:  string,
  data: {
    event_id:  string
    file_path: string
    file_type: "pdf" | "docx"
    file_size: number
  },
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("timetables")
    .insert({
      user_id:   userId,
      event_id:  data.event_id,
      file_path: data.file_path,
      file_type: data.file_type,
      file_size: data.file_size,
    })
  if (error) return { error: error.message }
  return {}
}

/** Elimina il record timetable dal DB */
export async function deleteTimetableRecord(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("timetables")
    .delete()
    .eq("id", id)
  if (error) return { error: error.message }
  return {}
}

/** Marca il timetable come scaduto (file già rimosso da Storage) */
export async function markTimetableExpired(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("timetables")
    .update({ is_expired: true, file_path: null })
    .eq("id", id)
  if (error) return { error: error.message }
  return {}
}
