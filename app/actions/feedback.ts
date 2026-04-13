"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/data/auth"
import { getProfileById } from "@/lib/data/profiles"
import { insertFeedback, markFeedbackRead, type CreateFeedbackData } from "@/lib/data/feedback"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Profile } from "@/types/database"

/** Invia un feedback — qualsiasi utente autenticato */
export async function sendFeedbackAction(
  data: CreateFeedbackData,
): Promise<{ error?: string; success?: true }> {
  const user = await getCurrentUser()
  if (!user) return { error: "Non autenticato" }
  const profile = await getProfileById(user.id)
  if (!profile) return { error: "Profilo non trovato" }

  const res = await insertFeedback(user.id, profile.email, data)
  if (res.error) {
    console.error("[sendFeedbackAction] insertFeedback error:", res.error)
    return { error: res.error }
  }

  // Usa il client admin (service role) per bypassare RLS —
  // necessario sia per leggere il profilo super_admin che per inserire la notifica.
  const adminSupabase = createAdminClient()
  if (!adminSupabase) {
    console.warn("[sendFeedbackAction] SUPABASE_SERVICE_ROLE_KEY mancante — notifica non inviata")
    return { success: true }
  }

  // Cerca il super_admin con il client admin (bypassa RLS su profiles)
  const { data: superAdmin } = await adminSupabase
    .from("profiles")
    .select("id")
    .eq("platform_role", "super_admin")
    .limit(1)
    .single<Pick<Profile, "id">>()

  if (!superAdmin) {
    console.warn("[sendFeedbackAction] Nessun super_admin trovato — notifica non inviata")
    return { success: true }
  }

  const typeLabel: Record<string, string> = {
    feature_request: "Richiesta funzionalità",
    bug_report:      "Segnalazione problema",
    suggestion:      "Suggerimento",
  }

  const { error: notifError } = await adminSupabase
    .from("notifications")
    .insert({
      target_type:    "user",
      target_user_id: superAdmin.id,
      title:          `📬 ${typeLabel[data.type] ?? "Feedback"}: ${data.subject}`,
      message:        `Da ${profile.email} — ${data.message.slice(0, 120)}${data.message.length > 120 ? "…" : ""}`,
      type:           "feedback_received",
      created_by:     user.id,
    })

  if (notifError) {
    console.error("[sendFeedbackAction] createNotification error:", notifError.message)
  }

  revalidatePath("/dashboard", "layout")
  return { success: true }
}

/** Segna un feedback come letto — solo super_admin */
export async function markFeedbackReadAction(
  feedbackId: string,
): Promise<{ error?: string; success?: true }> {
  const user = await getCurrentUser()
  if (!user) return { error: "Non autenticato" }
  const profile = await getProfileById(user.id)
  if (!profile || profile.platform_role !== "super_admin") return { error: "Non autorizzato" }

  const res = await markFeedbackRead(feedbackId)
  if (res.error) return { error: res.error }

  revalidatePath("/dashboard/admin")
  return { success: true }
}
