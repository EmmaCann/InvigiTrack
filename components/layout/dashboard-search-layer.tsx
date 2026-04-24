"use client"

import { useEffect, useState } from "react"
import { SearchSpotlight } from "./search-spotlight"
import { HelpDialog } from "@/components/help/help-dialog"
import { OPEN_HELP_EVENT } from "@/lib/help-events"

const OPEN_SEARCH_EVENT = "invigitrack-open-search"

export function openDashboardSearch() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OPEN_SEARCH_EVENT))
  }
}

interface SearchData {
  recentSessions: { id: string; exam_name: string; date: string; location?: string }[]
  upcomingEvents: { id: string; title: string; date: string; location?: string }[]
  platformRole?:  string
}

/**
 * Layer globale per Spotlight (Ctrl+K) e HelpDialog.
 * Renderizzato una sola volta nel layout — gestisce entrambi i dialog.
 */
export function DashboardSearchLayer({ recentSessions = [], upcomingEvents = [], platformRole }: Partial<SearchData> = {}) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [helpItem,   setHelpItem]   = useState<string | null>(null)

  useEffect(() => {
    // Ctrl+K → apre lo spotlight
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    // Event bus → apre lo spotlight
    const onSearchBus = () => setSearchOpen(true)
    // Event bus → apre HelpDialog
    const onHelpBus = (e: Event) => {
      const tutorialId = (e as CustomEvent<{ tutorialId?: string }>).detail?.tutorialId
      setHelpItem(tutorialId ?? "")
    }

    window.addEventListener("keydown",          onKey)
    window.addEventListener(OPEN_SEARCH_EVENT,  onSearchBus as EventListener)
    window.addEventListener(OPEN_HELP_EVENT,    onHelpBus   as EventListener)
    return () => {
      window.removeEventListener("keydown",         onKey)
      window.removeEventListener(OPEN_SEARCH_EVENT, onSearchBus as EventListener)
      window.removeEventListener(OPEN_HELP_EVENT,   onHelpBus   as EventListener)
    }
  }, [])

  return (
    <>
      <SearchSpotlight
        open={searchOpen}
        onOpenChange={setSearchOpen}
        recentSessions={recentSessions}
        upcomingEvents={upcomingEvents}
        onOpenHelp={(id) => { setSearchOpen(false); setHelpItem(id) }}
      />
      <HelpDialog
        open={helpItem !== null}
        onClose={() => setHelpItem(null)}
        initialSection={helpItem ?? undefined}
        platformRole={platformRole}
      />
    </>
  )
}
