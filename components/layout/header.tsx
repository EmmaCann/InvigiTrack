"use client"

import { usePathname } from "next/navigation"
import { LogOut, Settings, ChevronDown } from "lucide-react"
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

// ─── Mappa pathname → titolo ─────────────────────────────────────────────────

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard":            { title: "Dashboard",  subtitle: "Overview of your invigilation activity" },
  "/dashboard/sessions":   { title: "Sessions",   subtitle: "Academic session management"            },
  "/dashboard/payments":   { title: "Payments",   subtitle: "Payment tracking and reconciliation"    },
  "/dashboard/analytics":  { title: "Analytics",  subtitle: "Insights and earnings trends"           },
  "/dashboard/settings":   { title: "Settings",   subtitle: "Account and preferences"                },
}

// ─── Iniziali avatar ─────────────────────────────────────────────────────────

function getInitials(profile: Profile): string {
  if (profile.full_name) {
    return profile.full_name
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
  }
  return profile.email[0].toUpperCase()
}

// ─── Header ──────────────────────────────────────────────────────────────────

export function Header({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const page = pageTitles[pathname] ?? { title: "InvigiTrack", subtitle: "" }

  return (
    <header className="flex h-[3.75rem] shrink-0 items-center justify-between border-b border-border bg-card px-6">

      {/* ── Titolo pagina ──────────────────────────────────────────── */}
      <div className="min-w-0">
        <h1 className="truncate text-base font-semibold leading-none text-foreground">
          {page.title}
        </h1>
        {page.subtitle && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {page.subtitle}
          </p>
        )}
      </div>

      {/* ── Destra: role badge + avatar dropdown ───────────────────── */}
      <div className="flex items-center gap-3">
        <Badge
          variant="secondary"
          className="hidden capitalize sm:inline-flex text-[11px] px-2 py-0.5"
        >
          {profile.role_type}
        </Badge>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex h-8 items-center gap-2 rounded-lg px-2 hover:bg-muted"
            >
              {/* Avatar iniziali */}
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {getInitials(profile)}
              </div>
              <span className="hidden max-w-[120px] truncate text-sm font-medium sm:block">
                {profile.full_name?.split(" ")[0] ?? profile.email}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-semibold">{profile.full_name ?? "Utente"}</p>
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                {profile.email}
              </p>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <a href="/dashboard/settings" className="flex cursor-pointer items-center gap-2">
                <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm">Settings</span>
              </a>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <form action={logout} className="w-full">
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 text-destructive"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="text-sm">Sign out</span>
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

    </header>
  )
}
