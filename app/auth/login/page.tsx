import { AuthForm } from "@/components/auth/auth-form"
import Image from "next/image"

export default function LoginPage() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center p-4"
      style={{
        background: `
          radial-gradient(ellipse 80% 50% at 50% -10%, oklch(0.50 0.22 258 / 0.12), transparent),
          oklch(0.975 0.007 258)
        `,
      }}
    >
      {/* ── Logo ──────────────────────────────────────────────────────── */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <Image src="/logo.png" alt="InvigiTrack" width={48} height={53} priority />
        <div className="text-center">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            InvigiTrack
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestione Sorveglianza Accademica
          </p>
        </div>
      </div>

      {/* ── Form ──────────────────────────────────────────────────────── */}
      <AuthForm />

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <p className="mt-8 text-xs text-muted-foreground">
        © {new Date().getFullYear()} InvigiTrack · Tutti i diritti riservati
      </p>
    </main>
  )
}
