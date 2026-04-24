"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

const SECTION_GROUPS = [
  {
    label: "Di base",
    sections: [
      { id: "profilo",   label: "Profilo"       },
      { id: "password",  label: "Password"      },
      { id: "archivio",  label: "Archivio dati" },
      { id: "workspace", label: "Workspace"     },
    ],
  },
  {
    label: "Avanzate",
    sections: [
      { id: "dashboard", label: "Dashboard"  },
      { id: "sessioni",  label: "Sessioni"   },
      { id: "pagamenti", label: "Pagamenti"  },
      { id: "analytics", label: "Analytics"  },
    ],
  },
  {
    label: "Altro",
    sections: [
      { id: "legale", label: "Legale" },
    ],
  },
]

const ALL_SECTIONS = SECTION_GROUPS.flatMap((g) => g.sections)

export function SettingsSidebar() {
  const [active, setActive] = useState("profilo")

  useEffect(() => {
    const elements = ALL_SECTIONS
      .map(({ id }) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[]

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible.length > 0) setActive(visible[0].target.id)
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    )

    elements.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  return (
    <nav className="sticky top-8 self-start space-y-4">
      {SECTION_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="mb-1.5 px-3 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.sections.map(({ id, label }) => (
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
        </div>
      ))}
    </nav>
  )
}
