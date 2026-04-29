"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { CalendarClock, MapPin, Clock, BookOpen, ShieldCheck, MessageSquarePlus, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { NAV_ITEMS, SETTINGS_ITEM, isActiveRoute } from "./nav-items"
import { openHelpDialog, openDashboardTour } from "@/lib/help-events"
import { FeedbackDialog } from "@/components/feedback/feedback-dialog"
import type { CalendarEvent, PlatformRole } from "@/types/database"

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string
  label: string
  icon: React.ElementType
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative mx-3 my-0.5 flex items-center gap-3.5 rounded-lg border-r-[4px] px-3.5 py-3 text-[13px] font-semibold uppercase tracking-[0.07em] transition-all duration-200",
        active
          ? "border-primary bg-primary/[0.09] text-primary"
          : "border-transparent text-muted-foreground hover:bg-muted/80 hover:text-foreground"
      )}
    >
      <Icon
        className={cn(
          "h-[1.05rem] w-[1.05rem] shrink-0 transition-colors duration-200",
          active ? "text-primary" : "text-muted-foreground/60 group-hover:text-foreground"
        )}
        strokeWidth={active ? 2.35 : 1.85}
      />
      <span className="truncate">{label}</span>
    </Link>
  )
}

function formatShiftDate(dateStr: string): string {
  const today    = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  const todayStr    = today.toISOString().split("T")[0]
  const tomorrowStr = tomorrow.toISOString().split("T")[0]

  if (dateStr === todayStr)    return "Oggi"
  if (dateStr === tomorrowStr) return "Domani"

  const date = new Date(dateStr + "T00:00:00")
  const label = date.toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function Sidebar({
  nextEvent,
  platformRole,
}: {
  nextEvent?:    CalendarEvent | null
  platformRole?: PlatformRole
}) {
  const pathname = usePathname()
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  return (
    <aside data-tour="sidebar" className="glass-strong flex h-full w-64 shrink-0 flex-col border-r border-white/55 shadow-lg shadow-primary/[0.06]">

      {/* -- Logo --------------------------------------------------- */}
      <Link
        href="/dashboard"
        className="group flex items-center gap-3.5 border-b border-white/50 px-5 py-[1.1rem] transition-colors hover:bg-white/30"
      >
        <Image
          src="/logo.png"
          alt="InvigiTrack"
          width={64}
          height={70}
          className="shrink-0 object-contain drop-shadow-sm"
          priority
        />
        <div className="min-w-0 flex-1">
          <p className="text-[19px] font-bold tracking-tight text-primary">InvigiTrack</p>
          <div className="mt-2 h-[2px] w-10 rounded-full bg-gradient-to-r from-primary to-primary/30" />
        </div>
      </Link>

      {/* -- Nav ---------------------------------------------------- */}
      <nav className="flex-1 overflow-y-auto py-4">
        <p className="mb-2 px-6 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
          Menu
        </p>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={isActiveRoute(item.href, pathname)}
          />
        ))}

        <div className="mx-5 my-3 h-px bg-border/40" />

        <div data-tour="settings-nav">
          <NavLink
            href={SETTINGS_ITEM.href}
            label={SETTINGS_ITEM.label}
            icon={SETTINGS_ITEM.icon}
            active={isActiveRoute(SETTINGS_ITEM.href, pathname)}
          />
        </div>

        {/* Link pannello admin — solo super_admin */}
        {platformRole === "super_admin" && (
          <>
            <div className="mx-5 my-3 h-px bg-border/40" />
            <NavLink
              href="/dashboard/admin"
              label="Pannello Admin"
              icon={ShieldCheck}
              active={isActiveRoute("/dashboard/admin", pathname)}
            />
          </>
        )}
      </nav>

      {/* -- Tutorial / Tour / Feedback ----------------------------- */}
      <div className="mx-5 mb-3 h-px bg-border/40" />
      <div className="px-3 pb-3 space-y-0.5">
        <button
          type="button"
          onClick={() => openDashboardTour()}
          className="group flex w-full cursor-pointer items-center gap-3 rounded-lg px-3.5 py-2 text-sm text-muted-foreground/70 transition-colors hover:bg-white/50 hover:text-foreground"
        >
          <Sparkles className="h-4 w-4 shrink-0 transition-colors group-hover:text-primary" strokeWidth={1.7} />
          <span className="font-medium">Tour</span>
        </button>
        <button
          type="button"
          onClick={() => openHelpDialog()}
          className="group flex w-full cursor-pointer items-center gap-3 rounded-lg px-3.5 py-2 text-sm text-muted-foreground/70 transition-colors hover:bg-white/50 hover:text-foreground"
        >
          <BookOpen className="h-4 w-4 shrink-0 transition-colors group-hover:text-primary" strokeWidth={1.7} />
          <span className="font-medium">Tutorial</span>
        </button>
        <button
          data-tour="feedback-btn"
          type="button"
          onClick={() => setFeedbackOpen(true)}
          className="group flex w-full cursor-pointer items-center gap-3 rounded-lg px-3.5 py-2 text-sm text-muted-foreground/70 transition-colors hover:bg-white/50 hover:text-foreground"
        >
          <MessageSquarePlus className="h-4 w-4 shrink-0 transition-colors group-hover:text-primary" strokeWidth={1.7} />
          <span className="font-medium">Invia feedback</span>
        </button>
      </div>
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />

      {/* -- Next Shift --------------------------------------------- */}
      <div className="px-3 pb-8">
        <Link data-tour="next-shift" href="/dashboard/calendar" className="block rounded-xl border border-border/50 bg-muted/50 px-4 py-4 transition-colors hover:border-primary/30 hover:bg-primary/5">
          <div className="mb-1.5 flex items-center gap-1.5">
            <CalendarClock className="h-3 w-3 text-muted-foreground" />
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Next Shift
            </p>
          </div>
          {nextEvent ? (
            <>
              <p className="text-sm font-bold text-foreground">{formatShiftDate(nextEvent.event_date)}</p>
              <p className="truncate text-sm font-semibold text-foreground">{nextEvent.title}</p>
              {(nextEvent.start_time || nextEvent.end_time) && (
                <div className="mt-0.5 flex items-center gap-1">
                  <Clock className="h-3 w-3 shrink-0 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    {nextEvent.start_time ? nextEvent.start_time.slice(0, 5) : ""}
                    {nextEvent.start_time && nextEvent.end_time ? " – " : ""}
                    {nextEvent.end_time ? nextEvent.end_time.slice(0, 5) : ""}
                  </p>
                </div>
              )}
              {nextEvent.location && (
                <div className="mt-0.5 flex items-center gap-1">
                  <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">{nextEvent.location}</p>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground">Nessun turno in programma</p>
          )}
        </Link>
      </div>

    </aside>
  )
}
