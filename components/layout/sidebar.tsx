"use client"

/**
 * SIDEBAR — Client Component.
 *
 * Perché Client Component? Perché usa usePathname() per sapere
 * su quale pagina siamo e evidenziare il link attivo.
 * usePathname() è un hook di React → solo client.
 *
 * Struttura visiva:
 *   [Logo]
 *   [Nav links]
 *   [Settings in fondo]
 */

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  CalendarCheck,
  CreditCard,
  BarChart3,
  Settings,
  ClipboardList,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Definizione delle voci di navigazione ───────────────────────────────────

const navItems = [
  { href: "/dashboard",           label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/sessions",  label: "Sessions",  icon: CalendarCheck },
  { href: "/dashboard/payments",  label: "Payments",  icon: CreditCard },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
]

// Settings è separato — lo mettiamo sempre in fondo alla sidebar
const bottomItem = { href: "/dashboard/settings", label: "Settings", icon: Settings }

// ─── Helper: capisce se un link è attivo ─────────────────────────────────────

function isActiveRoute(itemHref: string, pathname: string): boolean {
  // Dashboard è attivo SOLO su /dashboard esatto (non sui sotto-percorsi)
  if (itemHref === "/dashboard") return pathname === "/dashboard"
  // Tutti gli altri: attivi se il pathname inizia con il loro href
  return pathname === itemHref || pathname.startsWith(itemHref + "/")
}

// ─── Componente singolo link ──────────────────────────────────────────────────

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
        // Layout e transizione base
        "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      {/* Indicatore verticale sinistro — visibile solo sul link attivo */}
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-primary" />
      )}

      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  )
}

// ─── Sidebar principale ───────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-border bg-sidebar">

      {/* ── Logo ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-[1.1rem] border-b border-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shrink-0">
          <ClipboardList className="h-4 w-4 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold leading-tight truncate">InvigiTrack</p>
          <p className="text-[11px] text-muted-foreground leading-tight truncate">
            Academic Precision
          </p>
        </div>
      </div>

      {/* ── Nav principale ────────────────────────────────────────────── */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {navItems.map((item) => (
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
      <div className="px-3 pb-4 border-t border-border pt-3">
        <NavLink
          href={bottomItem.href}
          label={bottomItem.label}
          icon={bottomItem.icon}
          active={isActiveRoute(bottomItem.href, pathname)}
        />
      </div>

    </aside>
  )
}
