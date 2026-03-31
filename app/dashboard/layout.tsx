import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/data/auth"
import { getProfileById } from "@/lib/data/profiles"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { MobileHeader } from "@/components/layout/mobile-header"
import { BottomNav } from "@/components/layout/bottom-nav"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/auth/login")

  const profile = await getProfileById(user.id)

  if (!profile) {
    return (
      <div className="relative flex min-h-[100dvh] items-center justify-center p-4 overflow-hidden">
        <GradientMesh />
        {children}
      </div>
    )
  }

  return (
    <div className="relative flex h-[100dvh] overflow-hidden">

      {/* ── Gradient mesh background ─────────────────────────────── */}
      <GradientMesh />

      {/* ── Sidebar — solo desktop ─────────────────────────────────── */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* ── Colonna destra ────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        <div className="hidden md:block">
          <Header profile={profile} />
        </div>

        <div className="md:hidden">
          <MobileHeader profile={profile} />
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>

        <div className="md:hidden">
          <BottomNav />
        </div>

      </div>
    </div>
  )
}

/** Sfondo con gradient blobs — si vede attraverso i vetri glass */
function GradientMesh() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Sfondo base — bianco caldo, professionale */}
      <div className="absolute inset-0 bg-[#f4f6fb]" />
      {/* Blob top-right — molto sottile */}
      <div className="absolute -right-40 -top-40 h-[700px] w-[700px] rounded-full bg-blue-300/[0.12] blur-[120px]" />
      {/* Blob bottom-left */}
      <div className="absolute -bottom-40 -left-40 h-[600px] w-[600px] rounded-full bg-indigo-200/[0.10] blur-[110px]" />
    </div>
  )
}
