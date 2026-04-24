"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { driver } from "driver.js"
import "driver.js/dist/driver.css"
import { markTourSeen } from "@/app/actions/settings"
import { OPEN_TOUR_EVENT } from "@/lib/help-events"
import { Sparkles } from "lucide-react"

// ── Colori inline — usati in onPopoverRender ──────────────────────────────────

const PRIMARY   = "oklch(0.50 0.22 258)"
const FG        = "oklch(0.12 0.015 258)"
const MUTED     = "oklch(0.50 0.012 258)"
const MUTED_BG  = "rgba(15,23,42,0.06)"
const BORDER    = "rgba(15,23,42,0.08)"

function applyPopoverStyles(popover: {
  wrapper:          HTMLElement
  title:            HTMLElement
  description:      HTMLElement
  footer:           HTMLElement
  progress:         HTMLElement
  previousButton:   HTMLButtonElement
  nextButton:       HTMLButtonElement
  closeButton:      HTMLButtonElement
  [key: string]:    unknown
}) {
  // Contenitore
  Object.assign(popover.wrapper.style, {
    background:     "rgba(255,255,255,0.98)",
    backdropFilter: "blur(24px) saturate(1.8)",
    border:         "1px solid rgba(200,212,230,0.5)",
    borderRadius:   "20px",
    boxShadow:      "0 2px 4px rgba(15,23,42,0.04), 0 12px 48px rgba(15,23,42,0.14), 0 0 0 1px rgba(255,255,255,0.7)",
    padding:        "22px 24px 18px",
    minWidth:       "280px",
    maxWidth:       "330px",
    fontFamily:     "inherit",
  })

  // Titolo
  Object.assign(popover.title.style, {
    fontSize:      "15px",
    fontWeight:    "700",
    color:         FG,
    letterSpacing: "-0.01em",
    lineHeight:    "1.3",
    marginBottom:  "4px",
  })

  // Descrizione
  Object.assign(popover.description.style, {
    fontSize:   "13px",
    lineHeight: "1.65",
    color:      MUTED,
    fontWeight: "400",
  })

  // Footer
  Object.assign(popover.footer.style, {
    marginTop:   "16px",
    paddingTop:  "12px",
    borderTop:   `1px solid ${BORDER}`,
    alignItems:  "center",
  })

  // Progress text
  Object.assign(popover.progress.style, {
    fontSize:      "11px",
    fontWeight:    "600",
    color:         MUTED,
    letterSpacing: "0.03em",
  })

  // Pulsante chiudi (×)
  Object.assign(popover.closeButton.style, {
    width:        "28px",
    height:       "28px",
    borderRadius: "8px",
    fontSize:     "15px",
    color:        MUTED,
    top:          "6px",
    right:        "6px",
    transition:   "background 0.15s",
  })

  // Pulsante Indietro
  Object.assign(popover.previousButton.style, {
    background:   MUTED_BG,
    color:        "oklch(0.38 0.012 258)",
    border:       "none",
    borderRadius: "10px",
    padding:      "7px 14px",
    fontSize:     "12px",
    fontWeight:   "600",
    cursor:       "pointer",
    textShadow:   "none",
    lineHeight:   "1.4",
    transition:   "opacity 0.15s",
  })

  // Pulsante Avanti / Fine
  Object.assign(popover.nextButton.style, {
    background:   PRIMARY,
    color:        "#fff",
    border:       "none",
    borderRadius: "10px",
    padding:      "7px 16px",
    fontSize:     "12px",
    fontWeight:   "700",
    cursor:       "pointer",
    textShadow:   "none",
    lineHeight:   "1.4",
    boxShadow:    "0 2px 10px rgba(59,130,246,0.30)",
    transition:   "opacity 0.15s",
  })
}

// ── Step definitions ──────────────────────────────────────────────────────────

const DESKTOP_STEPS = [
  {
    element: "[data-tour='sidebar']",
    popover: {
      title:       "Navigazione",
      description: "Da qui raggiungi tutte le sezioni: Sessioni, Pagamenti, Calendario e Impostazioni. In fondo trovi sempre il prossimo turno in programma.",
      side:        "right" as const,
      align:       "start" as const,
    },
  },
  {
    element: "[data-tour='stat-cards']",
    popover: {
      title:       "I tuoi numeri",
      description: "Ore lavorate, guadagni del mese e importi non ancora pagati — un colpo d'occhio sui dati più importanti. Scegli quali card mostrare dalle Impostazioni.",
      side:        "bottom" as const,
      align:       "start" as const,
    },
  },
  {
    element: "[data-tour='recent-sessions']",
    popover: {
      title:       "Sessioni recenti",
      description: "Le ultime 5 sessioni registrate: data, sede, importo e stato del pagamento. Clicca \"Vedi tutte\" per aprire la lista completa.",
      side:        "top" as const,
      align:       "start" as const,
    },
  },
  {
    element: "[data-tour='settings-nav']",
    popover: {
      title:       "Personalizza tutto",
      description: "Nelle Impostazioni puoi configurare le card della dashboard, le tariffe orarie e le preferenze di ogni sezione. Rendila tua.",
      side:        "right" as const,
      align:       "start" as const,
    },
  },
  {
    element: "[data-tour='feedback-btn']",
    popover: {
      title:       "Scrivimi",
      description: "Hai trovato un bug, hai un'idea o vuoi chiedere una nuova funzionalità? Contattami direttamente da qui. Rispondo sempre.",
      side:        "right" as const,
      align:       "start" as const,
    },
  },
]

