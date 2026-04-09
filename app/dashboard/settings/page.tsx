import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/data/auth"
import { getProfileById } from "@/lib/data/profiles"
import { getUserCategories, getWorkspaceStats, getActiveCategories } from "@/lib/data/categories"
import { WorkspaceSettings }    from "@/components/settings/workspace-settings"
import { WorkspaceRateForm }    from "@/components/settings/workspace-rate-form"
import { ProfileForm }          from "@/components/settings/profile-form"
import { PasswordForm }         from "@/components/settings/password-form"
import { DashboardCardPicker }  from "@/components/settings/dashboard-card-picker"
import { SettingsSidebar }      from "@/components/settings/settings-sidebar"
import { PageHelpButton }       from "@/components/help/page-help-button"
import { User, KeyRound, Layers, LayoutDashboard } from "lucide-react"

export default async function SettingsPage() {
  const user    = await getCurrentUser()
  const profile = user ? await getProfileById(user.id) : null
  if (!user || !profile) redirect("/auth/login")

  const [workspaces, allCategories] = await Promise.all([
    getUserCategories(user.id),
    getActiveCategories(),
  ])
  const statsArr = await Promise.all(
    workspaces.map((ws) => getWorkspaceStats(user.id, ws.workspaceId)),
  )
  const stats = Object.fromEntries(workspaces.map((ws, i) => [ws.id, statsArr[i]]))

  return (
    <div className="mx-auto max-w-[960px] flex items-start gap-10">

      {/* Colonna sinistra: titolo + sidebar (solo desktop) */}
      <div className="hidden md:flex md:flex-col md:w-48 md:shrink-0">
        {/* Titolo */}
        <div className="mb-8">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary">
            Account
          </p>
          <h2 className="text-2xl font-bold text-foreground">Impostazioni</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Gestisci profilo, sicurezza e preferenze
          </p>
        </div>
        {/* Sidebar sotto il titolo */}
        <SettingsSidebar />
      </div>

      {/* Colonna destra: titolo mobile + tab-bar + sezioni */}
      <div className="min-w-0 flex-1">

        {/* Titolo — solo mobile */}
        <div className="mb-8 md:hidden">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary">
            Account
          </p>
          <h2 className="text-2xl font-bold text-foreground">Impostazioni</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Gestisci profilo, sicurezza e preferenze
          </p>
        </div>

        {/* Tab-bar mobile */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1 md:hidden">
          {[
            { id: "profilo",   label: "Profilo"   },
            { id: "password",  label: "Password"  },
            { id: "workspace", label: "Workspace" },
            { id: "dashboard", label: "Dashboard" },
          ].map(({ id, label }) => (
            <a
              key={id}
              href={`#${id}`}
              className="shrink-0 rounded-full border border-border/60 bg-white/70 px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              {label}
            </a>
          ))}
        </div>

        {/* Sezioni */}
        <div className="space-y-20">

          {/* ── Profilo ─────────────────────────────────────────── */}
          <section id="profilo" className="scroll-mt-6 space-y-5">
            <div className="flex items-center gap-2.5 border-b border-border/40 pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Profilo</h3>
                <p className="text-xs text-muted-foreground">Nome visualizzato nell'app</p>
              </div>
            </div>
            <div className="glass-dashboard rounded-2xl px-6 py-6">
              <ProfileForm fullName={profile.full_name} email={profile.email} />
            </div>
          </section>

          {/* ── Password ────────────────────────────────────────── */}
          <section id="password" className="scroll-mt-6 space-y-5">
            <div className="flex items-center gap-2.5 border-b border-border/40 pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <KeyRound className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Password</h3>
                <p className="text-xs text-muted-foreground">Cambia la password di accesso</p>
              </div>
            </div>
            <div className="glass-dashboard rounded-2xl px-6 py-6">
              <PasswordForm />
            </div>
          </section>

          {/* ── Workspace ───────────────────────────────────────── */}
          <section id="workspace" className="scroll-mt-6 space-y-5">
            <div className="flex items-center gap-2.5 border-b border-border/40 pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Layers className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Workspace</h3>
                <p className="text-xs text-muted-foreground">Personalizza e gestisci i tuoi workspace</p>
              </div>
            </div>

            {/* Edit / delete / add workspace */}
            <WorkspaceSettings workspaces={workspaces} stats={stats} allCategories={allCategories} />

            {/* Tariffe orarie per workspace */}
            {workspaces.length > 0 && (
              <div className="glass-dashboard rounded-2xl px-6 py-6 space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Tariffe orarie</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Sovrascrive la tariffa predefinita del profilo per ogni workspace
                  </p>
                </div>
                <WorkspaceRateForm
                  workspaces={workspaces}
                  profileRate={profile.default_hourly_rate}
                />
              </div>
            )}
          </section>

          {/* ── Dashboard ───────────────────────────────────────── */}
          <section id="dashboard" className="scroll-mt-6 space-y-5">
            <div className="flex items-center gap-2.5 border-b border-border/40 pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <LayoutDashboard className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Dashboard</h3>
                <p className="text-xs text-muted-foreground">Scegli le card da visualizzare</p>
              </div>
            </div>
            <div className="glass-dashboard rounded-2xl px-6 py-6">
              <DashboardCardPicker currentPrefs={profile.dashboard_prefs ?? {}} />
            </div>
          </section>

        </div>{/* end sezioni */}
      </div>{/* end colonna destra */}

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
