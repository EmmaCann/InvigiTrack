"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { NAV_ITEMS, isActiveRoute } from "./nav-items"

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      data-tour="bottom-nav"
      className="relative flex shrink-0 items-center border-t border-border/60 bg-white/80 backdrop-blur-xl px-1"
      style={{ paddingBottom: "env(safe-area-inset-bottom)", height: "calc(56px + env(safe-area-inset-bottom))" }}
    >
      {NAV_ITEMS.map((item) => {
        const active = isActiveRoute(item.href, pathname)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-2 transition-colors",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <item.icon
              className={cn("h-[1.15rem] w-[1.15rem] shrink-0", active && "text-primary")}
              strokeWidth={active ? 2.35 : 1.85}
            />
            <span className={cn(
              "text-[10px] font-semibold leading-none",
              active ? "text-primary" : "text-muted-foreground",
            )}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
