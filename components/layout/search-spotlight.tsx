"use client"

import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Search, ArrowUpRight, LayoutDashboard, CalendarCheck,
  CreditCard, Calendar, Settings, Plus, FileDown, BarChart2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { NAV_ITEMS, SETTINGS_ITEM } from "./nav-items"

// --- Tipi --------------------------------------------------------------------

type EntryType = "page" | "action" | "session" | "event"

interface Entry {
  id:       string
  type:     EntryType
  label:    string
  hint?:    string
  href?:    string
  action?:  () => void
  icon?:    React.ElementType
  keywords?: string
}

interface Group {
  title: string
  entries: Entry[]
}

// --- Icone per le sezioni di navigazione -------------------------------------

const NAV_ICONS: Record<string, React.ElementType> = {
  "/dashboard":            LayoutDashboard,
  "/dashboard/sessions":   CalendarCheck,
  "/dashboard/payments":   CreditCard,
  "/dashboard/calendar":   Calendar,
  "/dashboard/statistics": BarChart2,
  "/dashboard/settings":   Settings,
}

// --- Props --------------------------------------------------------------------

interface Props {
  open:         boolean
  onOpenChange: (open: boolean) => void
  recentSessions?: { id: string; exam_name: string; date: string; location?: string }[]
  upcomingEvents?: { id: string; title: string; date: string; location?: string }[]
}

// --- Componente --------------------------------------------------------------

