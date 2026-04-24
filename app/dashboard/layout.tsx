import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/data/auth"
import { getProfileById } from "@/lib/data/profiles"
import { getNextEvent, getEventsByUser } from "@/lib/data/calendar-events"
import { getSessionsByUser } from "@/lib/data/sessions"
import { getActiveWorkspace } from "@/lib/workspace"
import { getActiveCategories } from "@/lib/data/categories"
import { getUnreadCountForUser } from "@/lib/data/notifications"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { MobileHeader } from "@/components/layout/mobile-header"
import { BottomNav } from "@/components/layout/bottom-nav"
import { DashboardSearchLayer } from "@/components/layout/dashboard-search-layer"
import { WelcomeDialog }        from "@/components/onboarding/welcome-dialog"
import { DashboardTour }        from "@/components/onboarding/dashboard-tour"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/auth/login")

  const profile = await getProfileById(user.id)

  if (!profile) {
    return (
      <div className="relative flex min-h-[100dvh] items-center justify-center p-4 overflow-hidden">
        <GradientMesh />
        {children}
      </div>
    )
  }

  const { category: activeWorkspace, userCategories } = await getActiveWorkspace(user.id)

  const [nextEvent, availableCategories, allSessions, allEvents, unreadNotifications] = await Promise.all([
    getNextEvent(user.id, activeWorkspace.workspaceId),
    getActiveCategories(),
    getSessionsByUser(user.id, activeWorkspace.workspaceId),
    getEventsByUser(user.id, activeWorkspace.workspaceId),
    getUnreadCountForUser(user.id, profile.platform_role),
  ])
  const today = new Date().toISOString().split("T")[0]

  const recentSessions = allSessions.slice(0, 6).map((s) => ({
    id:       s.id,
    exam_name: (s.metadata as { exam_name?: string }).exam_name ?? "Sessione",
    date:     new Date(s.session_date + "T00:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "short" }),
    location: s.location ?? undefined,
  }))

  const upcomingEvents = allEvents
    .filter((ev) => ev.event_date >= today && !ev.is_converted)
    .slice(0, 5)
    .map((ev) => ({
      id:       ev.id,
      title:    ev.title,
      date:     new Date(ev.event_date + "T00:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "short" }),
      location: ev.location ?? undefined,
    }))

  return (
    <div className="relative flex h-[100dvh] overflow-hidden">

      {/* -- Gradient mesh background ------------------------------- */}
      <GradientMesh />

      <DashboardSearchLayer recentSessions={recentSessions} upcomingEvents={upcomingEvents} />

      {/* -- Sidebar — solo desktop ----------------------------------- */}
      <div className="hidden md:flex">
        <Sidebar nextEvent={nextEvent} platformRole={profile.platform_role} />
      </div>

      {/* -- Colonna destra ------------------------------------------ */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        <div className="hidden md:block">
          <Header profile={profile} activeWorkspace={activeWorkspace} userCategories={userCategories} availableCategories={availableCategories} unreadNotifications={unreadNotifications} />
        </div>

        <div className="md:hidden">
          <MobileHeader
            profile={profile}
            activeWorkspace={activeWorkspace}
            userCategories={userCategories}
            availableCategories={availableCategories}
            unreadNotifications={unreadNotifications}
          />
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>

        <div className="md:hidden">
          <BottomNav />
        </div>

      </div>

      {/* Welcome popup — rendered last so it's always above everything */}
      {!profile.ui_state?.welcome_seen && <WelcomeDialog />}

      {/* Tour interattivo — auto-start dopo il welcome, sempre riattivabile */}
      <DashboardTour autoStart={!!profile.ui_state?.welcome_seen && !profile.ui_state?.tour_seen} />

    </div>
  )
}

/** Sfondo con gradient blobs — si vede attraverso i vetri glass */
function GradientMesh() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Sfondo base — quasi bianco, leggerissima tinta fredda */}
      <div className="absolute inset-0 bg-[#f3f6fc]" />
      {/* Blob top-right */}
      <div className="absolute -right-40 -top-40 h-[700px] w-[700px] rounded-full bg-blue-300/[0.16] blur-[120px]" />
      {/* Blob bottom-left */}
      <div className="absolute -bottom-40 -left-40 h-[600px] w-[600px] rounded-full bg-indigo-200/[0.14] blur-[110px]" />
    </div>
  )
}
