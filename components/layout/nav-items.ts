import {
  LayoutDashboard,
  CalendarCheck,
  CreditCard,
  BarChart3,
  CalendarDays,
  Settings,
} from "lucide-react"

export const NAV_ITEMS = [
  { href: "/dashboard",            label: "Dashboard",   icon: LayoutDashboard },
  { href: "/dashboard/sessions",   label: "Sessioni",    icon: CalendarCheck   },
  { href: "/dashboard/payments",   label: "Pagamenti",   icon: CreditCard      },
  { href: "/dashboard/calendar",   label: "Calendario",  icon: CalendarDays    },
  { href: "/dashboard/analytics",  label: "Statistiche", icon: BarChart3       },
] as const

export const SETTINGS_ITEM = {
  href: "/dashboard/settings",
  label: "Impostazioni",
  icon: Settings,
} as const

export function isActiveRoute(itemHref: string, pathname: string): boolean {
  if (itemHref === "/dashboard") return pathname === "/dashboard"
  return pathname === itemHref || pathname.startsWith(itemHref + "/")
}
