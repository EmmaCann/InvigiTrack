"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser }     from "@/lib/data/auth"
import { getProfileById }     from "@/lib/data/profiles"
import { getActiveWorkspace } from "@/lib/workspace"
import {
  insertEvent,
  updateEvent,
  deleteEvent,
} from "@/lib/data/calendar-events"
import { createClient } from "@/lib/supabase/server"
import type { CreateEventData, InvigilationRole } from "@/types/database"

function revalidate() {
  revalidatePath("/dashboard/calendar")
  revalidatePath("/dashboard")
}

// --- Crea evento calendario ---------------------------------------------------

export async function createEvent(
  data: CreateEventData,
): Promise<{ success?: true; eventId?: string; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: "Non autenticato" }

  const { category } = await getActiveWorkspace(user.id)
  const result = await insertEvent(user.id, { ...data, category_id: category.id, workspace_id: category.workspaceId })
  if (result.error) return { error: result.error }

  revalidate()
  return { success: true, eventId: result.event?.id }
}

// --- Modifica evento ----------------------------------------------------------

export async function editEvent(
  eventId: string,
  data: Partial<CreateEventData>,
): Promise<{ success?: true; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: "Non autenticato" }

  const { category } = await getActiveWorkspace(user.id)
  const result = await updateEvent(eventId, user.id, category.workspaceId, data)
  if (result.error) return { error: result.error }

  revalidate()
  return { success: true }
}

// --- Elimina evento -----------------------------------------------------------

export async function removeEvent(
  eventId: string,
): Promise<{ success?: true; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: "Non autenticato" }

  const result = await deleteEvent(eventId)
  if (result.error) return { error: result.error }

  revalidate()
  return { success: true }
}

// --- Converti evento in sessione ----------------------------------------------
//
// Questa è l'azione "centrale": prende un evento calendario (pianificato)
// e ci crea sopra una sessione (lavorata), pre-compilando i dati comuni.
// L'utente deve solo aggiungere start_time, end_time e confermare.

export async function convertEventToSession(
  eventId: string,
  sessionData: {
    start_time:  string
    end_time:    string
    hourly_rate: number
    role_type?:  InvigilationRole  // solo per workspace invigilation
    notes?:      string
  },
): Promise<{ success?: true; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: "Non autenticato" }

  const profile = await getProfileById(user.id)
  if (!profile) return { error: "Profilo non trovato" }

  const { category } = await getActiveWorkspace(user.id)

  if (!/^\d{2}:\d{2}$/.test(sessionData.start_time) || !/^\d{2}:\d{2}$/.test(sessionData.end_time)
    || !Number.isFinite(sessionData.hourly_rate) || sessionData.hourly_rate < 0 || sessionData.hourly_rate > 999) {
    return { error: "Controlla gli orari e la tariffa." }
  }
  const db = await createClient()
  const { error } = await db.rpc("convert_calendar_event", {
    p_user: user.id, p_workspace: category.workspaceId, p_event: eventId,
    p_start: sessionData.start_time, p_end: sessionData.end_time, p_rate: sessionData.hourly_rate,
    p_notes: sessionData.notes ?? null,
    p_role: category.slug === "invigilation" ? sessionData.role_type ?? null : null,
  })
  if (error) return { error: "Conversione non riuscita. Controlla gli orari e il workspace." }

  revalidate()
  revalidatePath("/dashboard/sessions")
  return { success: true }
}
