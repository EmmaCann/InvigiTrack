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
      <Link href="/dashboard" className="flex min-w-0 items-center gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-white to-teal-50 shadow-sm ring-1 ring-white/80">
          <Image src="/logo.png" alt="" width={24} height={26} className="size-6 object-contain" priority />
        </div>
        <div className="min-w-0 leading-tight">
          <span className="block truncate text-sm font-bold tracking-tight">InvigiTrack</span>
          <span className="block truncate text-[9px] font-semibold uppercase tracking-[0.14em] text-teal-800/50">
            Workspace
          </span>
        </div>
      </Link>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl border border-white/70 bg-white/40 text-teal-900/70 shadow-sm backdrop-blur-md"
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
          <div className="flex h-14 items-center gap-3 border-b border-border px-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-white to-teal-50 shadow-sm ring-1 ring-white/80">
              <Image src="/logo.png" alt="" width={26} height={28} className="size-6 object-contain" priority />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold leading-none">InvigiTrack</p>
              <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-teal-800/55">
                Precisione accademica
              </p>
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
                    "relative flex items-center gap-3 rounded-l-xl py-2.5 pl-3 pr-4 text-[11px] font-semibold uppercase tracking-[0.08em] transition-all",
                    active
                      ? "bg-teal-50 text-teal-900 shadow-[inset_0_0_0_1px_rgba(13,148,136,0.12)]"
                      : "text-slate-500 hover:bg-muted/80 hover:text-foreground"
                  )}
                >
                  {active && (
                    <span
                      className="absolute right-0 top-1/2 h-[60%] w-1 -translate-y-1/2 rounded-full bg-teal-600"
                      aria-hidden
                    />
                  )}
                  <item.icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      active ? "text-teal-800" : "text-slate-400"
                    )}
                    strokeWidth={active ? 2.35 : 1.85}
                  />
                  {item.label}
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
                "relative flex items-center gap-3 rounded-l-xl py-2.5 pl-3 pr-4 text-[11px] font-semibold uppercase tracking-[0.08em] transition-all",
                isActiveRoute(SETTINGS_ITEM.href, pathname)
                  ? "bg-teal-50 text-teal-900 shadow-[inset_0_0_0_1px_rgba(13,148,136,0.12)]"
                  : "text-slate-500 hover:bg-muted/80 hover:text-foreground"
              )}
            >
              {isActiveRoute(SETTINGS_ITEM.href, pathname) && (
                <span
                  className="absolute right-0 top-1/2 h-[60%] w-1 -translate-y-1/2 rounded-full bg-teal-600"
                  aria-hidden
                />
              )}
              <SETTINGS_ITEM.icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  isActiveRoute(SETTINGS_ITEM.href, pathname) ? "text-teal-800" : "text-slate-400"
                )}
                strokeWidth={isActiveRoute(SETTINGS_ITEM.href, pathname) ? 2.35 : 1.85}
              />
              {SETTINGS_ITEM.label}
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
