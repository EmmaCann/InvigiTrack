"use client"

import { useState, useRef, useEffect } from "react"
import { Bell, Info, Wrench, AlertTriangle, MessageSquare, X } from "lucide-react"
import { getNotificationsAction, markNotificationsReadAction } from "@/app/actions/notifications"
import type { NotificationWithRead, NotificationType } from "@/types/database"
import { cn } from "@/lib/utils"

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (m < 1) return "Adesso"
  if (m < 60) return `${m}min fa`
  if (h < 24) return `${h}h fa`
  if (d < 7) return `${d}g fa`
  return new Date(dateStr).toLocaleDateString("it-IT", { day: "numeric", month: "short" })
}

const TYPE_CONFIG: Record<NotificationType, { icon: React.ElementType; color: string; bg: string }> = {
  system:            { icon: Info,          color: "text-blue-600",   bg: "bg-blue-50"   },
  update:            { icon: Wrench,        color: "text-emerald-600", bg: "bg-emerald-50" },
  maintenance:       { icon: AlertTriangle, color: "text-amber-600",  bg: "bg-amber-50"  },
  feedback_received: { icon: MessageSquare, color: "text-violet-600", bg: "bg-violet-50" },
}

interface Props {
  initialUnreadCount: number
}

export function NotificationBell({ initialUnreadCount }: Props) {
  const [open,          setOpen]          = useState(false)
  const [unreadCount,   setUnreadCount]   = useState(initialUnreadCount)
  const [notifications, setNotifications] = useState<NotificationWithRead[]>([])
  const [loading,       setLoading]       = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Chiudi cliccando fuori
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  async function handleOpen() {
    if (open) { setOpen(false); return }
    setOpen(true)
    setLoading(true)
    const res = await getNotificationsAction()
    setLoading(false)
    if (res.notifications) {
      setNotifications(res.notifications)
      // Segna come lette ottimisticamente
      if (unreadCount > 0) {
        setUnreadCount(0)
        markNotificationsReadAction()
      }
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-white/75 bg-white/45 text-muted-foreground shadow-sm backdrop-blur-md transition-all hover:bg-white/65 hover:text-foreground"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-80 rounded-2xl border border-border/60 bg-white shadow-xl shadow-black/[0.10] sm:w-96">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Notifiche</p>
            <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-muted-foreground hover:bg-muted">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Bell className="mb-2 h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Nessuna notifica</p>
              </div>
            ) : (
              <ul className="divide-y divide-border/30">
                {notifications.map((n) => {
                  const conf = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.system
                  const Icon = conf.icon
                  return (
                    <li
                      key={n.id}
                      className={cn(
                        "flex gap-3 px-4 py-3.5 transition-colors",
                        !n.is_read && "bg-primary/[0.03]",
                      )}
                    >
                      <div className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", conf.bg)}>
                        <Icon className={cn("h-3.5 w-3.5", conf.color)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn("text-sm font-semibold leading-snug", !n.is_read ? "text-foreground" : "text-foreground/80")}>
                            {n.title}
                          </p>
                          {!n.is_read && (
                            <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
                        <p className="mt-1 text-[10px] text-muted-foreground/60">{timeAgo(n.created_at)}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
