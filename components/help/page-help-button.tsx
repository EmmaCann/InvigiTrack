"use client"

import { useState } from "react"
import { CircleHelp, X, ArrowRight } from "lucide-react"
import { openHelpDialog } from "@/lib/help-events"

export interface PageHelp {
  lines:       [string, string]  // 2 righe di testo contestuale alla pagina
  tutorialId?: string            // ID della sezione tutorial da aprire
}

/**
 * Bottone fisso in basso a destra su ogni pagina del dashboard.
 * Click → tooltip con 2 righe di aiuto + link al tutorial.
 * Il HelpDialog è gestito globalmente da DashboardSearchLayer.
 */
export function PageHelpButton({ help }: { help: PageHelp }) {
  const [showTooltip, setShowTooltip] = useState(false)

  function openTutorial() {
    setShowTooltip(false)
    openHelpDialog(help.tutorialId)
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-2.5 md:bottom-6 md:right-6">

      {/* Tooltip card — sfondo bianco solido, no glass */}
      {showTooltip && (
        <div className="w-[272px] rounded-2xl border border-border/60 bg-white px-5 py-4 shadow-[0_8px_32px_rgba(15,23,42,0.14)] space-y-2.5">
          <p className="text-sm font-medium leading-snug text-foreground">{help.lines[0]}</p>
          <p className="text-sm leading-snug text-muted-foreground">{help.lines[1]}</p>
          <button
            type="button"
            onClick={openTutorial}
            className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            Vedi tutorial <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Pulsante circolare */}
      <button
        type="button"
        onClick={() => setShowTooltip((v) => !v)}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-white shadow-[0_4px_16px_rgba(15,23,42,0.10)] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
        aria-label={showTooltip ? "Chiudi aiuto" : "Aiuto"}
      >
        {showTooltip
          ? <X          className="h-4 w-4" />
          : <CircleHelp className="h-4 w-4" />
        }
      </button>

    </div>
  )
}
