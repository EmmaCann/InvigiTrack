"use server"

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
import { createAdminClient } from "@/lib/supabase/admin"
import { sendViaChannels, sendViaChannelsToMany } from "@/lib/notifications/send-via-channels"
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

  // Dispatch via canali (email/push/Telegram) agli utenti che li hanno attivi
  // Fire-and-forget — non blocca la risposta
  const admin = createAdminClient()
  if (admin) {
    void (async () => {
      let targetIds: string[] = []

      if (payload.target_type === "user" && targetUserId) {
        // Notifica a singolo utente — escludi il mittente (super_admin)
        if (targetUserId !== user.id) targetIds = [targetUserId]

      } else if (payload.target_type === "role" && payload.target_role) {
        const { data } = await admin
          .from("profiles")
          .select("id")
          .eq("platform_role", payload.target_role)
          .neq("id", user.id)
        targetIds = (data ?? []).map((p: { id: string }) => p.id)

      } else if (payload.target_type === "all") {
        const { data } = await admin
          .from("profiles")
          .select("id")
          .neq("id", user.id)  // escludi il mittente
        targetIds = (data ?? []).map((p: { id: string }) => p.id)
      }

      if (targetIds.length > 0) {
        await sendViaChannelsToMany(targetIds, data.title, data.message, "/dashboard")
      }
    })()
  }

  revalidatePath("/dashboard/admin")
  return { success: true }
}
