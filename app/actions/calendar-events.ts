"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser }     from "@/lib/data/auth"
import { getProfileById }     from "@/lib/data/profiles"
import { getCategoryBySlug }  from "@/lib/data/categories"
import {
  insertEvent,
  updateEvent,
  deleteEvent,
  markEventConverted,
} from "@/lib/data/calendar-events"
import { insertSession }      from "@/lib/data/sessions"
import type { CreateEventData, InvigilationRole } from "@/types/database"

function revalidate() {
  revalidatePath("/dashboard/calendar")
  revalidatePath("/dashboard")
}

// ─── Crea evento calendario ───────────────────────────────────────────────────

export async function createEvent(
  data: CreateEventData,
): Promise<{ success?: true; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: "Non autenticato" }

  const result = await insertEvent(user.id, data)
  if (result.error) return { error: result.error }

  revalidate()
  return { success: true }
}

// ─── Modifica evento ──────────────────────────────────────────────────────────

export async function editEvent(
  eventId: string,
  data: Partial<CreateEventData>,
): Promise<{ success?: true; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: "Non autenticato" }

  const result = await updateEvent(eventId, data)
  if (result.error) return { error: result.error }

  revalidate()
  return { success: true }
}

// ─── Elimina evento ───────────────────────────────────────────────────────────

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

// ─── Converti evento in sessione ──────────────────────────────────────────────
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
    role_type:   InvigilationRole
    notes?:      string
    // title, location, event_date vengono dall'evento
    title:       string
    location?:   string
    event_date:  string
  },
): Promise<{ success?: true; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: "Non autenticato" }

  const profile = await getProfileById(user.id)
  if (!profile) return { error: "Profilo non trovato" }

  const category = await getCategoryBySlug("invigilation")
  if (!category) return { error: "Categoria non trovata" }

  // Inserisci la sessione
  const sessionResult = await insertSession(user.id, category.id, {
    session_date: sessionData.event_date,
    start_time:   sessionData.start_time,
    end_time:     sessionData.end_time,
    location:     sessionData.location,
    hourly_rate:  sessionData.hourly_rate,
    notes:        sessionData.notes,
    metadata: {
      exam_name: sessionData.title,
      role_type: sessionData.role_type,
    },
  })

  if (sessionResult.error) return { error: sessionResult.error }

  // Marca l'evento come convertito
  await markEventConverted(eventId, sessionResult.session!.id)

  revalidate()
  revalidatePath("/dashboard/sessions")
  return { success: true }
}
