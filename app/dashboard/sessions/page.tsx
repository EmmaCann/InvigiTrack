/**
 * PAGINA SESSIONI — Server Component.
 * Fetcha i dati e li passa ai Client Components.
 */

import { getCurrentUser } from "@/lib/data/auth"
import { getProfileById } from "@/lib/data/profiles"
import { getSessionsByUser } from "@/lib/data/sessions"
import { SessionDialog } from "@/components/sessions/session-dialog"
import { SessionList } from "@/components/sessions/session-list"

export default async function SessionsPage() {
  const user     = await getCurrentUser()
  const profile  = user ? await getProfileById(user.id) : null
  const sessions = user ? await getSessionsByUser(user.id) : []

  if (!user || !profile) return null

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
            Gestione sessioni
          </p>
          <h2 className="text-2xl font-bold text-foreground">Sessioni</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Registra e gestisci tutte le tue sessioni di lavoro
          </p>
        </div>
        <SessionDialog profile={profile} lastSession={sessions[0]} />
      </div>

      {/* ── Lista ──────────────────────────────────────────────────── */}
      <SessionList sessions={sessions} profile={profile} />

    </div>
  )
}
