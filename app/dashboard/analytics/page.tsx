import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/data/auth"
import { getProfileById } from "@/lib/data/profiles"
import { getSessionsByUser } from "@/lib/data/sessions"
import { getYearlyArchives, getArchivableYears } from "@/lib/data/archives"
import { getActiveWorkspace } from "@/lib/workspace"
import { PageHelpButton } from "@/components/help/page-help-button"
import { AnalyticsView } from "@/components/analytics/analytics-view"
import { ArchiveSection } from "@/components/analytics/archive-section"

export default async function AnalyticsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/auth/login")

  const [profile, { category }] = await Promise.all([
    getProfileById(user.id),
    getActiveWorkspace(user.id),
  ])
  if (!profile) redirect("/auth/login")

  const workspaceId = category.workspaceId

  const [allSessions, archives, archivableYears] = await Promise.all([
    getSessionsByUser(user.id, workspaceId),
    getYearlyArchives(user.id, workspaceId),
    getArchivableYears(user.id, workspaceId),
  ])

  const currentYear = new Date().getFullYear()
  const prefs = profile.analytics_prefs ?? {}

  return (
    <div className="space-y-10">

      {/* Header */}
      <div>
        <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
          Statistiche
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Analisi dell&apos;attività per workspace: {category.label}
        </p>
      </div>

      {/* Vista principale */}
      <AnalyticsView
        sessions={allSessions}
        archives={archives}
        prefs={prefs}
        currentYear={currentYear}
      />

      {/* Archivio anni */}
      <ArchiveSection
        workspaceId={workspaceId}
        archivableYears={archivableYears}
      />

      <PageHelpButton help={{
        lines: [
          "Analizza le tue performance nel tempo.",
          "Filtra per anno e personalizza i widget dalle impostazioni.",
        ],
        tutorialId: "statistics",
      }} />

    </div>
  )
}
