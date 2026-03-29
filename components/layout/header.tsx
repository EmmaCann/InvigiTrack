"use client"

/**
 * HEADER — Client Component.
 *
 * Mostra in alto:
 *   - Titolo della pagina corrente (ricavato dall'URL con usePathname)
 *   - Avatar utente con dropdown (logout)
 *
 * Riceve il profilo come prop dal layout (Server Component),
 * che lo fetcha una volta sola per tutta la dashboard.
 */

import { usePathname } from "next/navigation"
import { LogOut, Settings, User } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { logout } from "@/app/actions/auth"
import type { Profile } from "@/types/database"

// ─── Mappa pathname → titolo pagina ──────────────────────────────────────────

const pageTitles: Record<string, string> = {
  "/dashboard":            "Dashboard",
  "/dashboard/sessions":   "Sessions",
  "/dashboard/payments":   "Payments",
  "/dashboard/analytics":  "Analytics",
  "/dashboard/settings":   "Settings",
}

// ─── Helper: iniziali per l'avatar ───────────────────────────────────────────

function getInitials(profile: Profile): string {
  if (profile.full_name) {
    return profile.full_name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
  }
  return profile.email[0].toUpperCase()
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function Header({ profile }: { profile: Profile }) {
  const pathname = usePathname()

  // Titolo: cerca corrispondenza esatta, altrimenti titolo generico
  const title = pageTitles[pathname] ?? "InvigiTrack"

  return (
    <header className="flex h-[3.75rem] items-center justify-between border-b border-border bg-card px-6">

      {/* ── Titolo pagina ──────────────────────────────────────────────── */}
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>

      {/* ── Destra: avatar + dropdown ──────────────────────────────────── */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-2.5 px-2 hover:bg-accent"
          >
            {/* Avatar con iniziali */}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {getInitials(profile)}
            </div>
            {/* Nome (visibile solo su schermi larghi) */}
            <span className="hidden text-sm font-medium sm:block">
              {profile.full_name ?? profile.email}
            </span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-52">
          {/* Info utente */}
          <DropdownMenuLabel className="font-normal">
            <p className="text-sm font-medium">{profile.full_name ?? "Utente"}</p>
            <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <a href="/dashboard/settings" className="flex items-center gap-2 cursor-pointer">
              <Settings className="h-4 w-4" />
              Impostazioni
            </a>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Logout — chiama Server Action tramite form */}
          <DropdownMenuItem asChild>
            <form action={logout} className="w-full">
              <button
                type="submit"
                className="flex w-full items-center gap-2 text-destructive"
              >
                <LogOut className="h-4 w-4" />
                Esci
              </button>
            </form>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

    </header>
  )
}
