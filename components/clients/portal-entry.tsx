"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export function PortalEntry({ id, authorized }: { id: string; authorized: boolean }) {
  const router = useRouter()
  const [error, setError] = useState(false)

  useEffect(() => {
    const secret = window.location.hash.slice(1)
    if (!secret) return
    window.history.replaceState(null, "", window.location.pathname)
    void fetch(`/clienti/${encodeURIComponent(id)}/accesso`, { method: "POST", body: secret })
      .then((response) => {
        if (response.ok) window.location.reload()
        else setError(true)
      })
      .catch(() => setError(true))
  }, [id])

  useEffect(() => {
    if (!authorized) return
    function refresh() {
      if (document.visibilityState === "visible") router.refresh()
    }
    const timer = window.setInterval(refresh, 60_000)
    window.addEventListener("focus", refresh)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener("focus", refresh)
    }
  }, [authorized, router])

  if (authorized && !error) return null
  return (
    <div className="glass-card rounded-2xl p-6" role="status">
      <h1 className="text-xl font-bold">Area cliente</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Apri il link personale che ti ha inviato il docente. Se il link non funziona, chiedine uno nuovo.
      </p>
    </div>
  )
}
