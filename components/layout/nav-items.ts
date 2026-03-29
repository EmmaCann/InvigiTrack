/**
 * NAV ITEMS — fonte unica di verità per la navigazione.
 *
 * Sia la Sidebar desktop che il MobileHeader e il BottomNav
 * importano da qui. Se aggiungi una voce, appare ovunque.
 *
 * Principio: Single Source of Truth (SSOT) — un concetto
 * fondamentale in qualsiasi codebase professionale.
 */

import {
  LayoutDashboard,
  CalendarCheck,
  CreditCard,
  BarChart3,
  Settings,
} from "lucide-react"

export const NAV_ITEMS = [
  { href: "/dashboard",            label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/sessions",   label: "Sessions",  icon: CalendarCheck   },
  { href: "/dashboard/payments",   label: "Payments",  icon: CreditCard      },
  { href: "/dashboard/analytics",  label: "Analytics", icon: BarChart3       },
] as const

export const SETTINGS_ITEM = {
  href: "/dashboard/settings",
  label: "Settings",
  icon: Settings,
} as const

/**
 * Determina se un link è attivo in base al pathname corrente.
 * Dashboard è attivo SOLO su /dashboard esatto (non sub-route).
 */
export function isActiveRoute(itemHref: string, pathname: string): boolean {
  if (itemHref === "/dashboard") return pathname === "/dashboard"
  return pathname === itemHref || pathname.startsWith(itemHref + "/")
}
