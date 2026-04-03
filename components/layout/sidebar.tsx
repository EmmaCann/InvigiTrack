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
        "group relative mx-2 flex items-center gap-3 rounded-l-xl py-2.5 pl-3 pr-4 text-[11px] font-semibold uppercase tracking-[0.1em] transition-all duration-200",
        active
          ? "bg-teal-50/95 text-teal-900 shadow-[inset_0_0_0_1px_rgba(13,148,136,0.12)]"
          : "text-slate-500 hover:bg-black/[0.035] hover:text-foreground"
      )}
    >
      {active && (
        <span
          className="absolute right-0 top-1/2 h-[64%] w-1 -translate-y-1/2 rounded-full bg-teal-600 shadow-[2px_0_12px_rgba(13,148,136,0.35)]"
          aria-hidden
        />
      )}
      <Icon
        className={cn(
          "h-[1.05rem] w-[1.05rem] shrink-0 transition-colors duration-200",
          active ? "text-teal-800" : "text-slate-400 group-hover:text-foreground"
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
    <aside className="glass-strong flex h-full w-56 shrink-0 flex-col border-r border-white/55 shadow-lg shadow-teal-900/[0.04]">

      {/* Brand */}
      <Link
        href="/dashboard"
        className="group flex items-center gap-3 border-b border-white/50 px-3.5 py-4 transition-colors hover:bg-white/35"
      >
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-white via-white to-teal-50 shadow-md shadow-teal-900/8 ring-1 ring-white/90 ring-inset">
          <Image
            src="/logo.png"
            alt=""
            width={34}
            height={38}
            className="size-8 object-contain opacity-[0.92] transition-transform duration-300 group-hover:scale-[1.04]"
            priority
          />
        </div>
        <div className="min-w-0 flex-1 text-left leading-tight">
          <p className="text-[15px] font-bold tracking-tight text-foreground">InvigiTrack</p>
          <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-teal-800/55">
            Precisione accademica
          </p>
        </div>
      </Link>

      <nav className="flex-1 overflow-y-auto py-4">
        <p className="mb-2 px-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400/90">
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

      <div className="border-t border-white/50 py-3">
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
