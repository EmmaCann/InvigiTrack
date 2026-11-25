import type { Metadata } from "next"
import Image from "next/image"

export const metadata: Metadata = {
  title: "Area cliente",
  description: "Area cliente personale",
  robots: { index: false, follow: false },
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <div className="relative isolate min-h-dvh bg-[#f3f6fc] text-foreground">
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -right-40 -top-40 h-[640px] w-[640px] rounded-full bg-blue-300/25 blur-[120px]" />
      <div className="absolute -bottom-40 -left-40 h-[520px] w-[520px] rounded-full bg-indigo-200/25 blur-[110px]" />
    </div>
    <header className="border-b border-white/70 bg-white/65 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="" width={36} height={36} className="size-9 object-contain" />
          <span className="text-base font-bold tracking-tight text-primary">InvigiTrack</span>
        </div>
        <span className="text-xs font-semibold text-muted-foreground">Area cliente</span>
      </div>
    </header>
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">{children}</main>
  </div>
}
