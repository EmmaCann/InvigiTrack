"use client"

import { useState, useEffect, useRef } from "react"
import { X, PlayCircle, BookOpen } from "lucide-react"
import { TUTORIAL_ITEMS, getTutorialsByCategory } from "@/lib/help-content"
import { cn } from "@/lib/utils"

interface Props {
  open:            boolean
  onClose:         () => void
  initialSection?: string
}

export function HelpDialog({ open, onClose, initialSection }: Props) {
  const grouped  = getTutorialsByCategory()
  const [selected, setSelected] = useState(initialSection ?? TUTORIAL_ITEMS[0].id)
  const tabsRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (initialSection) setSelected(initialSection)
  }, [initialSection])

  // Scroll active pill into view on mobile
  useEffect(() => {
    if (!open || !tabsRef.current) return
    const active = tabsRef.current.querySelector("[data-active='true']") as HTMLElement | null
    active?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" })
  }, [selected, open])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  const item = TUTORIAL_ITEMS.find((i) => i.id === selected) ?? TUTORIAL_ITEMS[0]

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center sm:items-center sm:p-4">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-black/30 backdrop-blur-sm"
        aria-label="Chiudi aiuto"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative flex w-full max-w-4xl overflow-hidden rounded-t-3xl border border-white/50 bg-white/95 shadow-2xl backdrop-blur-2xl sm:rounded-3xl"
        style={{ height: "min(90dvh, 680px)" }}
      >
        {/* Drag handle mobile */}
        <div className="absolute left-1/2 top-2.5 flex -translate-x-1/2 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/25" />
        </div>

        {/* Sidebar sinistra (solo desktop) */}
        <nav className="hidden w-52 shrink-0 overflow-y-auto border-r border-border/40 bg-white/60 py-5 sm:block">
          <p className="px-4 pb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            Tutorial
          </p>
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="mb-4">
              <p className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/50">
                {category}
              </p>
              {items.map((i) => (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => setSelected(i.id)}
                  className={cn(
                    "flex w-full items-center gap-2 px-4 py-1.5 text-left text-sm transition-colors",
                    selected === i.id
                      ? "bg-primary/8 font-semibold text-primary"
                      : "text-foreground/75 hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  {i.videoSrc
                    ? <PlayCircle className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                    : <BookOpen   className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                  }
                  <span className="truncate">{i.title}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Main area */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

          {/* Mobile tab scroll */}
          <div
            ref={tabsRef}
            className="flex items-center gap-2 overflow-x-auto border-b border-border/30 bg-white/60 px-4 pb-2.5 pt-6 [&::-webkit-scrollbar]:hidden sm:hidden"
            style={{ scrollbarWidth: "none" }}
          >
            {TUTORIAL_ITEMS.map((i) => (
              <button
                key={i.id}
                data-active={selected === i.id ? "true" : "false"}
                type="button"
                onClick={() => setSelected(i.id)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap transition-colors",
                  selected === i.id
                    ? "border-primary/40 bg-primary/8 text-primary"
                    : "border-border/40 text-muted-foreground hover:text-foreground",
                )}
              >
                {i.title}
              </button>
            ))}
          </div>

          {/* Close button (desktop) */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
            aria-label="Chiudi"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Contenuto */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-8">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-primary">
              {Object.entries(grouped).find(([, items]) => items.some((i) => i.id === selected))?.[0] ?? ""}
            </p>
            <h2 className="mb-1 text-lg font-bold text-foreground sm:text-xl">{item.title}</h2>
            <p className="mb-5 text-sm text-muted-foreground">{item.description}</p>

            {item.videoSrc && (
              <video
                key={item.videoSrc}
                src={item.videoSrc}
                controls
                className="mb-5 w-full rounded-2xl bg-black object-contain"
                style={{ maxHeight: "260px" }}
              />
            )}

            <div className="text-sm leading-relaxed text-foreground/80 whitespace-pre-line">
              {item.body}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
