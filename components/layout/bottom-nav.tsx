"use client"

/**
 * BOTTOM NAV — Client Component.
 * Visibile solo su mobile (< md).
 *
 * Struttura: 5 tab in fondo allo schermo.
 * Il tab centrale "+" è il CTA primario (New Session).
 *
 * Tecnica CSS: position fixed (o flex nativo nel layout)
 * con safe-area-inset-bottom per rispettare la "home bar"
 * dei telefoni iPhone con notch.
 */

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { NAV_ITEMS, isActiveRoute } from "./nav-items"

// Prendiamo solo i primi 2 e gli ultimi 2 per fare posto al "+" centrale
// Dashboard, Sessions | [+] | Payments, Analytics
const leftItems  = NAV_ITEMS.slice(0, 2)   // Dashboard, Sessions
const rightItems = NAV_ITEMS.slice(2, 4)   // Payments, Analytics

export function BottomNav() {
  const pathname = usePathname()

  return (
    /*
     * Il paddingBottom usa env(safe-area-inset-bottom):
     * su iPhone con home bar, aggiunge lo spazio corretto
     * perché i tap non finiscano sotto la gesture bar.
     */
    <nav
      className="relative flex h-16 shrink-0 items-center border-t border-border bg-card px-2"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >

      {/* -- Items sinistri ---------------------------------------------- */}
      {leftItems.map((item) => (
        <NavTab
          key={item.href}
          href={item.href}
          label={item.label}
          icon={item.icon}
          active={isActiveRoute(item.href, pathname)}
        />
      ))}

      {/* -- Bottone "+" centrale ---------------------------------------- */}
      <div className="flex flex-1 items-center justify-center">
        <Link
          href="/dashboard/sessions"
          className="flex h-11 w-11 -translate-y-3 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/35 transition-transform active:scale-95"
          aria-label="New session"
        >
          <Plus className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
        </Link>
      </div>

      {/* -- Items destri ------------------------------------------------ */}
      {rightItems.map((item) => (
        <NavTab
          key={item.href}
          href={item.href}
          label={item.label}
          icon={item.icon}
          active={isActiveRoute(item.href, pathname)}
        />
      ))}

    </nav>
  )
}

// --- Singolo tab -------------------------------------------------------------

function NavTab({
  href, label, icon: Icon, active,
}: {
  href: string; label: string; icon: React.ElementType; active: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1.5 transition-colors",
        active ? "text-primary" : "text-muted-foreground"
      )}
    >
      <Icon
        className={cn(
          "h-[1.15rem] w-[1.15rem] shrink-0 transition-transform active:scale-90",
          active && "text-primary"
        )}
        strokeWidth={active ? 2.35 : 1.85}
      />
      <span
        className={cn(
          "text-[10px] font-semibold leading-none",
          active ? "text-primary" : "text-muted-foreground"
        )}
      >
        {label}
      </span>
    </Link>
  )
}
