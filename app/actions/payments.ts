"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/data/auth"
import { createPayment, deletePayment } from "@/lib/data/payments"
import type { PaymentMethod } from "@/types/database"

function revalidateAll() {
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/payments")
  revalidatePath("/dashboard/sessions")
}

export async function registerPayment(
  sessionIds: string[],
  data: {
    payment_date: string
    amount: number
    method: PaymentMethod
    reference?: string
    notes?: string
  },
): Promise<{ success?: true; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: "Non autenticato" }
  if (sessionIds.length === 0) return { error: "Seleziona almeno una sessione" }

  const result = await createPayment(user.id, sessionIds, data)
  if (result.error) return { error: result.error }

  revalidateAll()
  return { success: true }
}

export async function removePayment(paymentId: string): Promise<{ success?: true; error?: string }> {
  const user = await getCurrentUser()
  if (!user) return { error: "Non autenticato" }

  const result = await deletePayment(paymentId)
  if (result.error) return { error: result.error }

  revalidateAll()
  return { success: true }
}