const MOBILE_STEPS = [
  {
    element: "[data-tour='mobile-header']",
    popover: {
      title:       "L'intestazione",
      description: "Qui trovi la ricerca e le notifiche. Nel menu avatar (in alto a destra) accedi a Impostazioni, Tour guidato e Invia feedback.",
      side:        "bottom" as const,
      align:       "start" as const,
    },
  },
  {
    element: "[data-tour='stat-cards']",
    popover: {
      title:       "I tuoi numeri",
      description: "Ore lavorate, guadagni del mese e importi non ancora pagati. Scegli quali card mostrare dalle Impostazioni.",
      side:        "bottom" as const,
      align:       "start" as const,
    },
  },
  {
    element: "[data-tour='recent-sessions']",
    popover: {
      title:       "Sessioni recenti",
      description: "Le ultime 5 sessioni registrate con data, sede, importo e stato. Clicca \"Vedi tutte\" per la lista completa.",
      side:        "top" as const,
      align:       "start" as const,
    },
  },
  {
    element: "[data-tour='bottom-nav']",
    popover: {
      title:       "Navigazione",
      description: "I link principali sempre a portata di pollice: Dashboard, Sessioni, Pagamenti e Calendario.",
      side:        "top" as const,
      align:       "start" as const,
    },
  },
]

// ── Intro modal ───────────────────────────────────────────────────────────────

function TourIntroModal({ onStart, onSkip }: { onStart: () => void; onSkip: () => void }) {
  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-5">
      <div className="absolute inset-0 bg-black/35 backdrop-blur-sm" />

      <div className="relative w-full max-w-[340px] overflow-hidden rounded-3xl border border-white/60 bg-white shadow-2xl shadow-black/20">

        {/* Header colorato */}
        <div className="bg-primary/[0.05] px-6 pt-6 pb-5 border-b border-border/20">
          <div className="mb-3.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/12">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <p className="text-[17px] font-bold tracking-tight text-foreground leading-snug">
            Scopri l&apos;app in 2 minuti
          </p>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            Un tour guidato per trovare subito tutto: navigazione, statistiche, impostazioni e come contattarmi.
          </p>
        </div>

        {/* Step preview */}
        <div className="px-6 py-4 flex flex-col gap-2.5">
          {[
            "🧭  Navigazione e sezioni",
            "📊  Statistiche e KPI",
            "⚙️  Personalizzazione",
            "💬  Come contattarmi",
          ].map((s) => (
            <div key={s} className="flex items-center gap-2.5 text-sm text-foreground/70">
              <span>{s}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2.5 border-t border-border/25 px-6 py-4">
          <button
            type="button"
            onClick={onSkip}
            className="flex-1 rounded-xl border border-border/60 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted/40"
          >
            Salta
          </button>
          <button
            type="button"
            onClick={onStart}
            className="flex-[2] rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground shadow-md shadow-primary/20 transition-opacity hover:opacity-90"
          >
            Inizia il tour →
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function DashboardTour({ autoStart }: { autoStart: boolean }) {
  const router     = useRouter()
  const pathname   = usePathname()
  const pendingRef = useRef(false)
  const markedRef  = useRef(false)

  const [showIntro,    setShowIntro]    = useState(false)
  const markOnDoneRef                   = useRef(false)

  function startDriverTour() {
    const isMobile = window.innerWidth < 768
    const allSteps = isMobile ? MOBILE_STEPS : DESKTOP_STEPS
    const steps    = allSteps.filter((s) => !s.element || document.querySelector(s.element))
    if (steps.length === 0) return

    const driverObj = driver({
      showProgress:     true,
      progressText:     "{{current}} di {{total}}",
      nextBtnText:      "Avanti →",
      prevBtnText:      "← Indietro",
      doneBtnText:      "Fine!",
      allowClose:       true,
      overlayColor:     "rgba(15, 23, 42, 0.38)",
      stagePadding:     8,
      stageRadius:      14,
      popoverClass:     "invigitrack-tour-popover",
      onPopoverRender:  (popover) => applyPopoverStyles(popover as unknown as Parameters<typeof applyPopoverStyles>[0]),
      onDestroyed: async () => {
        if (markOnDoneRef.current && !markedRef.current) {
          markedRef.current = true
          await markTourSeen()
          router.refresh()
        }
      },
      steps,
    })

    driverObj.drive()
  }

  function openIntro(markOnDone: boolean) {
    markOnDoneRef.current = markOnDone
    setShowIntro(true)
  }

  function handleStart() {
    setShowIntro(false)
    setTimeout(() => startDriverTour(), 150)
  }

  function handleSkip() {
    setShowIntro(false)
    if (markOnDoneRef.current && !markedRef.current) {
      markedRef.current = true
      markTourSeen().then(() => router.refresh())
    }
  }

  // Auto-start dopo il welcome dialog (welcome_seen=true, tour_seen=false)
  useEffect(() => {
    if (!autoStart) return
    const t = setTimeout(() => openIntro(true), 1500)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Ascolta evento globale (pulsante "Tour" in sidebar / mobile)
  useEffect(() => {
    function handler() {
      if (pathname === "/dashboard") {
        openIntro(false)
      } else {
        pendingRef.current = true
        router.push("/dashboard")
      }
    }
    window.addEventListener(OPEN_TOUR_EVENT, handler)
    return () => window.removeEventListener(OPEN_TOUR_EVENT, handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Avvia dopo navigazione a /dashboard
  useEffect(() => {
    if (pendingRef.current && pathname === "/dashboard") {
      pendingRef.current = false
      const t = setTimeout(() => openIntro(false), 400)
      return () => clearTimeout(t)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  if (!showIntro) return null
  return <TourIntroModal onStart={handleStart} onSkip={handleSkip} />
}
