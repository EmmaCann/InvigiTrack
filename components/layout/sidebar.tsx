"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ClipboardList } from "lucide-react"
import { cn } from "@/lib/utils"
import { NAV_ITEMS, SETTINGS_ITEM, isActiveRoute } from "./nav-items"

// ─── Singolo link ─────────────────────────────────────────────────────────────

function NavLink({
  href, label, icon: Icon, active,
}: {
  href: string; label: string; icon: React.ElementType; active: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <span
        className={cn(
          "absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full bg-primary transition-all duration-200",
          active ? "h-5 opacity-100" : "h-0 opacity-0"
        )}
      />
      <Icon
        className={cn(
          "h-[1.05rem] w-[1.05rem] shrink-0 transition-colors duration-150",
          active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
        )}
        strokeWidth={active ? 2.2 : 1.8}
      />
      <span className="truncate">{label}</span>
    </Link>
  )
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-border bg-card">

      {/* ── Logo ──────────────────────────────────────────────────────── */}
      <div className="flex h-[3.75rem] items-center gap-3 border-b border-border px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary shadow-sm shadow-primary/30">
          <ClipboardList className="h-3.5 w-3.5 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold leading-none tracking-tight">InvigiTrack</p>
          <p className="mt-0.5 truncate text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Academic Precision
          </p>
        </div>
      </div>

      {/* ── Nav ───────────────────────────────────────────────────────── */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          Main
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

      {/* ── Settings in fondo ─────────────────────────────────────────── */}
      <div className="border-t border-border px-3 py-3">
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
