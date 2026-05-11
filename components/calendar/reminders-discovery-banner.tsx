"use client"

import { useState } from "react"
import Link from "next/link"
import { Bell, X, Mail, Smartphone, MessageCircle } from "lucide-react"
import { dismissNotificationsBanner } from "@/app/actions/settings"

export function RemindersDiscoveryBanner() {
  const [dismissed, setDismissed] = useState(false)

  async function handleDismiss() {
    setDismissed(true)
    await dismissNotificationsBanner()
  }

  if (dismissed) return null

  return (
    <div className="relative overflow-hidden rounded-2xl border border-violet-200/60 bg-gradient-to-r from-violet-50 via-indigo-50 to-violet-50 px-5 py-4">
      {/* Decorazione sfondo */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-violet-200/30" />
      <div className="pointer-events-none absolute -bottom-4 right-16 h-16 w-16 rounded-full bg-indigo-200/20" />

      <div className="relative flex items-center gap-4">
        {/* Icona */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
          <Bell className="h-5 w-5" />
        </div>

        {/* Testo */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-violet-900">
            Vuoi che InvigiTrack ti ricordi gli eventi?
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
            <p className="text-xs text-violet-700/70">
              Ricevi reminder automatici via:
            </p>
            <span className="flex items-center gap-1 text-[11px] text-violet-600">
              <Mail className="h-3 w-3" /> Email
            </span>
            <span className="flex items-center gap-1 text-[11px] text-violet-600">
              <Smartphone className="h-3 w-3" /> Notifiche browser
            </span>
            <span className="flex items-center gap-1 text-[11px] text-violet-600">
              <MessageCircle className="h-3 w-3" /> Telegram
            </span>
          </div>
        </div>

        {/* CTA */}
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/dashboard/settings#notifiche"
            className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-violet-600/25 transition-colors hover:bg-violet-700"
          >
            Configura →
          </Link>
          <button
            type="button"
            onClick={handleDismiss}
            className="cursor-pointer rounded-lg p-1.5 text-violet-400 transition-colors hover:bg-violet-100 hover:text-violet-600"
            aria-label="Chiudi"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
