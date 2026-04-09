"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/data/auth"
import { getActiveWorkspace } from "@/lib/workspace"
import {
  insertSession,
  updateSession,
  deleteSession,
  updatePaymentStatus,
} from "@/lib/data/sessions"
import type { CreateSessionData, PaymentStatus } from "@/types/database"

function revalidateSessions() {
  revalidatePath("/dashboard/sessions")
  revalidatePath("/dashboard")
}

export async function createSession(data: CreateSessionData) {
  const user = await getCurrentUser()
  if (!user) return { error: "Non autenticato" }

  const { category } = await getActiveWorkspace(user.id)

  const result = await insertSession(user.id, category.id, category.workspaceId, data)
  if (result.error) return { error: result.error }

  revalidateSessions()
  return { success: true, session: result.session }
}

export async function editSession(sessionId: string, data: CreateSessionData) {
  const user = await getCurrentUser()
  if (!user) return { error: "Non autenticato" }

  const result = await updateSession(sessionId, data)
  if (result.error) return { error: result.error }

  revalidateSessions()
  return { success: true }
}

export async function removeSession(sessionId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: "Non autenticato" }

  const result = await deleteSession(sessionId)
  if (result.error) return { error: result.error }

  revalidateSessions()
  return { success: true }
}

export async function changePaymentStatus(sessionId: string, status: PaymentStatus) {
  const user = await getCurrentUser()
  if (!user) return { error: "Non autenticato" }

  const result = await updatePaymentStatus(sessionId, status)
  if (result.error) return { error: result.error }

  revalidateSessions()
  return { success: true }
}
