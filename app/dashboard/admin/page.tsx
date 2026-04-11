import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/data/auth"
import { getProfileById } from "@/lib/data/profiles"
import { getAllNotifications } from "@/lib/data/notifications"
import { getAllFeedback } from "@/lib/data/feedback"
import { CreateNotificationForm } from "@/components/admin/create-notification-form"
import { FeedbackInbox } from "@/components/admin/feedback-inbox"
import { ShieldCheck, Bell, Inbox } from "lucide-react"

export default async function AdminPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/auth/login")

  const profile = await getProfileById(user.id)
  if (!profile || profile.platform_role !== "super_admin") redirect("/dashboard")

  const [notifications, feedbackList] = await Promise.all([
    getAllNotifications(),
    getAllFeedback(),
  ])

  const newFeedbackCount = feedbackList.filter((f) => f.status === "new").length

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Pannello Admin</h2>
          <p className="text-sm text-muted-foreground">Gestione notifiche e feedback utenti</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">

        {/* -- Sinistra: Feedback inbox -------------------------------- */}
        <div className="glass-dashboard rounded-2xl px-5 pt-5 pb-6">
          <div className="mb-5 flex items-center gap-2">
            <Inbox className="h-4 w-4 text-primary" />
            <h3 className="text-base font-semibold text-foreground">Feedback ricevuti</h3>
            {newFeedbackCount > 0 && (
              <span className="ml-auto flex h-6 items-center rounded-full bg-red-500 px-2 text-[10px] font-bold text-white">
                {newFeedbackCount} nuovi
              </span>
            )}
          </div>
          <FeedbackInbox initialFeedback={feedbackList} />
        </div>

        {/* -- Destra: Crea notifica ----------------------------------- */}
        <div className="glass-dashboard rounded-2xl px-5 pt-5 pb-6">
          <div className="mb-5 flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <h3 className="text-base font-semibold text-foreground">Invia notifica</h3>
          </div>
          <CreateNotificationForm />

          {/* Notifiche inviate di recente */}
          {notifications.length > 0 && (
            <div className="mt-6">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Ultime inviate
              </p>
              <ul className="space-y-2">
                {notifications.slice(0, 5).map((n) => (
                  <li key={n.id} className="rounded-xl border border-border/40 bg-white/50 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">{n.title}</p>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {n.target_type === "all"  && "Tutti"}
                        {n.target_type === "role" && `Ruolo: ${n.target_role}`}
                        {n.target_type === "user" && "Diretto"}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{n.message}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
