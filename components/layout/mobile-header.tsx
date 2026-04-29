"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import {
  LogOut, Settings, ChevronDown, ShieldCheck,
  Search, Check, Plus, ArrowLeft, BookOpen, MessageSquarePlus, ShieldAlert, Sparkles,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { logout } from "@/app/actions/auth"
import { switchWorkspace, addWorkspace } from "@/app/actions/workspace"
import { openDashboardSearch } from "@/components/layout/dashboard-search-layer"
import { openHelpDialog, openDashboardTour } from "@/lib/help-events"
import { NotificationBell } from "@/components/layout/notification-bell"
import { FeedbackDialog } from "@/components/feedback/feedback-dialog"
import { cn } from "@/lib/utils"
import type { Profile, UserWorkspace, WorkCategory } from "@/types/database"

function getInitials(profile: Profile): string {
  if (profile.full_name) {
    return profile.full_name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
  }
  return profile.email[0].toUpperCase()
}

function WorkspaceIcon({ ws, active = false }: { ws: UserWorkspace; active?: boolean }) {
  return (
    <span
      className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded text-[11px] font-bold",
        ws.color ? "" : active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
      )}
      style={ws.color ? { backgroundColor: ws.color, color: "#fff" } : undefined}
    >
      {ws.emoji ?? ws.label[0].toUpperCase()}
    </span>
  )
}

interface Props {
  profile:              Profile
  activeWorkspace:      UserWorkspace
  userCategories:       UserWorkspace[]
  availableCategories:  WorkCategory[]
  unreadNotifications?: number
  platformRole?:        Profile["platform_role"]
}

