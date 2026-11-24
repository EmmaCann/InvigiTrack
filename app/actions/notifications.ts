"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getClientWorkspace, uuidPattern } from "@/lib/clients/access"
import { switchWorkspace } from "@/app/actions/workspace"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/data/auth"
import { getProfileById } from "@/lib/data/profiles"
import {
  markAllReadForUser,
  createNotification,
  getNotificationsForUser,
  type CreateNotificationData,
} from "@/lib/data/notifications"
import { getProfileByEmail } from "@/lib/data/profiles"
import type { NotificationWithRead, PlatformRole } from "@/types/database"

/** Segna tutte le notifiche dell'utente corrente come lette */
export async function markNotificationsReadAction(): Promise<{ error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: "Non autenticato" }
  const profile = await getProfileById(user.id)
  if (!profile) return { error: "Profilo non trovato" }

  const res = await markAllReadForUser(user.id, profile.platform_role)
  revalidatePath("/dashboard", "layout")
  return res
}

/** Carica le notifiche per l'utente corrente (usato client-side on open) */
export async function getNotificationsAction(): Promise<{
  notifications?: NotificationWithRead[]
  error?: string
}> {
  const user = await getCurrentUser()
  if (!user) return { error: "Non autenticato" }
  const profile = await getProfileById(user.id)
  if (!profile) return { error: "Profilo non trovato" }

  const notifications = await getNotificationsForUser(user.id, profile.platform_role)
  return { notifications }
}

/** Crea una notifica — solo super_admin */
export async function createNotificationAction(data: {
  target_type:      "all" | "role" | "user"
  target_role?:     PlatformRole | null
  target_user_id?:  string | null
  target_email?:    string          // alternativa a target_user_id — verrà risolto in uuid
  title:            string
  message:          string
  type:             "system" | "update" | "maintenance"
}): Promise<{ error?: string; success?: true }> {
  const user = await getCurrentUser()
  if (!user) return { error: "Non autenticato" }
  const profile = await getProfileById(user.id)
  if (!profile || profile.platform_role !== "super_admin") return { error: "Non autorizzato" }

  let targetUserId: string | null = data.target_user_id ?? null

  // Se arriva un'email, la risolviamo in uuid
  if (data.target_type === "user" && data.target_email && !targetUserId) {
    const targetProfile = await getProfileByEmail(data.target_email)
    if (!targetProfile) return { error: `Nessun utente trovato con email: ${data.target_email}` }
    targetUserId = targetProfile.id
  }

  const payload: CreateNotificationData = {
    target_type:    data.target_type,
    target_role:    data.target_role ?? null,
    target_user_id: targetUserId,
    title:          data.title,
    message:        data.message,
    type:           data.type,
    created_by:     user.id,
  }

  const res = await createNotification(payload)
  if (res.error) return { error: res.error }

  revalidatePath("/dashboard/admin")
  return { success: true }
}


export async function openSubmissionNotification(submissionId: string): Promise<{ href?: string; error?: string }> {
  const user = await getCurrentUser()
  const db = createAdminClient()
  const unavailable = { error: "La consegna non è disponibile." }
  if (!user || !db || !uuidPattern.test(submissionId)) return unavailable

  const [{ data: notice }, { data: submission }] = await Promise.all([
    db.from("notifications").select("id").eq("client_submission_id", submissionId)
      .eq("target_type", "user").eq("target_user_id", user.id).maybeSingle(),
    db.from("client_uploads").select("client_id, clients!inner(workspace_id, user_id, disabled_at)")
      .eq("id", submissionId).eq("kind", "submission").not("confirmed_at", "is", null)
      .eq("clients.user_id", user.id).maybeSingle(),
  ])
  const client = submission && (Array.isArray(submission.clients) ? submission.clients[0] : submission.clients)
  if (!notice || !submission || !client || client.disabled_at) return unavailable
  if (!(await getClientWorkspace(user.id, client.workspace_id))?.clients_enabled) return unavailable
  await switchWorkspace(client.workspace_id)
  return { href: `/dashboard/clients/${submission.client_id}?consegna=${submissionId}#consegna-${submissionId}` }
}
