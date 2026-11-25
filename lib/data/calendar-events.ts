/**
 * DAL — Calendar Events
 * Query sulla tabella `calendar_events`.
 */

import { createClient } from "@/lib/supabase/server"
import type { CalendarEvent, CreateEventData } from "@/types/database"

// --- READ ---------------------------------------------------------------------

export async function getEventsByUser(
  userId: string,
  workspaceId?: string,
): Promise<CalendarEvent[]> {
  const supabase = await createClient()
  let query = supabase
    .from("calendar_events")
    .select("*")
    .eq("user_id", userId)
  if (workspaceId) query = query.eq("workspace_id", workspaceId)
  const { data, error } = await query.order("event_date", { ascending: false })
  if (error || !data) return []
  return data as CalendarEvent[]
}

/** Prossimi eventi futuri non ancora convertiti — per il widget dashboard */
export async function getPendingEvents(
  userId: string,
  workspaceId?: string,
): Promise<CalendarEvent[]> {
  const supabase = await createClient()
  const today = new Date().toISOString().split("T")[0]
  let query = supabase
    .from("calendar_events")
    .select("*")
    .eq("user_id", userId)
    .eq("is_converted", false)
    .gte("event_date", today)
  if (workspaceId) query = query.eq("workspace_id", workspaceId)
  const { data, error } = await query
    .order("event_date", { ascending: true })
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
      user_id:      userId,
      event_date:   data.event_date,
      start_time:   data.start_time  ?? null,
      end_time:     data.end_time    ?? null,
      title:        data.title,
      location:     data.location    ?? null,
      notes:        data.notes       ?? null,
      category_id:  data.category_id ?? null,
      workspace_id: data.workspace_id ?? null,
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
      ...(data.event_date  && { event_date:  data.event_date  }),
      ...(data.title       && { title:       data.title       }),
      ...(data.location    !== undefined && { location:   data.location   ?? null }),
      ...(data.notes       !== undefined && { notes:      data.notes      ?? null }),
      ...(data.start_time  !== undefined && { start_time: data.start_time ?? null }),
      ...(data.end_time    !== undefined && { end_time:   data.end_time   ?? null }),
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
  workspaceId?: string,
): Promise<CalendarEvent | null> {
  const supabase = await createClient()
  const today = new Date().toISOString().split("T")[0]
  let query = supabase
    .from("calendar_events")
    .select("*")
    .eq("user_id", userId)
    .eq("is_converted", false)
    .gte("event_date", today)
  if (workspaceId) query = query.eq("workspace_id", workspaceId)
  const { data, error } = await query
    .order("event_date", { ascending: true })
    .limit(1)
    .single()
  if (error || !data) return null
  return data as CalendarEvent
}
