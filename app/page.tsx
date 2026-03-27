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
import { createClient } from "@/lib/supabase/server"

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/dashboard")
  } else {
    redirect("/auth/login")
  }
}
