"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { Search, ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { NAV_ITEMS, SETTINGS_ITEM } from "./nav-items"

type Entry = {
  href: string
  label: string
  hint?: string
  keywords?: string
}

export function SearchSpotlight({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState("")

  const entries = useMemo<Entry[]>(() => {
    const nav = NAV_ITEMS.map((i) => ({
      href: i.href,
      label: i.label,
      hint: "Vai alla sezione",
      keywords: i.label.toLowerCase(),
    }))
    const settings = {
      href: SETTINGS_ITEM.href,
      label: SETTINGS_ITEM.label,
      hint: "Account e preferenze",
      keywords: "impostazioni settings account",
    }
    return [...nav, settings]
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return entries
    return entries.filter((e) => {
      const hay = [e.label, e.hint ?? "", e.keywords ?? ""].join(" ").toLowerCase()
      return hay.includes(q)
    })
  }, [entries, query])

  useEffect(() => {
    if (!open) {
      setQuery("")
      return
    }
    const t = window.setTimeout(() => inputRef.current?.focus(), 50)
    return () => window.clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[12vh] px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Ricerca"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/25 backdrop-blur-[2px]"
        aria-label="Chiudi ricerca"
        onClick={() => onOpenChange(false)}
      />

      <div
        className={cn(
          "relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/70",
          "bg-gradient-to-b from-white/75 via-white/65 to-teal-50/35",
          "shadow-[0_24px_80px_rgba(15,118,110,0.12),0_0_0_1px_rgba(255,255,255,0.8)_inset]",
          "backdrop-blur-2xl backdrop-saturate-[1.35]"
        )}
      >
        <div className="flex items-center gap-3 border-b border-white/50 px-4 py-3.5">
          <Search className="h-5 w-5 shrink-0 text-teal-800/50" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca pagine, sessioni, impostazioni…"
            className="flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-slate-400"
            onKeyDown={(e) => {
              if (e.key === "Escape") onOpenChange(false)
            }}
          />
          <kbd className="hidden sm:inline-flex h-6 items-center rounded-md border border-white/60 bg-white/50 px-1.5 text-[10px] font-medium text-muted-foreground shadow-sm">
            esc
          </kbd>
        </div>

        <div className="max-h-[min(55vh,420px)] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              Nessun risultato. Prova un altro termine.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {filtered.map((e) => (
                <li key={e.href + e.label}>
                  <Link
                    href={e.href}
                    onClick={() => onOpenChange(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                      "hover:bg-teal-50/80 focus-visible:bg-teal-50/80 focus-visible:outline-none"
                    )}
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-sm font-semibold text-foreground">{e.label}</span>
                      {e.hint && (
                        <span className="text-xs text-muted-foreground">{e.hint}</span>
                      )}
                    </span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-teal-700/40" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="border-t border-white/50 px-4 py-2.5 text-[11px] text-muted-foreground">
          Suggerimento: usa <kbd className="rounded border border-white/60 bg-white/40 px-1 font-mono text-[10px]">⌘K</kbd>{" "}
          o <kbd className="rounded border border-white/60 bg-white/40 px-1 font-mono text-[10px]">Ctrl K</kbd> da
          qualsiasi pagina.
        </p>
      </div>
    </div>
  )
}
