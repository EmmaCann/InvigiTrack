/**
 * DAL — Calendar Events
 * Query sulla tabella `calendar_events`.
 */

import { createClient } from "@/lib/supabase/server"
import type { CalendarEvent, CreateEventData } from "@/types/database"

// --- READ ---------------------------------------------------------------------

export async function getEventsByUser(
  userId: string,
  categoryId?: string,
): Promise<CalendarEvent[]> {
  const supabase = await createClient()
  let query = supabase
    .from("calendar_events")
    .select("*")
    .eq("user_id", userId)
  if (categoryId) query = query.eq("category_id", categoryId)
  const { data, error } = await query.order("event_date", { ascending: false })
  if (error || !data) return []
  return data as CalendarEvent[]
}

/** Solo eventi futuri non ancora convertiti — per il widget dashboard */
export async function getPendingEvents(
  userId: string,
  categoryId?: string,
): Promise<CalendarEvent[]> {
  const supabase = await createClient()
  const today = new Date().toISOString().split("T")[0]
  let query = supabase
    .from("calendar_events")
    .select("*")
    .eq("user_id", userId)
    .eq("is_converted", false)
    .lte("event_date", today)          // solo passati/oggi non ancora confermati
  if (categoryId) query = query.eq("category_id", categoryId)
  const { data, error } = await query
    .order("event_date", { ascending: false })
    .limit(5)
  if (error || !data) return []
  return data as CalendarEvent[]
}

// --- WRITE --------------------------------------------------------------------

export async function insertEvent(
  userId: string,
  data: CreateEventData,
): Promise<{ error?: string; event?: CalendarEvent }> {
  const supabase = await createClient()
  const { data: event, error } = await supabase
    .from("calendar_events")
    .insert({
      user_id:     userId,
      event_date:  data.event_date,
      title:       data.title,
      location:    data.location    ?? null,
      notes:       data.notes       ?? null,
      category_id: data.category_id ?? null,
    })
    .select()
    .single<CalendarEvent>()
  if (error) return { error: error.message }
  return { event }
}

export async function updateEvent(
  eventId: string,
  data: Partial<CreateEventData>,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("calendar_events")
    .update({
      ...(data.event_date && { event_date: data.event_date }),
      ...(data.title      && { title:      data.title      }),
      ...(data.location   !== undefined && { location: data.location ?? null }),
      ...(data.notes      !== undefined && { notes:    data.notes    ?? null }),
    })
    .eq("id", eventId)
  if (error) return { error: error.message }
  return {}
}

export async function deleteEvent(eventId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("calendar_events")
    .delete()
    .eq("id", eventId)
  if (error) return { error: error.message }
  return {}
}

/** Marca un evento come convertito e salva l'id della sessione creata */
export async function markEventConverted(
  eventId: string,
  sessionId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("calendar_events")
    .update({ is_converted: true, converted_session_id: sessionId })
    .eq("id", eventId)
  if (error) return { error: error.message }
  return {}
}

/** Il prossimo evento futuro non convertito (per il Next Shift in sidebar) */
export async function getNextEvent(
  userId: string,
  categoryId?: string,
): Promise<CalendarEvent | null> {
  const supabase = await createClient()
  const today = new Date().toISOString().split("T")[0]
  let query = supabase
    .from("calendar_events")
    .select("*")
    .eq("user_id", userId)
    .eq("is_converted", false)
    .gte("event_date", today)
  if (categoryId) query = query.eq("category_id", categoryId)
  const { data, error } = await query
    .order("event_date", { ascending: true })
    .limit(1)
    .single()
  if (error || !data) return null
  return data as CalendarEvent
}
