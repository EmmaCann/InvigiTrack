"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { CalendarClock, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import { NAV_ITEMS, SETTINGS_ITEM, isActiveRoute } from "./nav-items"

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string
  label: string
  icon: React.ElementType
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative mx-3 my-0.5 flex items-center gap-3.5 rounded-lg border-r-[4px] px-3.5 py-3 text-[13px] font-semibold uppercase tracking-[0.07em] transition-all duration-200",
        active
          ? "border-primary bg-primary/[0.09] text-primary"
          : "border-transparent text-muted-foreground hover:bg-muted/80 hover:text-foreground"
      )}
    >
      <Icon
        className={cn(
          "h-[1.05rem] w-[1.05rem] shrink-0 transition-colors duration-200",
          active ? "text-primary" : "text-muted-foreground/60 group-hover:text-foreground"
        )}
        strokeWidth={active ? 2.35 : 1.85}
      />
      <span className="truncate">{label}</span>
    </Link>
  )
}

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="glass-strong flex h-full w-64 shrink-0 flex-col border-r border-white/55 shadow-lg shadow-primary/[0.06]">

      {/* ── Logo ─────────────────────────────────────────────────── */}
      <Link
        href="/dashboard"
        className="group flex items-center gap-3.5 border-b border-white/50 px-5 py-[1.1rem] transition-colors hover:bg-white/30"
      >
        <Image
          src="/logo.png"
          alt="InvigiTrack"
          width={64}
          height={70}
          className="shrink-0 object-contain drop-shadow-sm"
          priority
        />
        <div className="min-w-0 flex-1">
          <p className="text-[19px] font-bold tracking-tight text-primary">InvigiTrack</p>
          <div className="mt-2 h-[2px] w-10 rounded-full bg-gradient-to-r from-primary to-primary/30" />
        </div>
      </Link>

      {/* ── Nav ──────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-4">
        <p className="mb-2 px-6 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
          Menu
        </p>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={isActiveRoute(item.href, pathname)}
          />
        ))}

        <div className="mx-5 my-3 h-px bg-border/40" />

        <NavLink
          href={SETTINGS_ITEM.href}
          label={SETTINGS_ITEM.label}
          icon={SETTINGS_ITEM.icon}
          active={isActiveRoute(SETTINGS_ITEM.href, pathname)}
        />
      </nav>

      {/* ── Next Shift ───────────────────────────────────────────── */}
      <div className="px-3 pb-8">
        <div className="rounded-xl border border-border/50 bg-muted/50 px-4 py-4">
          <div className="mb-1.5 flex items-center gap-1.5">
            <CalendarClock className="h-3 w-3 text-muted-foreground" />
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Next Shift
            </p>
          </div>
          <p className="text-sm font-bold text-foreground">Tomorrow, 09:00</p>
          <div className="mt-0.5 flex items-center gap-1">
            <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Exam Hall A, Cambridge</p>
          </div>
        </div>
      </div>

    </aside>
  )
}
