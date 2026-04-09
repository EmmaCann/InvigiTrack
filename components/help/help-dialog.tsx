"use client"

import { useState, useEffect } from "react"
import { X, PlayCircle, BookOpen } from "lucide-react"
import { TUTORIAL_ITEMS, getTutorialsByCategory } from "@/lib/help-content"
import { cn } from "@/lib/utils"

interface Props {
  open:            boolean
  onClose:         () => void
  initialSection?: string   // apre direttamente questa sezione
}

export function HelpDialog({ open, onClose, initialSection }: Props) {
  const grouped = getTutorialsByCategory()
  const [selected, setSelected] = useState(initialSection ?? TUTORIAL_ITEMS[0].id)

  // Aggiorna la sezione selezionata quando cambia initialSection
  useEffect(() => {
    if (initialSection) setSelected(initialSection)
  }, [initialSection])

  // Blocca lo scroll del body quando il dialog è aperto
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [open])

  // Chiudi con Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  const item = TUTORIAL_ITEMS.find((i) => i.id === selected) ?? TUTORIAL_ITEMS[0]

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-black/30 backdrop-blur-sm"
        aria-label="Chiudi aiuto"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative flex w-full max-w-4xl overflow-hidden rounded-3xl border border-white/50 bg-white/95 shadow-2xl backdrop-blur-2xl"
        style={{ height: "min(80vh, 680px)" }}
      >

        {/* Sidebar sinistra */}
        <nav className="w-52 shrink-0 overflow-y-auto border-r border-border/40 bg-white/60 py-5">
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

        {/* Area contenuto */}
        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto p-8">
          {/* Tasto chiudi */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Chiudi"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Categoria */}
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-primary">
            {TUTORIAL_ITEMS.find((i) => i.id === selected)
              ? Object.entries(grouped).find(([, items]) => items.some((i) => i.id === selected))?.[0]
              : ""}
          </p>

          {/* Titolo */}
          <h2 className="mb-1 text-xl font-bold text-foreground">{item.title}</h2>
          <p className="mb-6 text-sm text-muted-foreground">{item.description}</p>

          {/* Video (se presente) */}
          {item.videoSrc && (
            <video
              key={item.videoSrc}
              src={item.videoSrc}
              controls
              className="mb-6 w-full rounded-2xl bg-black object-contain"
              style={{ maxHeight: "300px" }}
            />
          )}

          {/* Testo */}
          <div className="text-sm leading-relaxed text-foreground/80 whitespace-pre-line">
            {item.body}
          </div>
        </div>
      </div>
    </div>
  )
}
