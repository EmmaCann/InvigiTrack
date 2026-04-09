import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/data/auth"
import { getProfileById } from "@/lib/data/profiles"
import { getUserCategories, getWorkspaceStats, getActiveCategories } from "@/lib/data/categories"
import { WorkspaceSettings } from "@/components/settings/workspace-settings"
import { PageHelpButton } from "@/components/help/page-help-button"
import { Layers } from "lucide-react"

export default async function SettingsPage() {
  const user    = await getCurrentUser()
  const profile = user ? await getProfileById(user.id) : null
  if (!user || !profile) redirect("/auth/login")

  const isAdmin = profile.platform_role === "admin"

  // Workspace + stats + categorie disponibili (solo admin)
  const [workspaces, allCategories] = isAdmin
    ? await Promise.all([getUserCategories(user.id), getActiveCategories()])
    : [[], []]
  const statsArr = isAdmin
    ? await Promise.all(workspaces.map((ws) => getWorkspaceStats(user.id, ws.workspaceId)))
    : []
  const stats = Object.fromEntries(workspaces.map((ws, i) => [ws.id, statsArr[i]]))

  return (
    <div className="mx-auto max-w-2xl space-y-8">

      {/* Header */}
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary">
          Account
        </p>
        <h2 className="text-2xl font-bold text-foreground">Impostazioni</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Gestisci il tuo account e i workspace
        </p>
      </div>

      {/* Profilo — placeholder */}
      <section className="glass-dashboard rounded-2xl px-6 py-5 space-y-1">
        <h3 className="text-sm font-semibold text-foreground">Profilo</h3>
        <p className="text-sm text-muted-foreground">{profile.full_name ?? "—"}</p>
        <p className="text-xs text-muted-foreground">{profile.email}</p>
      </section>

      {/* Gestione workspace — solo admin */}
      {isAdmin && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <h3 className="text-base font-semibold text-foreground">Gestione workspace</h3>
          </div>
          <p className="text-sm text-muted-foreground -mt-2">
            Personalizza nome, icona e colore dei tuoi workspace. L&apos;eliminazione rimuove tutti i dati correlati.
          </p>
          <WorkspaceSettings workspaces={workspaces} stats={stats} allCategories={allCategories} />
        </section>
      )}

      <PageHelpButton help={{
        lines: [
          "Personalizza il tuo account e i workspace.",
          "Modifica profilo, tariffa oraria e aspetto dei workspace.",
        ],
        tutorialId: "settings-profile",
      }} />

    </div>
  )
}
