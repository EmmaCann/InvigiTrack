"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { markWelcomeSeen } from "@/app/actions/settings"

export function WelcomeDialog() {
  const router  = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClose() {
    setLoading(true)
    await markWelcomeSeen()
    router.refresh()
  }

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Card */}
      <div className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/60 bg-white/95 shadow-2xl shadow-black/20 backdrop-blur-2xl" style={{ maxHeight: "90dvh" }}>

        {/* Header */}
        <div className="border-b border-border/30 bg-primary/[0.04] px-7 py-6">
          <p className="text-2xl font-bold tracking-tight text-foreground">
            Benvenuto in InvigiTrack 👀
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Emma ti dà il benvenuto nel suo nuovo progetto personale. Giusto due minuti di lettura, poi sei dentro.
          </p>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto space-y-5 px-7 py-6 text-sm text-foreground/80 leading-relaxed">

          {/* Cos'è */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-primary">Cos'è questo posto</p>
            <p>
              Hai ricevuto il link da qualcuno che ti vuole bene, o forse da qualcuno che vuole semplicemente che tu
              smetta di usare Excel per tenere traccia delle ore. <strong className="text-foreground">InvigiTrack</strong> è
              un'app personale che ho costruito per me e per amici: tiene traccia di sessioni di lavoro, pagamenti e
              turni futuri. Niente di più, niente di meno.
            </p>
          </div>

          {/* URL */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600">Una cosa sull'indirizzo</p>
            <p>
              L'URL non è esattamente memorabile, lo so. Ho preferito non pagare un dominio per un progetto
              personale che condivido solo con persone di cui mi fido. Se sei qui è perché qualcuno ti ha
              mandato il link direttamente, quindi puoi stare tranquillo/a.
            </p>
          </div>

          {/* Consiglio da amica */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Consiglio da amica 💻
            </p>
            <p>
              L'app è progettata e ottimizzata per il <strong className="text-foreground">computer</strong>:
              più spazio, più controllo, esperienza migliore. Se puoi, usala da PC.
            </p>
            <p>
              Detto questo, esiste anche una versione mobile completa, così l'hai sempre a portata di mano.
              Per usarla come un'app vera senza doverla cercare ogni volta nel browser, aggiungila alla schermata home:
            </p>
            <ul className="space-y-1 list-none">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0">🍎</span>
                <span><strong className="text-foreground">iPhone:</strong> Safari, poi icona di condivisione, poi "Aggiungi alla schermata Home"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0">🤖</span>
                <span><strong className="text-foreground">Android:</strong> Chrome, poi menu in alto a destra, poi "Aggiungi alla schermata Home"</span>
              </li>
            </ul>
          </div>

          {/* Privacy mini */}
          <div className="rounded-xl border border-border/40 bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
            I tuoi dati stanno su Supabase, protetti da autenticazione. Li vedo solo io, e onestamente ho
            cose migliori da fare che guardare i tuoi turni 😉{" "}
            <Link href="/terms" target="_blank" className="font-medium text-primary hover:underline">Termini</Link>
            {" "}·{" "}
            <Link href="/privacy" target="_blank" className="font-medium text-primary hover:underline">Privacy</Link>
          </div>

        </div>

        {/* Footer */}
        <div className="border-t border-border/30 bg-muted/20 px-7 py-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-md shadow-primary/25 transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Un attimo…</>
              : "Capito, entriamo →"
            }
          </button>
        </div>

      </div>
    </div>
  )
}
