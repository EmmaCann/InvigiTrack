/**
 * DAL — Reminder Logs
 * Anti-duplicati: garantisce che ogni reminder (utente × evento × canale × minuti)
 * venga inviato al massimo una volta.
 * Usa admin client perché il cron job bypassa RLS.
 */

import { createAdminClient } from "@/lib/supabase/admin"

/** Controlla se un reminder è già stato inviato. */
export async function hasReminderBeenSent(
  userId: string,
  eventId: string,
  channel: "email" | "push" | "telegram",
  minutesBefore: number,
): Promise<boolean> {
  const admin = createAdminClient()
  if (!admin) return true  // safe fallback: non mandare se non possiamo controllare

  const { data, error } = await admin
    .from("reminder_logs")
    .select("id")
    .eq("user_id", userId)
    .eq("event_id", eventId)
    .eq("channel", channel)
    .eq("minutes_before", minutesBefore)
    .maybeSingle()

  if (error) return true  // safe fallback
  return data !== null
}

/**
 * Logga un reminder inviato.
 * Il UNIQUE constraint (user_id, event_id, channel, minutes_before) garantisce
 * idempotenza anche in caso di cron sovrapposti.
 */
export async function logReminder(
  userId: string,
  eventId: string,
  channel: "email" | "push" | "telegram",
  minutesBefore: number,
): Promise<void> {
  const admin = createAdminClient()
  if (!admin) return

  // Ignora silenziosamente la violazione UNIQUE (già loggato → ok)
  try {
    await admin
      .from("reminder_logs")
      .insert({ user_id: userId, event_id: eventId, channel, minutes_before: minutesBefore })
  } catch {
    // UNIQUE violation → reminder già loggato → ignorabile
  }
}
