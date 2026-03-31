"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Menu, X, LogOut } from "lucide-react"
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

export function MobileHeader({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/40 glass px-4">

      {/* ── Logo ──────────────────────────────────────────────────────── */}
      <Link href="/dashboard" className="flex items-center gap-2.5">
        <Image src="/logo.png" alt="InvigiTrack" width={28} height={31} priority />
        <span className="text-sm font-bold tracking-tight">InvigiTrack</span>
      </Link>

      {/* ── Hamburger → Sheet ─────────────────────────────────────────── */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">Apri menu</span>
          </Button>
        </SheetTrigger>

        <SheetContent side="left" className="flex w-64 flex-col p-0">
          <SheetTitle className="sr-only">Menu di navigazione</SheetTitle>

          {/* Header dentro il drawer */}
          <div className="flex h-14 items-center gap-3 border-b border-border px-4">
            <Image src="/logo.png" alt="InvigiTrack" width={28} height={31} priority />
            <div>
              <p className="text-sm font-bold leading-none">InvigiTrack</p>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Precisione Accademica
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
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" strokeWidth={active ? 2.3 : 1.8} />
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
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all",
                isActiveRoute(SETTINGS_ITEM.href, pathname)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <SETTINGS_ITEM.icon className="h-4 w-4" strokeWidth={1.8} />
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
    </header>
  )
}
