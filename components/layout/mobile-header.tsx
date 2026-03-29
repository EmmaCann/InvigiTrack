"use client"

/**
 * MOBILE HEADER — Client Component.
 *
 * Visibile solo su mobile (< md).
 * Contiene:
 *  - Logo a sinistra
 *  - Hamburger button che apre un Sheet (drawer) con la navigazione completa
 *
 * Il Sheet è il componente shadcn che fa scivolare un pannello
 * dal bordo dello schermo — perfetto per la sidebar mobile.
 */

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Menu, ClipboardList, X, LogOut } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { logout } from "@/app/actions/auth"
import { cn } from "@/lib/utils"
import type { Profile } from "@/types/database"
import { NAV_ITEMS, SETTINGS_ITEM, isActiveRoute } from "./nav-items"

// ─── Componente ───────────────────────────────────────────────────────────────

export function MobileHeader({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4">

      {/* ── Logo ──────────────────────────────────────────────────────── */}
      <Link href="/dashboard" className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary shadow-sm shadow-primary/30">
          <ClipboardList className="h-3.5 w-3.5 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <span className="text-sm font-bold tracking-tight">InvigiTrack</span>
      </Link>

      {/* ── Hamburger → Sheet ─────────────────────────────────────────── */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </Button>
        </SheetTrigger>

        {/*
          SheetContent con side="left" fa scivolare il pannello da sinistra.
          "sr-only" = screen reader only: obbligatorio per accessibilità
          ma nascosto visivamente.
        */}
        <SheetContent side="left" className="flex w-64 flex-col p-0">
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>

          {/* Header dentro il drawer */}
          <div className="flex h-14 items-center gap-3 border-b border-border px-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <ClipboardList className="h-3.5 w-3.5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-bold leading-none">InvigiTrack</p>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Academic Precision
              </p>
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Main
            </p>
            {NAV_ITEMS.map((item) => {
              const active = isActiveRoute(item.href, pathname)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)} // chiude il drawer al click
                  className={cn(
                    "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-primary" />
                  )}
                  <item.icon className="h-4 w-4 shrink-0" strokeWidth={active ? 2.2 : 1.8} />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Profilo + logout in fondo */}
          <div className="border-t border-border p-4 space-y-3">
            {/* Profilo */}
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {(profile.full_name?.[0] ?? profile.email[0]).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{profile.full_name ?? "Utente"}</p>
                <p className="truncate text-[11px] text-muted-foreground capitalize">{profile.role_type}</p>
              </div>
            </div>
            {/* Settings + logout */}
            <Link
              href={SETTINGS_ITEM.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                isActiveRoute(SETTINGS_ITEM.href, pathname)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <SETTINGS_ITEM.icon className="h-4 w-4" strokeWidth={1.8} />
              {SETTINGS_ITEM.label}
            </Link>
            <form action={logout} className="w-full">
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/5 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </form>
          </div>

        </SheetContent>
      </Sheet>
    </header>
  )
}
