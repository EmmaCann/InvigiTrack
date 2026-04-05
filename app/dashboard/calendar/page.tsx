import { getCurrentUser }    from "@/lib/data/auth"
import { getProfileById }    from "@/lib/data/profiles"
import { getSessionsByUser } from "@/lib/data/sessions"
import { getEventsByUser }   from "@/lib/data/calendar-events"
import { CalendarView }      from "@/components/calendar/calendar-view"

export default async function CalendarPage() {
  const user    = await getCurrentUser()
  const profile = user ? await getProfileById(user.id) : null

  if (!user || !profile) return null

  const [sessions, events] = await Promise.all([
    getSessionsByUser(user.id),
    getEventsByUser(user.id),
  ])

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
          Vista calendario
        </p>
        <h2 className="text-2xl font-bold text-foreground">Calendario</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Visualizza e gestisci sessioni e appuntamenti nel calendario
        </p>
      </div>

      <CalendarView sessions={sessions} events={events} profile={profile} />
    </div>
  )
}
