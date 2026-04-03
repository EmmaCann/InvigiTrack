"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Menu, X, LogOut, Search } from "lucide-react"
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
import { openDashboardSearch } from "@/components/layout/dashboard-search-layer"

export function MobileHeader({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/40 glass px-4">

      {/* ── Logo ──────────────────────────────────────────────────────── */}
      <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-white via-white to-primary/10 shadow-sm ring-1 ring-primary/15">
          <Image src="/logo.png" alt="InvigiTrack" width={26} height={28} className="size-7 object-contain" priority />
        </div>
        <span className="truncate text-[15px] font-bold tracking-tight text-foreground">InvigiTrack</span>
      </Link>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl border border-white/70 bg-white/40 text-primary shadow-sm backdrop-blur-md"
          onClick={() => openDashboardSearch()}
          aria-label="Cerca"
        >
          <Search className="h-4 w-4" />
        </Button>

      {/* ── Hamburger → Sheet ─────────────────────────────────────────── */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">Apri menu</span>
          </Button>
        </SheetTrigger>

        <SheetContent side="left" className="flex w-64 flex-col p-0">
          <SheetTitle className="sr-only">Menu di navigazione</SheetTitle>

          {/* Header dentro il drawer */}
          <div className="flex h-16 items-center gap-3 border-b border-border px-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-white via-white to-primary/10 shadow-sm ring-1 ring-primary/15">
              <Image src="/logo.png" alt="InvigiTrack" width={28} height={30} className="size-7 object-contain" priority />
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold leading-tight">InvigiTrack</p>
              <div className="mt-1.5 h-0.5 w-8 rounded-full bg-primary/70" aria-hidden />
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Menu
            </p>
            {NAV_ITEMS.map((item) => {
              const active = isActiveRoute(item.href, pathname)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "relative mx-1 flex items-center gap-3 overflow-hidden rounded-xl px-3 py-3 text-[12px] font-semibold uppercase tracking-[0.07em] transition-all",
                    active
                      ? "bg-primary/[0.11] text-primary ring-1 ring-primary/15"
                      : "text-muted-foreground hover:bg-muted/90 hover:text-foreground"
                  )}
                >
                  {active && (
                    <span
                      className="absolute right-2.5 top-1/2 h-[58%] w-[5px] -translate-y-1/2 rounded-full bg-primary shadow-lg shadow-primary/25"
                      aria-hidden
                    />
                  )}
                  <item.icon
                    className={cn(
                      "h-5 w-5 shrink-0",
                      active ? "text-primary" : "text-muted-foreground/70"
                    )}
                    strokeWidth={active ? 2.35 : 1.85}
                  />
                  <span className="truncate pr-4">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Profilo + logout in fondo */}
          <div className="border-t border-border p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {(profile.full_name?.[0] ?? profile.email[0]).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{profile.full_name ?? "Utente"}</p>
                <p className="truncate text-[11px] text-muted-foreground capitalize">{profile.role_type}</p>
              </div>
            </div>
            <Link
              href={SETTINGS_ITEM.href}
              onClick={() => setOpen(false)}
              className={cn(
                "relative mx-1 flex items-center gap-3 overflow-hidden rounded-xl px-3 py-3 text-[12px] font-semibold uppercase tracking-[0.07em] transition-all",
                isActiveRoute(SETTINGS_ITEM.href, pathname)
                  ? "bg-primary/[0.11] text-primary ring-1 ring-primary/15"
                  : "text-muted-foreground hover:bg-muted/90 hover:text-foreground"
              )}
            >
              {isActiveRoute(SETTINGS_ITEM.href, pathname) && (
                <span
                  className="absolute right-2.5 top-1/2 h-[58%] w-[5px] -translate-y-1/2 rounded-full bg-primary shadow-lg shadow-primary/25"
                  aria-hidden
                />
              )}
              <SETTINGS_ITEM.icon
                className={cn(
                  "h-5 w-5 shrink-0",
                  isActiveRoute(SETTINGS_ITEM.href, pathname) ? "text-primary" : "text-muted-foreground/70"
                )}
                strokeWidth={isActiveRoute(SETTINGS_ITEM.href, pathname) ? 2.35 : 1.85}
              />
              <span className="truncate pr-4">{SETTINGS_ITEM.label}</span>
            </Link>
            <form action={logout} className="w-full">
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/5 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Esci
              </button>
            </form>
          </div>

        </SheetContent>
      </Sheet>
      </div>
    </header>
  )
}
