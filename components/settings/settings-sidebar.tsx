"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

const SECTIONS = [
  { id: "profilo",   label: "Profilo"    },
  { id: "password",  label: "Password"   },
  { id: "workspace", label: "Workspace"  },
  { id: "dashboard", label: "Dashboard"  },
  { id: "analytics", label: "Analytics"  },
]

/**
 * Sidebar sticky per la pagina Settings.
 * Usa IntersectionObserver per evidenziare la sezione visibile.
 * Visibile solo su schermi md+.
 */
export function SettingsSidebar() {
  const [active, setActive] = useState("profilo")

  useEffect(() => {
    const elements = SECTIONS.map(({ id }) => document.getElementById(id)).filter(Boolean) as HTMLElement[]

    const obs = new IntersectionObserver(
      (entries) => {
        // Prende la prima sezione visibile con la percentuale più alta
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible.length > 0) setActive(visible[0].target.id)
      },
      {
        rootMargin: "-20% 0px -60% 0px",
        threshold:  [0, 0.25, 0.5, 0.75, 1],
      },
    )

    elements.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  return (
    <nav className="sticky top-8 self-start">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
        Navigazione
      </p>
      <ul className="space-y-0.5">
        {SECTIONS.map(({ id, label }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className={cn(
                "block rounded-lg px-3 py-1.5 text-sm transition-colors",
                active === id
                  ? "bg-primary/8 font-semibold text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
