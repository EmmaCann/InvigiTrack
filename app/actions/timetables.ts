"use server"

import { revalidatePath }       from "next/cache"
import { getCurrentUser }        from "@/lib/data/auth"
import { createClient }          from "@/lib/supabase/server"
import {
  insertTimetable,
  deleteTimetableRecord,
  markTimetableExpired,
} from "@/lib/data/timetables"

function revalidate() {
  revalidatePath("/dashboard/calendar")
}

// --- Salva record DB dopo upload client-side -----------------------------------

export async function saveTimetable(data: {
  event_id:  string
  file_path: string
  file_type: "pdf" | "docx"
  file_size: number
}): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: "Non autenticato" }

  const result = await insertTimetable(user.id, data)
  if (result.error) return { error: result.error }

  revalidate()
  return {}
}

// --- Elimina file da Storage + record DB --------------------------------------

export async function removeTimetable(
  id:       string,
  filePath: string,
): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: "Non autenticato" }

  const supabase = await createClient()

  // Rimuovi da Storage
  const { error: storageError } = await supabase.storage
    .from("timetables")
    .remove([filePath])
  if (storageError) return { error: storageError.message }

  // Rimuovi record DB
  const result = await deleteTimetableRecord(id)
  if (result.error) return { error: result.error }

  revalidate()
  return {}
}

// --- Genera signed URL (1 ora) per iframe/download ----------------------------

export async function getTimetableSignedUrl(
  filePath: string,
): Promise<{ url?: string; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: "Non autenticato" }

  const supabase = await createClient()
  const { data, error } = await supabase.storage
    .from("timetables")
    .createSignedUrl(filePath, 3600) // 1 ora
  if (error || !data?.signedUrl) return { error: error?.message ?? "Errore generazione URL" }
  return { url: data.signedUrl }
}

// --- Lazy cleanup: marca expired + rimuove da Storage -------------------------

export async function expireOldTimetables(
  items: Array<{ id: string; filePath: string }>,
): Promise<void> {
  if (items.length === 0) return

  const user = await getCurrentUser()
  if (!user) return

  const supabase = await createClient()

  // Rimuovi tutti i file da Storage in batch
  const paths = items.map((i) => i.filePath)
  await supabase.storage.from("timetables").remove(paths)

  // Marca tutti come expired nel DB
  await Promise.all(items.map((i) => markTimetableExpired(i.id)))

  revalidate()
}
