import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/data/auth"
import { getProfileById } from "@/lib/data/profiles"
import { getUserCategories, getWorkspaceStats, getActiveCategories } from "@/lib/data/categories"
import { WorkspaceSettings }          from "@/components/settings/workspace-settings"
import { WorkspaceRateForm }          from "@/components/settings/workspace-rate-form"
import { ProfileForm }                from "@/components/settings/profile-form"
import { PasswordForm }               from "@/components/settings/password-form"
import { DashboardCardPicker }        from "@/components/settings/dashboard-card-picker"
import { DashboardSecondaryPicker }   from "@/components/settings/dashboard-secondary-picker"
import { AnalyticsPrefsForm }         from "@/components/settings/analytics-prefs-form"
import { SessionsPrefsForm }          from "@/components/settings/sessions-prefs-form"
import { PaymentsPrefsForm }          from "@/components/settings/payments-prefs-form"
import { DataManagementForm }         from "@/components/settings/data-management-form"
import { SettingsSidebar }            from "@/components/settings/settings-sidebar"
import { PageHelpButton }             from "@/components/help/page-help-button"
import {
  User, KeyRound, Layers, LayoutDashboard, BarChart3,
  CalendarCheck, CreditCard, HardDrive,
} from "lucide-react"

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
        <div className="mb-8">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary">Account</p>
          <h2 className="text-2xl font-bold text-foreground">Impostazioni</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Gestisci profilo, sicurezza e preferenze</p>
        </div>
        <SettingsSidebar />
      </div>

      {/* Colonna destra */}
      <div className="min-w-0 flex-1">

        {/* Titolo mobile */}
        <div className="mb-8 md:hidden">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary">Account</p>
          <h2 className="text-2xl font-bold text-foreground">Impostazioni</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Gestisci profilo, sicurezza e preferenze</p>
        </div>

        {/* Tab-bar mobile */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1 md:hidden">
          {[
            { id: "profilo",   label: "Profilo"       },
            { id: "password",  label: "Password"      },
            { id: "archivio",  label: "Archivio dati" },
            { id: "workspace", label: "Workspace"     },
            { id: "dashboard", label: "Dashboard"     },
            { id: "sessioni",  label: "Sessioni"      },
            { id: "pagamenti", label: "Pagamenti"     },
            { id: "analytics", label: "Analytics"     },
          ].map(({ id, label }) => (
            <a key={id} href={`#${id}`}
              className="shrink-0 rounded-full border border-border/60 bg-white/70 px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >{label}</a>
          ))}
        </div>

        {/* ─── Sezioni ─────────────────────────────────────────────── */}
        <div className="space-y-20">

          {/* ── Profilo ──────────────────────────────────────────── */}
          <section id="profilo" className="scroll-mt-6 space-y-5">
            <SectionHeader icon={User} title="Profilo" sub="Nome visualizzato nell'app" />
            <div className="glass-dashboard rounded-2xl px-6 py-6">
              <ProfileForm fullName={profile.full_name} email={profile.email} />
            </div>
          </section>

          {/* ── Password ─────────────────────────────────────────── */}
          <section id="password" className="scroll-mt-6 space-y-5">
            <SectionHeader icon={KeyRound} title="Password" sub="Cambia la password di accesso" />
            <div className="glass-dashboard rounded-2xl px-6 py-6">
              <PasswordForm />
            </div>
          </section>

          {/* ── Archivio dati ────────────────────────────────────── */}
          <section id="archivio" className="scroll-mt-6 space-y-5">
            <SectionHeader icon={HardDrive} title="Archivio dati" sub="Esporta e compatta i tuoi dati" />
            <DataManagementForm />
          </section>

          {/* ── Workspace ────────────────────────────────────────── */}
          <section id="workspace" className="scroll-mt-6 space-y-5">
            <SectionHeader icon={Layers} title="Workspace" sub="Personalizza e gestisci i tuoi workspace" />
            <WorkspaceSettings workspaces={workspaces} stats={stats} allCategories={allCategories} />
            {workspaces.length > 0 && (
              <div className="glass-dashboard rounded-2xl px-6 py-6 space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Tariffe orarie</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Sovrascrive la tariffa predefinita del profilo per ogni workspace
                  </p>
                </div>
                <WorkspaceRateForm workspaces={workspaces} profileRate={profile.default_hourly_rate} />
              </div>
            )}
          </section>

          {/* ── Dashboard ────────────────────────────────────────── */}
          <section id="dashboard" className="scroll-mt-6 space-y-5">
            <SectionHeader icon={LayoutDashboard} title="Dashboard" sub="Card KPI e widget colonna laterale" />
            <div className="glass-dashboard rounded-2xl px-6 py-6 space-y-8">
              <div>
                <p className="mb-4 text-sm font-semibold text-foreground">Card principali</p>
                <DashboardCardPicker currentPrefs={profile.dashboard_prefs ?? {}} />
              </div>
              <div className="border-t border-border/30 pt-6">
                <p className="mb-1 text-sm font-semibold text-foreground">Widget laterali</p>
                <DashboardSecondaryPicker currentPrefs={profile.dashboard_prefs ?? {}} />
              </div>
            </div>
          </section>

          {/* ── Sessioni ─────────────────────────────────────────── */}
          <section id="sessioni" className="scroll-mt-6 space-y-5">
            <SectionHeader icon={CalendarCheck} title="Sessioni" sub="Visualizzazione predefinita della pagina sessioni" />
            <div className="glass-dashboard rounded-2xl px-6 py-6">
              <SessionsPrefsForm currentPrefs={profile.sessions_prefs ?? {}} />
            </div>
          </section>

          {/* ── Pagamenti ────────────────────────────────────────── */}
          <section id="pagamenti" className="scroll-mt-6 space-y-5">
            <SectionHeader icon={CreditCard} title="Pagamenti" sub="Visualizzazione predefinita della pagina pagamenti" />
            <div className="glass-dashboard rounded-2xl px-6 py-6">
              <PaymentsPrefsForm currentPrefs={profile.payments_prefs ?? {}} />
            </div>
          </section>

          {/* ── Analytics ────────────────────────────────────────── */}
          <section id="analytics" className="scroll-mt-6 space-y-5">
            <SectionHeader icon={BarChart3} title="Analytics" sub="Widget, anno fiscale e obiettivi" />
            <div className="glass-dashboard rounded-2xl px-6 py-6">
              <AnalyticsPrefsForm currentPrefs={profile.analytics_prefs ?? {}} />
            </div>
          </section>

        </div>
      </div>

      <PageHelpButton help={{
        lines: [
          "Personalizza il tuo account e i workspace.",
          "Modifica profilo, tariffa oraria e preferenze pagine.",
        ],
        tutorialId: "settings-profile",
      }} />

    </div>
  )
}

// --- Helper component -------------------------------------------------------

function SectionHeader({
  icon: Icon, title, sub,
}: { icon: React.ElementType; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-2.5 border-b border-border/40 pb-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
    </div>
  )
}
