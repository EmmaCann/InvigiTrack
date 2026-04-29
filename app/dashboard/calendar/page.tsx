import { getCurrentUser }       from "@/lib/data/auth"
import { getProfileById }       from "@/lib/data/profiles"
import { getSessionsByUser }    from "@/lib/data/sessions"
import { getEventsByUser }      from "@/lib/data/calendar-events"
import { getTimetablesByUser }  from "@/lib/data/timetables"
import { getActiveWorkspace }   from "@/lib/workspace"
import { expireOldTimetables }  from "@/app/actions/timetables"
import { CalendarView }         from "@/components/calendar/calendar-view"
import { PageHelpButton }       from "@/components/help/page-help-button"

export default async function CalendarPage() {
  const user    = await getCurrentUser()
  const profile = user ? await getProfileById(user.id) : null

  if (!user || !profile) return null

  const { category } = await getActiveWorkspace(user.id)

  const [sessions, events, allTimetables] = await Promise.all([
    getSessionsByUser(user.id, category.workspaceId),
    getEventsByUser(user.id, category.workspaceId),
    getTimetablesByUser(user.id),
  ])

  // Lazy expiry: elimina da Storage i timetable i cui eventi sono passati da > 7 giorni
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 7)
  const cutoffStr = cutoff.toISOString().split("T")[0]

  const toExpire = allTimetables.filter(
    (t) =>
      !t.is_expired &&
      t.file_path &&
      events.find((e) => e.id === t.event_id && e.event_date < cutoffStr),
  )
  if (toExpire.length > 0) {
    await expireOldTimetables(
      toExpire.map((t) => ({ id: t.id, filePath: t.file_path! })),
    )
    // Aggiorna i record locali per il render corrente
    for (const t of toExpire) {
      t.is_expired = true
      t.file_path  = null
    }
  }

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

      <CalendarView
        sessions={sessions}
        events={events}
        profile={profile}
        categorySlug={category.slug}
        timetables={allTimetables}
      />

      <PageHelpButton help={{
        lines: [
          "Pianifica i tuoi turni futuri come eventi.",
          "Convertili in sessione con un click quando li hai completati.",
        ],
        tutorialId: "calendar",
      }} />
    </div>
  )
}
