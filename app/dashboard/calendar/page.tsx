import { getCurrentUser } from "@/lib/data/auth"
import { getSessionsByUser } from "@/lib/data/sessions"
import { CalendarView } from "@/components/calendar/calendar-view"

export default async function CalendarPage() {
  const user     = await getCurrentUser()
  const sessions = user ? await getSessionsByUser(user.id) : []

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
          Vista mensile
        </p>
        <h2 className="text-2xl font-bold text-foreground">Calendario</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Visualizza le tue sessioni nel calendario
        </p>
      </div>

      {/* ── Calendario ─────────────────────────────────────────────── */}
      <CalendarView sessions={sessions} />

    </div>
  )
}
