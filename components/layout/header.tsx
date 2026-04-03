"use client"

import { usePathname } from "next/navigation"
import { LogOut, Settings, ChevronDown, ShieldCheck, Bell, Search } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { logout } from "@/app/actions/auth"
import { openDashboardSearch } from "@/components/layout/dashboard-search-layer"
import type { Profile } from "@/types/database"

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard":            { title: "Dashboard",    subtitle: "Riepilogo della tua attività"          },
  "/dashboard/sessions":   { title: "Sessioni",     subtitle: "Gestione sessioni di lavoro"           },
  "/dashboard/payments":   { title: "Pagamenti",    subtitle: "Tracking e riconciliazione pagamenti"  },
  "/dashboard/calendar":   { title: "Calendario",   subtitle: "Visualizza le sessioni nel calendario" },
  "/dashboard/analytics":  { title: "Statistiche",  subtitle: "Analisi e andamento guadagni"          },
  "/dashboard/settings":   { title: "Impostazioni", subtitle: "Account e preferenze"                  },
}

function getInitials(profile: Profile): string {
  if (profile.full_name) {
    return profile.full_name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
  }
  return profile.email[0].toUpperCase()
}

export function Header({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const page = pageTitles[pathname] ?? { title: "InvigiTrack", subtitle: "" }

  return (
    <header className="glass flex h-[3.75rem] shrink-0 items-center justify-between border-b border-white/55 px-5">

      {/* Titolo pagina */}
      <div className="min-w-0">
        <h1 className="truncate text-base font-semibold leading-none text-foreground">
          {page.title}
        </h1>
        {page.subtitle && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{page.subtitle}</p>
        )}
      </div>

      {/* Centro — ricerca (apre Spotlight stile vetro) */}
      <div className="mx-4 hidden min-w-0 max-w-md flex-1 justify-center md:flex lg:mx-8">
        <button
          type="button"
          onClick={() => openDashboardSearch()}
          className="flex w-full max-w-md items-center gap-3 rounded-2xl border border-white/80 bg-gradient-to-r from-white/55 via-white/45 to-primary/8 px-3.5 py-2 text-left shadow-[0_8px_30px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl backdrop-saturate-150 transition-all hover:border-primary/25 hover:from-white/65 hover:shadow-[0_12px_36px_rgba(37,99,235,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <Search className="h-4 w-4 shrink-0 text-primary/55" aria-hidden />
          <span className="flex-1 truncate text-sm text-slate-500">
            Cerca sessioni, esami, pagine…
          </span>
          <kbd className="hidden shrink-0 rounded-md border border-white/70 bg-white/55 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground shadow-sm sm:inline-block">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Destra */}
      <div className="flex items-center gap-2">

        {/* Admin badge */}
        {profile.platform_role === "admin" && (
          <Badge variant="secondary" className="hidden gap-1 text-[10px] sm:inline-flex bg-primary/10 text-primary border-primary/20">
            <ShieldCheck className="h-3 w-3" />
            Admin
          </Badge>
        )}

        {/* Notifiche */}
        <button
          type="button"
          className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-white/75 bg-white/45 text-muted-foreground shadow-sm backdrop-blur-md transition-all hover:bg-white/65 hover:text-foreground"
        >
          <Bell className="h-4 w-4" />
          {/* Dot notifica — mostralo solo se ci sono notifiche */}
          {/* <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500" /> */}
        </button>

        {/* Avatar + menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="flex h-8 items-center gap-2 rounded-xl px-2 hover:bg-white/60">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-sm shadow-primary/30">
                {getInitials(profile)}
              </div>
              <span className="hidden max-w-[120px] truncate text-sm font-medium sm:block">
                {profile.full_name?.split(" ")[0] ?? profile.email}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52 border-border/60 bg-white shadow-lg shadow-black/[0.08]">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-semibold">{profile.full_name ?? "Utente"}</p>
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{profile.email}</p>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <a href="/dashboard/settings" className="flex cursor-pointer items-center gap-2">
                <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm">Impostazioni</span>
              </a>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <form action={logout} className="w-full">
                <button type="submit" className="flex w-full items-center gap-2 text-destructive">
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="text-sm">Esci</span>
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

    </header>
  )
}
