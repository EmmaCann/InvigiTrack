"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/data/auth"
import { getProfileById, getSuperAdminProfile } from "@/lib/data/profiles"
import { insertFeedback, markFeedbackRead, type CreateFeedbackData } from "@/lib/data/feedback"
import { createNotification } from "@/lib/data/notifications"

/** Invia un feedback — qualsiasi utente autenticato */
export async function sendFeedbackAction(
  data: CreateFeedbackData,
): Promise<{ error?: string; success?: true }> {
  const user = await getCurrentUser()
  if (!user) return { error: "Non autenticato" }
  const profile = await getProfileById(user.id)
  if (!profile) return { error: "Profilo non trovato" }

  const res = await insertFeedback(user.id, profile.email, data)
  if (res.error) return { error: res.error }

  // Notifica al super_admin
  const superAdmin = await getSuperAdminProfile()
  if (superAdmin) {
    const typeLabel: Record<string, string> = {
      feature_request: "Richiesta funzionalità",
      bug_report:      "Segnalazione problema",
      suggestion:      "Suggerimento",
    }
    await createNotification({
      target_type:    "user",
      target_user_id: superAdmin.id,
      title:          `📬 ${typeLabel[data.type] ?? "Feedback"}: ${data.subject}`,
      message:        `Da ${profile.email} — ${data.message.slice(0, 120)}${data.message.length > 120 ? "…" : ""}`,
      type:           "feedback_received",
      created_by:     user.id,
    })
    revalidatePath("/dashboard", "layout")
  }

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
