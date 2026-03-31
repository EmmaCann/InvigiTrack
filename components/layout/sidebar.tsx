"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { NAV_ITEMS, SETTINGS_ITEM, isActiveRoute } from "./nav-items"

function NavLink({
  href, label, icon: Icon, active,
}: {
  href: string; label: string; icon: React.ElementType; active: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        // mx-3 so the bar at -right-3 lands flush at the aside's inner right edge
        "group relative mx-3 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150",
        active
          ? "bg-primary/[0.08] text-primary font-semibold"
          : "font-medium text-muted-foreground hover:bg-black/[0.04] hover:text-foreground"
      )}
    >
      {active && (
        <span className="absolute -right-3 inset-y-1.5 w-[5px] rounded-full bg-primary shadow-sm shadow-primary/40" />
      )}
      <Icon
        className={cn(
          "h-[1.05rem] w-[1.05rem] shrink-0 transition-colors duration-150",
          active ? "text-primary" : "text-muted-foreground/60 group-hover:text-foreground"
        )}
        strokeWidth={active ? 2.3 : 1.8}
      />
      <span className="truncate">{label}</span>
    </Link>
  )
}

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="glass-strong flex h-full w-56 shrink-0 flex-col border-r border-white/50 shadow-lg shadow-black/[0.06]">

      {/* ── Logo ─────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-2.5 border-b border-white/40 px-4 py-5">
        <Image
          src="/logo.png"
          alt="InvigiTrack"
          width={40}
          height={44}
          className="shrink-0"
          priority
        />
        <p className="text-[15px] font-bold tracking-tight text-foreground">InvigiTrack</p>
      </div>

      {/* ── Nav ──────────────────────────────────────────────────── */}
      {/* No px on nav — NavLink uses mx-3 so the accent bar can bleed to sidebar edge */}
      <nav className="flex-1 overflow-y-auto py-4">
        <p className="mb-2 px-6 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
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
      </nav>

      {/* ── Impostazioni ─────────────────────────────────────────── */}
      <div className="border-t border-white/40 py-3">
        <NavLink
          href={SETTINGS_ITEM.href}
          label={SETTINGS_ITEM.label}
          icon={SETTINGS_ITEM.icon}
          active={isActiveRoute(SETTINGS_ITEM.href, pathname)}
        />
      </div>

    </aside>
  )
}
