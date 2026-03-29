/**
 * Homepage ( / ) — redirect intelligente.
 *
 * Se sei loggato → /dashboard
 * Se non sei loggato → /auth/login
 *
 * Il middleware gestisce già questi redirect, ma questa pagina
 * serve come "punto di ingresso" esplicito.
 */

import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/data/auth"

export default async function HomePage() {
  const user = await getCurrentUser()

  if (user) {
    redirect("/dashboard")
  } else {
    redirect("/auth/login")
  }
}
