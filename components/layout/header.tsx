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
    <header className="glass flex h-[3.75rem] shrink-0 items-center justify-between border-b border-white/60 px-5">

      {/* Titolo pagina */}
      <div className="min-w-0">
        <h1 className="truncate text-base font-semibold leading-none text-foreground">
          {page.title}
        </h1>
        {page.subtitle && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{page.subtitle}</p>
        )}
      </div>

      {/* Centro — barra di ricerca */}
      <div className="hidden lg:flex flex-1 max-w-xs mx-6">
        <div className="flex w-full items-center gap-2 rounded-xl border border-white/70 bg-white/60 px-3 py-1.5 transition-all focus-within:bg-white/80 focus-within:border-primary/30 focus-within:shadow-sm">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
          <input
            type="text"
            placeholder="Cerca sessioni, esami..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50 text-foreground"
          />
        </div>
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
        <button className="relative flex h-8 w-8 items-center justify-center rounded-xl border border-white/70 bg-white/60 text-muted-foreground hover:bg-white/80 hover:text-foreground transition-all">
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