export function MobileHeader({
  profile,
  activeWorkspace,
  userCategories,
  availableCategories,
  unreadNotifications = 0,
}: Props) {
  const platformRole = profile.platform_role
  const [addingWorkspace,  setAddingWorkspace]  = useState(false)
  const [newName,          setNewName]          = useState("")
  const [selectedCat,      setSelectedCat]      = useState("")
  const [loadingId,        setLoadingId]        = useState<string | null>(null)
  const [feedbackOpen,     setFeedbackOpen]     = useState(false)

  function resetAddForm() {
    setAddingWorkspace(false)
    setNewName("")
    setSelectedCat("")
  }

  return (
    <>
      <header data-tour="mobile-header" className="glass flex h-14 shrink-0 items-center justify-between border-b border-white/40 px-4">

        {/* Logo — stile identico sidebar desktop */}
        <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
          <Image src="/logo.png" alt="InvigiTrack" width={36} height={40} className="shrink-0 object-contain drop-shadow-sm" priority />
          <div className="min-w-0">
            <p className="text-[17px] font-bold tracking-tight text-primary leading-none">InvigiTrack</p>
            <div className="mt-1 h-[2px] w-8 rounded-full bg-gradient-to-r from-primary to-primary/30" />
          </div>
        </Link>

        <div className="flex items-center gap-1.5">

          {/* Cerca */}
          <button
            onClick={() => openDashboardSearch()}
            aria-label="Cerca"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/70 bg-white/40 text-muted-foreground shadow-sm backdrop-blur-md transition-colors hover:text-foreground"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Admin badge */}
          {profile.platform_role === "admin" && (
            <Badge variant="secondary" className="gap-1 text-[10px] bg-primary/10 text-primary border-primary/20">
              <ShieldCheck className="h-3 w-3" />
            </Badge>
          )}

          {/* Notifiche */}
          <NotificationBell initialUnreadCount={unreadNotifications} />

          {/* Avatar → DropdownMenu identico al desktop */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-8 items-center gap-1.5 rounded-xl px-1.5 hover:bg-white/60 transition-colors">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-sm shadow-primary/30">
                  {getInitials(profile)}
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56 border-border/60 bg-white shadow-lg shadow-black/[0.08]">
              <DropdownMenuLabel className="font-normal">
                <p className="text-sm font-semibold">{profile.full_name ?? "Utente"}</p>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{profile.email}</p>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              {/* Workspace */}
              {!addingWorkspace ? (
                <>
                  {userCategories.map((cat) => (
                    <DropdownMenuItem key={cat.workspaceId} asChild>
                      <form action={switchWorkspace.bind(null, cat.workspaceId)} className="w-full">
                        <button type="submit" className="flex w-full cursor-pointer items-center gap-2.5 px-2 py-2 text-sm">
                          <WorkspaceIcon ws={cat} active={cat.workspaceId === activeWorkspace.workspaceId} />
                          <span className={cn(
                            "flex-1 text-left text-sm",
                            cat.workspaceId === activeWorkspace.workspaceId ? "font-semibold text-foreground" : "text-foreground/80",
                          )}>
                            {cat.label}
                          </span>
                          {cat.workspaceId === activeWorkspace.workspaceId && (
                            <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                          )}
                        </button>
                      </form>
                    </DropdownMenuItem>
                  ))}

                  {availableCategories.length > 0 && profile.platform_role !== "user" && (
                    <DropdownMenuItem asChild>
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); setAddingWorkspace(true) }}
                        className="flex w-full cursor-pointer items-center gap-2.5 px-2 py-2 text-sm text-primary"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-dashed border-primary/40 bg-primary/5">
                          <Plus className="h-3.5 w-3.5 text-primary/70" />
                        </span>
                        <span className="font-medium">Nuovo workspace</span>
                      </button>
                    </DropdownMenuItem>
                  )}
                </>
              ) : (
                <div className="space-y-3 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={resetAddForm}
                      className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </button>
                    <p className="text-[11px] font-semibold text-foreground">Nuovo workspace</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-medium text-muted-foreground">Nome</p>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="es. Cambridge Invigilation"
                      className="w-full rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-medium text-muted-foreground">Tipo di lavoro</p>
                    <div className="space-y-1">
                      {availableCategories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCat(cat.id === selectedCat ? "" : cat.id)}
                          className={cn(
                            "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                            selectedCat === cat.id ? "bg-primary/10 text-primary ring-1 ring-primary/20" : "text-foreground/80 hover:bg-muted",
                          )}
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-[11px] font-bold text-muted-foreground">
                            {cat.label[0].toUpperCase()}
                          </span>
                          <span className="flex-1 text-left">{cat.label}</span>
                          {selectedCat === cat.id && <Check className="h-3.5 w-3.5 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={!newName.trim() || !selectedCat || !!loadingId}
                    onClick={async () => {
                      const cat = availableCategories.find((c) => c.id === selectedCat)
                      if (!cat) return
                      setLoadingId(cat.id)
                      await addWorkspace(cat.id, newName.trim())
                      setLoadingId(null)
                      resetAddForm()
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
                  >
                    {loadingId
                      ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      : <Plus className="h-4 w-4" />
                    }
                    Crea workspace
                  </button>
                </div>
              )}

              <DropdownMenuSeparator />

              {/* Account */}
              <DropdownMenuItem asChild>
                <a href="/dashboard/settings" className="flex cursor-pointer items-center gap-2">
                  <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm">Impostazioni</span>
                </a>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onSelect={(e) => { e.preventDefault(); openDashboardTour() }}
                className="flex cursor-pointer items-center gap-2"
              >
                <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm">Tour</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onSelect={(e) => { e.preventDefault(); openHelpDialog() }}
                className="flex cursor-pointer items-center gap-2"
              >
                <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm">Tutorial</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onSelect={(e) => { e.preventDefault(); setFeedbackOpen(true) }}
                className="flex cursor-pointer items-center gap-2"
              >
                <MessageSquarePlus className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm">Invia feedback</span>
              </DropdownMenuItem>

              {platformRole === "super_admin" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a href="/dashboard/admin" className="flex cursor-pointer items-center gap-2">
                      <ShieldAlert className="h-3.5 w-3.5 text-violet-500" />
                      <span className="text-sm font-medium text-violet-700">Pannello Admin</span>
                    </a>
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <form action={logout} className="w-full">
                  <button type="submit" className="flex w-full items-center gap-2 text-destructive">
                    <LogOut className="h-3.5 w-3.5" />
                    <span className="text-sm">Esci</span>
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </header>

      {/* Feedback dialog in modalità controllata */}
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </>
  )
}
