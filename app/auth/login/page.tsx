import { AuthForm } from "@/components/auth/auth-form"
import { ClipboardList } from "lucide-react"

export default function LoginPage() {
  return (
    /*
     * Layout a tutta altezza con sfondo leggermente texturizzato.
     * La texture è creata con un pattern SVG inline via background-image.
     * Niente librerie extra — CSS puro.
     */
    <main
      className="flex min-h-screen flex-col items-center justify-center p-4"
      style={{
        background: `
          radial-gradient(ellipse 80% 50% at 50% -10%, oklch(0.52 0.13 177 / 0.12), transparent),
          oklch(0.965 0.003 240)
        `,
      }}
    >
      {/* ── Logo ──────────────────────────────────────────────────────── */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
          <ClipboardList className="h-6 w-6 text-primary-foreground" />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            InvigiTrack
          </h1>
          <p className="text-sm text-muted-foreground">
            Academic Invigilation Management
          </p>
        </div>
      </div>

      {/* ── Form ──────────────────────────────────────────────────────── */}
      <AuthForm />

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <p className="mt-8 text-xs text-muted-foreground">
        © {new Date().getFullYear()} InvigiTrack · All rights reserved
      </p>
    </main>
  )
}