export function SearchSpotlight({ open, onOpenChange, recentSessions = [], upcomingEvents = [] }: Props) {
  const router    = useRouter()
  const inputRef  = useRef<HTMLInputElement>(null)
  const listRef   = useRef<HTMLDivElement>(null)
  const [query,   setQuery]   = useState("")
  const [selIdx,  setSelIdx]  = useState(0)

  // -- Tutti gli entry statici -----------------------------------------------
  const staticGroups = useMemo<Group[]>(() => {
    const pages: Entry[] = [
      ...NAV_ITEMS.map((i) => ({
        id:       `page-${i.href}`,
        type:     "page" as EntryType,
        label:    i.label.charAt(0).toUpperCase() + i.label.slice(1).toLowerCase(),
        hint:     "Vai alla sezione",
        href:     i.href,
        icon:     NAV_ICONS[i.href],
        keywords: i.label.toLowerCase(),
      })),
      {
        id:       "page-settings",
        type:     "page",
        label:    "Impostazioni",
        hint:     "Account e preferenze",
        href:     SETTINGS_ITEM.href,
        icon:     Settings,
        keywords: "impostazioni settings account profilo",
      },
    ]

    const actions: Entry[] = [
      {
        id:       "action-new-session",
        type:     "action",
        label:    "Nuova sessione",
        hint:     "Registra una sessione di lavoro",
        href:     "/dashboard/sessions",
        icon:     Plus,
        keywords: "nuova sessione registra lavoro",
      },
      {
        id:       "action-new-event",
        type:     "action",
        label:    "Nuovo evento",
        hint:     "Aggiungi un appuntamento al calendario",
        href:     "/dashboard/calendar",
        icon:     Calendar,
        keywords: "nuovo evento calendario appuntamento turno",
      },
      {
        id:       "action-payments",
        type:     "action",
        label:    "Da pagare",
        hint:     "Vedi le sessioni non ancora pagate",
        href:     "/dashboard/payments",
        icon:     CreditCard,
        keywords: "pagamenti da pagare non pagato",
      },
      {
        id:       "action-export",
        type:     "action",
        label:    "Esporta CSV sessioni",
        hint:     "Scarica i dati delle sessioni",
        href:     "/dashboard/sessions",
        icon:     FileDown,
        keywords: "esporta csv download sessioni",
      },
    ]

    return [
      { title: "Azioni rapide", entries: actions },
      { title: "Sezioni",       entries: pages   },
    ]
  }, [])

  // -- Entry dinamici da dati ------------------------------------------------
  const dynamicGroups = useMemo<Group[]>(() => {
    const groups: Group[] = []

    if (recentSessions.length > 0) {
      groups.push({
        title: "Sessioni recenti",
        entries: recentSessions.map((s) => ({
          id:       `session-${s.id}`,
          type:     "session" as EntryType,
          label:    s.exam_name,
          hint:     `${s.date}${s.location ? ` · ${s.location}` : ""}`,
          href:     "/dashboard/sessions",
          icon:     CalendarCheck,
          keywords: `${s.exam_name} ${s.location ?? ""} ${s.date}`.toLowerCase(),
        })),
      })
    }

    if (upcomingEvents.length > 0) {
      groups.push({
        title: "Prossimi eventi",
        entries: upcomingEvents.map((e) => ({
          id:       `event-${e.id}`,
          type:     "event" as EntryType,
          label:    e.title,
          hint:     `${e.date}${e.location ? ` · ${e.location}` : ""}`,
          href:     "/dashboard/calendar",
          icon:     Calendar,
          keywords: `${e.title} ${e.location ?? ""} ${e.date}`.toLowerCase(),
        })),
      })
    }

    return groups
  }, [recentSessions, upcomingEvents])

  // -- Filtra per query -----------------------------------------------------
  const allGroups = useMemo<Group[]>(() => {
    const q = query.trim().toLowerCase()
    const allG = [...staticGroups, ...dynamicGroups]
    if (!q) return allG

    return allG
      .map((g) => ({
        ...g,
        entries: g.entries.filter((e) => {
          const hay = [e.label, e.hint ?? "", e.keywords ?? ""].join(" ").toLowerCase()
          return hay.includes(q)
        }),
      }))
      .filter((g) => g.entries.length > 0)
  }, [query, staticGroups, dynamicGroups])

  // Lista piatta per navigazione con tastiera
  const flatEntries = useMemo(() => allGroups.flatMap((g) => g.entries), [allGroups])

  // -- Reset selezione al cambio query --------------------------------------
  useEffect(() => { setSelIdx(0) }, [query])

  // -- Focus input all'apertura ----------------------------------------------
  useEffect(() => {
    if (!open) { setQuery(""); return }
    const t = window.setTimeout(() => inputRef.current?.focus(), 50)
    return () => window.clearTimeout(t)
  }, [open])

  // -- Blocca scroll body ----------------------------------------------------
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [open])

  // -- Navigazione tastiera -------------------------------------------------
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") { onOpenChange(false); return }
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelIdx((i) => Math.min(i + 1, flatEntries.length - 1))
    }
    if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelIdx((i) => Math.max(i - 1, 0))
    }
    if (e.key === "Enter") {
      e.preventDefault()
      const entry = flatEntries[selIdx]
      if (!entry) return
      if (entry.href) {
        router.push(entry.href)
        onOpenChange(false)
      } else if (entry.action) {
        entry.action()
        onOpenChange(false)
      }
    }
  }, [flatEntries, selIdx, router, onOpenChange])

  // -- Esegui entry ----------------------------------------------------------
  function execute(entry: Entry) {
    if (entry.href) router.push(entry.href)
    else entry.action?.()
    onOpenChange(false)
  }

  if (!open) return null

  // Colori per tipo
  const TYPE_STYLE: Record<EntryType, string> = {
    page:    "bg-primary/8 text-primary",
    action:  "bg-violet-50 text-violet-600",
    session: "bg-blue-50 text-blue-600",
    event:   "bg-teal-50 text-teal-600",
  }

  let globalIdx = 0

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center px-4 pt-[10vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Ricerca"
    >
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-black/20 backdrop-blur-[2px]"
        aria-label="Chiudi ricerca"
        onClick={() => onOpenChange(false)}
      />

      {/* Panel */}
      <div className="relative w-full max-w-[560px] overflow-hidden rounded-2xl border border-white/50 bg-white/88 shadow-2xl shadow-black/[0.18] backdrop-blur-2xl backdrop-saturate-[1.9]">

        {/* Input */}
        <div className="flex items-center gap-3 border-b border-black/[0.07] px-4 py-3.5">
          <Search className="h-4 w-4 shrink-0 text-primary/60" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Cerca sezioni, sessioni, azioni…"
            className="flex-1 bg-transparent text-[14px] text-foreground outline-none placeholder:text-slate-400"
          />
          <kbd className="hidden h-5 items-center rounded border border-border/50 bg-white/60 px-1.5 text-[10px] font-medium text-muted-foreground sm:inline-flex">
            esc
          </kbd>
        </div>

        {/* Risultati */}
        <div ref={listRef} className="max-h-[min(58vh,440px)] overflow-y-auto p-2">
          {flatEntries.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              Nessun risultato per <span className="font-medium text-foreground">&ldquo;{query}&rdquo;</span>
            </p>
          ) : (
            <div className="space-y-1">
              {allGroups.map((group) => (
                <div key={group.title}>
                  {/* Group header */}
                  <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/60">
                    {group.title}
                  </p>
                  <ul className="space-y-0.5">
                    {group.entries.map((entry) => {
                      const idx = globalIdx++
                      const isSelected = idx === selIdx
                      const Icon = entry.icon
                      return (
                        <li key={entry.id}>
                          <button
                            type="button"
                            onClick={() => execute(entry)}
                            onMouseEnter={() => setSelIdx(idx)}
                            className={cn(
                              "flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                              isSelected ? "bg-primary/8" : "hover:bg-slate-50",
                            )}
                          >
                            {Icon && (
                              <div className={cn(
                                "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                                TYPE_STYLE[entry.type],
                              )}>
                                <Icon className="h-3.5 w-3.5" />
                              </div>
                            )}
                            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                              <span className="text-sm font-semibold text-foreground">{entry.label}</span>
                              {entry.hint && (
                                <span className="truncate text-xs text-muted-foreground">{entry.hint}</span>
                              )}
                            </span>
                            <ArrowUpRight className={cn(
                              "h-3.5 w-3.5 shrink-0 transition-opacity",
                              isSelected ? "text-primary opacity-100" : "text-muted-foreground/30 opacity-0 group-hover:opacity-100",
                            )} />
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-black/[0.06] px-4 py-2">
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border/50 bg-white/60 px-1 font-mono text-[10px]">↑↓</kbd>
              naviga
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border/50 bg-white/60 px-1 font-mono text-[10px]">↵</kbd>
              apri
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            <kbd className="rounded border border-border/50 bg-white/60 px-1 font-mono text-[10px]">Ctrl+K</kbd>
          </span>
        </div>
      </div>
    </div>
  )
}
