"use client"

import { useEffect, useState } from "react"
import { SearchSpotlight } from "./search-spotlight"

const OPEN_EVENT = "invigitrack-open-search"

export function openDashboardSearch() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OPEN_EVENT))
  }
}

export function DashboardSearchLayer() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen(true)
      }
    }
    const onBus = () => setOpen(true)
    window.addEventListener("keydown", onKey)
    window.addEventListener(OPEN_EVENT, onBus as EventListener)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener(OPEN_EVENT, onBus as EventListener)
    }
  }, [])

  return <SearchSpotlight open={open} onOpenChange={setOpen} />
}
