"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
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
        "group relative mx-3 my-1 flex items-center gap-3.5 overflow-hidden rounded-xl px-3.5 py-3 text-[13px] font-semibold uppercase tracking-[0.07em] transition-all duration-200",
        active
          ? "bg-primary/[0.11] text-primary shadow-[0_1px_0_rgba(255,255,255,0.8)_inset] ring-1 ring-primary/15"
          : "text-muted-foreground hover:bg-muted/90 hover:text-foreground"
      )}
    >
      {active && (
        <span
          className="absolute right-2.5 top-1/2 z-[1] h-[62%] w-[5px] -translate-y-1/2 rounded-full bg-primary shadow-[0_0_14px] shadow-primary/35"
          aria-hidden
        />
      )}
      <Icon
        className={cn(
          "h-5 w-5 shrink-0 transition-colors duration-200",
          active ? "text-primary" : "text-muted-foreground/70 group-hover:text-foreground"
        )}
        strokeWidth={active ? 2.35 : 1.85}
      />
      <span className="truncate pr-5">{label}</span>
    </Link>
  )
}

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="glass-strong flex h-full w-64 shrink-0 flex-col border-r border-white/55 shadow-lg shadow-primary/[0.06]">

      <Link
        href="/dashboard"
        className="group flex items-center gap-4 border-b border-white/50 px-5 py-6 transition-colors hover:bg-white/40"
      >
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-white via-white to-primary/10 shadow-[0_8px_24px_rgba(0,0,0,0.06)] ring-1 ring-primary/15 ring-inset">
          <Image
            src="/logo.png"
            alt="InvigiTrack"
            width={40}
            height={44}
            className="size-10 object-contain transition-transform duration-300 group-hover:scale-[1.05]"
            priority
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold tracking-tight text-foreground">InvigiTrack</p>
          <div className="mt-2 h-0.5 w-10 rounded-full bg-gradient-to-r from-primary to-primary/40" aria-hidden />
        </div>
      </Link>

      <nav className="flex-1 overflow-y-auto py-5">
        <p className="mb-3 px-6 text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground/80">
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

      <div className="border-t border-white/50 py-4">
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
