"use client"

import { useState, useEffect } from "react"
import { X, PlayCircle, FileText, ChevronRight, ArrowLeft } from "lucide-react"
import { TUTORIAL_ITEMS, getTutorialsByCategory } from "@/lib/help-content"
import { useIsMobile } from "@/hooks/use-is-mobile"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

interface Props {
  open:            boolean
  onClose:         () => void
  initialSection?: string
}

const CATEGORY_EMOJI: Record<string, string> = {
  "Iniziare":     "🚀",
  "Sessioni":     "📋",
  "Pagamenti":    "💶",
  "Calendario":   "📅",
  "Impostazioni": "⚙️",
}

export function HelpDialog({ open, onClose, initialSection }: Props) {
  const grouped  = getTutorialsByCategory()
  const isMobile = useIsMobile()

  const [selected,   setSelected]   = useState<string | null>(initialSection ?? null)
  const [mobileView, setMobileView] = useState<"list" | "detail">("list")

  useEffect(() => {
    if (initialSection) {
      setSelected(initialSection)
      setMobileView("detail")
    }
  }, [initialSection])

  useEffect(() => {
    if (!open) {
      // Reset on close
      setTimeout(() => { setMobileView("list") }, 300)
    }
  }, [open])

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

  const item = selected ? (TUTORIAL_ITEMS.find((i) => i.id === selected) ?? null) : null

  function selectItem(id: string) {
    setSelected(id)
    setMobileView("detail")
  }

  function goBack() {
    setMobileView("list")
  }

  // ── Mobile: Sheet dal basso ──────────────────────────────────────────────────

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent
          side="bottom"
          className="flex flex-col gap-0 rounded-t-2xl p-0"
          style={{ height: "92dvh" }}
        >
          <SheetTitle className="sr-only">Tutorial e aiuto</SheetTitle>

          {/* Drag handle */}
          <div className="flex shrink-0 justify-center pt-3 pb-1">
            <div className="h-1 w-10 rounded-full bg-muted-foreground/25" />
          </div>

          {/* Vista lista categorie */}
          {mobileView === "list" && (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border/40 px-5 py-3.5">
                <div>
                  <h2 className="text-base font-bold text-foreground">Tutorial</h2>
                  <p className="text-xs text-muted-foreground">Guida all'uso di InvigiTrack</p>
                </div>
                <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Categorie + voci */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
                {Object.entries(grouped).map(([category, items]) => (
                  <div key={category}>
                    {/* Header categoria */}
                    <div className="mb-2 flex items-center gap-2 px-1">
                      <span className="text-lg leading-none">{CATEGORY_EMOJI[category] ?? "📌"}</span>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                        {category}
                      </p>
                    </div>

                    {/* Voci */}
                    <div className="space-y-1.5">
                      {items.map((i) => (
                        <button
                          key={i.id}
                          type="button"
                          onClick={() => selectItem(i.id)}
                          className="flex w-full items-center gap-3 rounded-2xl border border-border/40 bg-white/60 px-4 py-3.5 text-left transition-colors hover:border-primary/30 hover:bg-primary/[0.03]"
                        >
                          <div className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                            i.videoSrc ? "bg-primary/10" : "bg-muted/60",
                          )}>
                            {i.videoSrc
                              ? <PlayCircle className="h-4 w-4 text-primary" />
                              : <FileText   className="h-4 w-4 text-muted-foreground" />
                            }
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-foreground">{i.title}</p>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">{i.description}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vista dettaglio voce */}
          {mobileView === "detail" && item && (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-border/40 px-4 py-3.5">
                <button
                  type="button"
                  onClick={goBack}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border/40 bg-white/60 text-muted-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                    {CATEGORY_EMOJI[item.category] ?? ""} {item.category}
                  </p>
                  <h2 className="truncate text-sm font-bold text-foreground">{item.title}</h2>
                </div>
                <button onClick={onClose} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Contenuto */}
              <div className="flex-1 overflow-y-auto px-5 py-5">
                <p className="mb-5 text-sm text-muted-foreground">{item.description}</p>

                {item.videoSrc && (
                  <video
                    key={item.videoSrc}
                    src={item.videoSrc}
                    controls
                    className="mb-5 w-full rounded-2xl bg-black object-contain"
                    style={{ maxHeight: "220px" }}
                  />
                )}

                <div className="text-sm leading-relaxed text-foreground/80 whitespace-pre-line">
                  {item.body}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    )
  }

  // ── Desktop: overlay a due colonne ───────────────────────────────────────────

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative flex w-full max-w-4xl overflow-hidden rounded-3xl border border-white/50 bg-white/95 shadow-2xl backdrop-blur-2xl"
        style={{ height: "min(80vh, 680px)" }}
      >
        {/* Sidebar sinistra — categorie */}
        <nav className="w-56 shrink-0 overflow-y-auto border-r border-border/40 bg-white/60 py-5">
          <p className="px-4 pb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            Tutorial
          </p>
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="mb-3">
              <div className="flex items-center gap-1.5 px-4 py-1">
                <span className="text-sm">{CATEGORY_EMOJI[category] ?? "📌"}</span>
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground/60">
                  {category}
                </p>
              </div>
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
                    : <FileText   className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                  }
                  <span className="truncate">{i.title}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Contenuto */}
        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>

          {item ? (
            <div className="p-8">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                {CATEGORY_EMOJI[item.category] ?? ""} {item.category}
              </p>
              <h2 className="mb-1 text-xl font-bold text-foreground">{item.title}</h2>
              <p className="mb-6 text-sm text-muted-foreground">{item.description}</p>

              {item.videoSrc && (
                <video
                  key={item.videoSrc}
                  src={item.videoSrc}
                  controls
                  className="mb-6 w-full rounded-2xl bg-black object-contain"
                  style={{ maxHeight: "300px" }}
                />
              )}

              <div className="text-sm leading-relaxed text-foreground/80 whitespace-pre-line">
                {item.body}
              </div>
            </div>
          ) : (
            /* Stato vuoto — nessuna voce selezionata */
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
              <span className="text-5xl">📖</span>
              <p className="text-base font-semibold text-foreground">Scegli un tutorial</p>
              <p className="text-sm text-muted-foreground">Seleziona una voce dalla barra laterale</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
