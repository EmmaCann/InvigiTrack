/**
 * DAL — Feedback
 * Query sulla tabella `feedback`.
 */

import { createClient } from "@/lib/supabase/server"
import type { Feedback, FeedbackType } from "@/types/database"

// --- READ ---------------------------------------------------------------------

export async function getAllFeedback(): Promise<Feedback[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false })
  if (error || !data) return []
  return data as Feedback[]
}

export async function getNewFeedbackCount(): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from("feedback")
    .select("*", { count: "exact", head: true })
    .eq("status", "new")
  if (error) return 0
  return count ?? 0
}

// --- WRITE --------------------------------------------------------------------

export interface CreateFeedbackData {
  type:    FeedbackType
  subject: string
  message: string
}

export async function insertFeedback(
  userId: string,
  userEmail: string,
  data: CreateFeedbackData,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("feedback")
    .insert({
      user_id:    userId,
      user_email: userEmail,
      type:       data.type,
      subject:    data.subject,
      message:    data.message,
      status:     "new",
    })
  if (error) return { error: error.message }
  return {}
}

export async function markFeedbackRead(feedbackId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("feedback")
    .update({ status: "read" })
    .eq("id", feedbackId)
  if (error) return { error: error.message }
  return {}
}
