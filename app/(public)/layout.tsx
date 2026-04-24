import Link from "next/link"
import Image from "next/image"

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      {/* Header minimalista */}
      <header className="border-b border-border/40 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="InvigiTrack" width={28} height={32} className="object-contain" />
            <span className="text-base font-bold text-primary">InvigiTrack</span>
          </Link>
          <span className="text-border">·</span>
          <nav className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/terms"   className="hover:text-foreground transition-colors">Termini</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          </nav>
        </div>
      </header>

      {/* Contenuto */}
      <main className="mx-auto max-w-3xl px-6 py-12">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8 text-center text-xs text-muted-foreground/60">
        <p>InvigiTrack — progetto personale, fatto con ☕ e troppo tempo libero.</p>
        <div className="mt-2 flex justify-center gap-4">
          <Link href="/terms"   className="hover:text-muted-foreground transition-colors">Termini</Link>
          <Link href="/privacy" className="hover:text-muted-foreground transition-colors">Privacy</Link>
          <Link href="/auth/login" className="hover:text-muted-foreground transition-colors">Accedi</Link>
        </div>
      </footer>
    </div>
  )
}
