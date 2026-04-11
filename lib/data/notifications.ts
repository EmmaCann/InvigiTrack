/**
 * DAL — Notifications
 * Query sulla tabella `notifications` e `notification_reads`.
 */

import { createClient } from "@/lib/supabase/server"
import type { Notification, NotificationWithRead, PlatformRole } from "@/types/database"

// --- READ ---------------------------------------------------------------------

/**
 * Notifiche per un utente: broadcast + per ruolo + dirette.
 * Left join notification_reads per determinare is_read.
 */
export async function getNotificationsForUser(
  userId: string,
  userRole: PlatformRole,
): Promise<NotificationWithRead[]> {
  const supabase = await createClient()

  // Supabase non supporta OR con condizioni miste in modo semplice,
  // quindi facciamo 3 query separate e uniamo lato server.
  const [allRes, roleRes, userRes] = await Promise.all([
    supabase
      .from("notifications")
      .select("*, notification_reads!left(user_id)")
      .eq("target_type", "all"),
    supabase
      .from("notifications")
      .select("*, notification_reads!left(user_id)")
      .eq("target_type", "role")
      .eq("target_role", userRole),
    supabase
      .from("notifications")
      .select("*, notification_reads!left(user_id)")
      .eq("target_type", "user")
      .eq("target_user_id", userId),
  ])

  const rows = [
    ...(allRes.data  ?? []),
    ...(roleRes.data ?? []),
    ...(userRes.data ?? []),
  ]

  // Deduplicare per id (non dovrebbe accadere ma per sicurezza)
  const seen = new Set<string>()
  const unique = rows.filter((r) => {
    if (seen.has(r.id)) return false
    seen.add(r.id)
    return true
  })

  // Ordine: più recenti prima
  unique.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return unique.slice(0, 20).map((r) => {
    const reads: { user_id: string }[] = Array.isArray(r.notification_reads)
      ? r.notification_reads
      : r.notification_reads ? [r.notification_reads] : []
    const is_read = reads.some((x) => x.user_id === userId)
    const { notification_reads: _, ...rest } = r
    return { ...rest, is_read } as NotificationWithRead
  })
}

/**
 * Conta notifiche non lette per un utente — usata SSR nel layout per il badge.
 */
export async function getUnreadCountForUser(
  userId: string,
  userRole: PlatformRole,
): Promise<number> {
  const notifications = await getNotificationsForUser(userId, userRole)
  return notifications.filter((n) => !n.is_read).length
}

/** Tutte le notifiche create — per il pannello super_admin */
export async function getAllNotifications(): Promise<Notification[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
  if (error || !data) return []
  return data as Notification[]
}

// --- WRITE --------------------------------------------------------------------

/** Segna tutte le notifiche (per questo utente) come lette */
export async function markAllReadForUser(
  userId: string,
  userRole: PlatformRole,
): Promise<{ error?: string }> {
  const notifications = await getNotificationsForUser(userId, userRole)
  const unread = notifications.filter((n) => !n.is_read)
  if (unread.length === 0) return {}

  const supabase = await createClient()
  const rows = unread.map((n) => ({ notification_id: n.id, user_id: userId }))
  const { error } = await supabase
    .from("notification_reads")
    .upsert(rows, { onConflict: "notification_id,user_id", ignoreDuplicates: true })
  if (error) return { error: error.message }
  return {}
}

export interface CreateNotificationData {
  target_type:    "all" | "role" | "user"
  target_role?:   PlatformRole | null
  target_user_id?: string | null
  title:          string
  message:        string
  type:           "system" | "update" | "maintenance" | "feedback_received"
  created_by:     string
}

export async function createNotification(
  data: CreateNotificationData,
): Promise<{ error?: string; notification?: Notification }> {
  const supabase = await createClient()
  const { data: row, error } = await supabase
    .from("notifications")
    .insert({
      target_type:    data.target_type,
      target_role:    data.target_role    ?? null,
      target_user_id: data.target_user_id ?? null,
      title:          data.title,
      message:        data.message,
      type:           data.type,
      created_by:     data.created_by,
    })
    .select()
    .single<Notification>()
  if (error) return { error: error.message }
  return { notification: row }
}
