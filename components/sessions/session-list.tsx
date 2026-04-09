"use client"

import { useState, useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Trash2,
  MapPin,
  CalendarCheck,
  Download,
  Clock,
  ChevronRight,
  Check,
  Search,
  Calendar,
  ChevronDown,
  X,
  CreditCard,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SessionDialog } from "./session-dialog"
import { changePaymentStatus, removeSession } from "@/app/actions/sessions"
import { cn } from "@/lib/utils"
import type { Session, Profile, PaymentStatus } from "@/types/database"

// --- Helpers ------------------------------------------------------------------

function formatHours(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

const STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; className: string; dot: string; leftAccent: string }
> = {
  unpaid: {
    label: "Non pagato",
    className: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
    dot: "bg-amber-400",
    leftAccent: "border-l-[3px] border-l-amber-400",
  },
  pending: {
    label: "In attesa",
    className: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
    dot: "bg-blue-400",
    leftAccent: "border-l-[3px] border-l-blue-400",
  },
  paid: {
    label: "Pagato",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
    dot: "bg-emerald-400",
    leftAccent: "border-l-[3px] border-l-emerald-400",
  },
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("it-IT", {
    weekday: "short",
    day:     "numeric",
    month:   "short",
  })
}

function formatTime(t: string) { return t.slice(0, 5) }

function formatMonthKey(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("it-IT", {
    month: "long",
    year:  "numeric",
  })
}

function groupByMonth(sessions: Session[]) {
  const map = new Map<string, Session[]>()
  for (const s of sessions) {
    const key = formatMonthKey(s.session_date)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(s)
  }
  return map
}

function totalStats(sessions: Session[]) {
  return {
    count:  sessions.length,
    hours:  sessions.reduce((a, s) => a + s.duration_minutes / 60, 0),
    earned: sessions.reduce((a, s) => a + s.earned, 0),
    unpaid: sessions.filter((s) => s.payment_status !== "paid").reduce((a, s) => a + s.earned, 0),
  }
}

function exportCSV(sessions: Session[]) {
  const headers = ["Data","Inizio","Fine","Durata (min)","Sede","Esame","Ruolo","Tariffa (€)","Guadagno (€)","Stato"]
  const rows = sessions.map((s) => {
    const meta = s.metadata as { exam_name?: string; role_type?: string }
    return [
      s.session_date,
      formatTime(s.start_time),
      formatTime(s.end_time),
      s.duration_minutes,
      s.location ?? "",
      meta.exam_name ?? "",
      meta.role_type ?? "",
      s.hourly_rate.toFixed(2),
      s.earned.toFixed(2),
      s.payment_status,
    ]
  })
  const csv  = [headers, ...rows].map((r) => r.join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement("a"), { href: url, download: `sessioni-${todayStr()}.csv` })
  a.click()
  URL.revokeObjectURL(url)
}

function todayStr() { return new Date().toISOString().split("T")[0] }

type DateRange = "all" | "30d" | "3m" | "1y"

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  all:  "Tutto il periodo",
  "30d": "Ultimi 30 giorni",
  "3m":  "Ultimi 3 mesi",
  "1y":  "Quest'anno",
}

const PAGE_SIZE = 10

// --- Props --------------------------------------------------------------------

interface Props {
  sessions:     Session[]
  profile:      Profile
  categorySlug: string
}

// --- Componente --------------------------------------------------------------

export function SessionList({ sessions, profile, categorySlug }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmId, setConfirmId]   = useState<string | null>(null)

  // -- Filtri ------------------------------------------------------------------
  const [search,         setSearch]         = useState("")
  const [dateRange,      setDateRange]      = useState<DateRange>("all")
  const [locationFilter, setLocationFilter] = useState("all")
  const [statusFilter,   setStatusFilter]   = useState<"all" | PaymentStatus>("all")
  const [page,           setPage]           = useState(0)

  function resetPage<T>(setter: React.Dispatch<React.SetStateAction<T>>) {
    return (v: T) => { setter(v); setPage(0) }
  }

  const locations = useMemo(
    () => Array.from(new Set(sessions.map((s) => s.location).filter(Boolean) as string[])).sort(),
    [sessions],
  )

  const filtered = useMemo(() => {
    let result = sessions

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter((s) => {
        const meta = s.metadata as { exam_name?: string }
        return (
          (meta.exam_name ?? "").toLowerCase().includes(q) ||
          (s.location ?? "").toLowerCase().includes(q) ||
          (s.notes ?? "").toLowerCase().includes(q)
        )
      })
    }

    if (dateRange !== "all") {
      const cutoff = new Date()
      if (dateRange === "30d") cutoff.setDate(cutoff.getDate() - 30)
      if (dateRange === "3m")  cutoff.setMonth(cutoff.getMonth() - 3)
      if (dateRange === "1y")  cutoff.setFullYear(cutoff.getFullYear() - 1)
      result = result.filter((s) => new Date(s.session_date + "T00:00:00") >= cutoff)
    }

    if (locationFilter !== "all") {
      result = result.filter((s) => s.location === locationFilter)
    }

    if (statusFilter !== "all") {
      result = result.filter((s) => s.payment_status === statusFilter)
    }

    return result
  }, [sessions, search, dateRange, locationFilter, statusFilter])

  const totalPages  = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated   = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const grouped     = groupByMonth(paginated)
  const stats       = totalStats(filtered)
  const hasFilters  = !!(search || dateRange !== "all" || locationFilter !== "all" || statusFilter !== "all")

  function clearFilters() {
    setSearch("")
    setDateRange("all")
    setLocationFilter("all")
    setStatusFilter("all")
    setPage(0)
  }

  // -- Actions -----------------------------------------------------------------
  function handleStatusChange(session: Session, next: PaymentStatus) {
    startTransition(async () => {
      await changePaymentStatus(session.id, next)
      router.refresh()
    })
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    await removeSession(id)
    setDeletingId(null)
    setConfirmId(null)
    router.refresh()
  }

  // -- Empty state ------------------------------------------------------------
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/50 glass-sm py-24 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <CalendarCheck className="h-7 w-7 text-primary" />
        </div>
        <p className="text-base font-semibold text-foreground">Nessuna sessione</p>
        <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
          Registra la prima sessione con il pulsante <strong>Nuova Sessione</strong> in alto.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* -- Stats ---------------------------------------------------- */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Totale sessioni", value: `${stats.count}`,              sub: "filtrate",  color: "text-foreground"  },
          { label: "Ore totali",      value: formatHours(stats.hours),       sub: "lavorate",  color: "text-blue-600"    },
          { label: "Guadagno",        value: `€${stats.earned.toFixed(2)}`, sub: "totale",    color: "text-emerald-600" },
          { label: "Non pagato",      value: `€${stats.unpaid.toFixed(2)}`, sub: "in attesa", color: "text-amber-600"   },
        ].map((s) => (
          <div key={s.label} className="glass-dashboard rounded-2xl px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{s.label}</p>
            <p className={`mt-1 text-[1.45rem] font-bold leading-tight tabular-nums ${s.color}`}>{s.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.sub}</p>
          </div>
        ))}
      </div>
      <div className="pt-12 space-y-5">
      {/* -- Azioni rapide ------------------------------------------------ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{filtered.length} sessioni filtrate</span>
        </div>
        <button
          onClick={() => exportCSV(filtered)}
          className="flex cursor-pointer items-center gap-2 rounded-xl border border-border/50 bg-white/70 px-4 py-2 text-xs font-semibold text-muted-foreground shadow-sm transition-all hover:bg-white hover:text-foreground hover:shadow-md"
        >
          <Download className="h-3.5 w-3.5" />
          Esporta CSV
        </button>
      </div>
      {/* -- Filter bar — glass unificata ----------------------------- */}
      <div className="glass-dashboard flex items-center divide-x divide-border/30 overflow-hidden rounded-2xl">
        {/* Search */}
        <div className="flex min-w-0 flex-1 items-center gap-2.5 px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground/60" />
          <input
            type="text"
            placeholder="Cerca sessioni, esami, sedi…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
          />
          {search && (
            <button onClick={() => { setSearch(""); setPage(0) }} className="cursor-pointer">
              <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        {/* Date range */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap px-4 py-3 text-xs text-muted-foreground transition-colors hover:bg-white/40 hover:text-foreground">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">{DATE_RANGE_LABELS[dateRange]}</span>
              <ChevronDown className="h-3 w-3 shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 border-border/60 bg-white shadow-lg shadow-black/[0.08]">
            {(Object.entries(DATE_RANGE_LABELS) as [DateRange, string][]).map(([v, l]) => (
              <DropdownMenuItem key={v} onClick={() => { setDateRange(v); setPage(0) }} className="flex cursor-pointer items-center justify-between text-xs">
                {l} {dateRange === v && <Check className="h-3 w-3 text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Location */}
        {locations.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap px-4 py-3 text-xs text-muted-foreground transition-colors hover:bg-white/40 hover:text-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline max-w-[100px] truncate">
                  {locationFilter === "all" ? "Tutte le sedi" : locationFilter}
                </span>
                <ChevronDown className="h-3 w-3 shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 border-border/60 bg-white shadow-lg shadow-black/[0.08]">
              <DropdownMenuItem onClick={() => { setLocationFilter("all"); setPage(0) }} className="flex cursor-pointer items-center justify-between text-xs">
                Tutte le sedi {locationFilter === "all" && <Check className="h-3 w-3 text-primary" />}
              </DropdownMenuItem>
              {locations.map((l) => (
                <DropdownMenuItem key={l} onClick={() => { setLocationFilter(l); setPage(0) }} className="flex cursor-pointer items-center justify-between text-xs">
                  {l} {locationFilter === l && <Check className="h-3 w-3 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Payment status */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap px-4 py-3 text-xs text-muted-foreground transition-colors hover:bg-white/40 hover:text-foreground">
              <CreditCard className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">
                {statusFilter === "all" ? "Tutti gli stati" : STATUS_CONFIG[statusFilter].label}
              </span>
              <ChevronDown className="h-3 w-3 shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 border-border/60 bg-white shadow-lg shadow-black/[0.08]">
            <DropdownMenuItem onClick={() => { setStatusFilter("all"); setPage(0) }} className="flex cursor-pointer items-center justify-between text-xs">
              Tutti gli stati {statusFilter === "all" && <Check className="h-3 w-3 text-primary" />}
            </DropdownMenuItem>
            {(["unpaid", "pending", "paid"] as PaymentStatus[]).map((s) => (
              <DropdownMenuItem key={s} onClick={() => { setStatusFilter(s); setPage(0) }} className="flex cursor-pointer items-center justify-between text-xs">
                {STATUS_CONFIG[s].label} {statusFilter === s && <Check className="h-3 w-3 text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex cursor-pointer items-center gap-1 px-3 py-3 text-xs text-muted-foreground transition-colors hover:bg-white/40 hover:text-destructive"
            title="Rimuovi filtri"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

      </div>

      {/* -- Lista raggruppata ---------------------------------------- */}
      {paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm font-medium text-foreground">Nessuna sessione trovata</p>
          <p className="mt-1 text-xs text-muted-foreground">Prova a modificare i filtri di ricerca.</p>
          <button onClick={clearFilters} className="mt-3 cursor-pointer text-xs font-semibold text-primary hover:underline">
            Rimuovi filtri
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {Array.from(grouped.entries()).map(([month, items]) => {
            const monthTotal = items.reduce((a, s) => a + s.earned, 0)
            const monthHours = items.reduce((a, s) => a + s.duration_minutes / 60, 0)

            return (
              <div key={month}>
                {/* Month header */}
                <div className="mb-3 flex items-center gap-3">
                  <h3 className="text-sm font-bold text-foreground capitalize">{month}</h3>
                  <div className="h-px flex-1 bg-border" />
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatHours(monthHours)}
                    </span>
                    <ChevronRight className="h-3 w-3" />
                    <span className="font-semibold text-foreground">€{monthTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Session cards */}
                <div className="space-y-2">
                  {items.map((session) => {
                    const meta       = session.metadata as { exam_name?: string; role_type?: string }
                    const statusConf = STATUS_CONFIG[session.payment_status]
                    const isConf     = confirmId === session.id
                    const isDel      = deletingId === session.id

                    return (
                      <div
                        key={session.id}
                        className={cn(
                          "group relative flex flex-col gap-3 overflow-hidden rounded-2xl glass-card ring-1 ring-white/60 px-4 py-3.5 pl-5 transition-all hover:shadow-md hover:shadow-primary/[0.06] sm:flex-row sm:items-center",
                          statusConf.leftAccent,
                        )}
                      >
                        {/* Left: info */}
                        <div className="flex min-w-0 flex-1 flex-col gap-1 pl-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-foreground truncate">
                              {meta.exam_name ?? "Sessione"}
                            </span>
                            <span className="rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-medium capitalize text-muted-foreground">
                              {meta.role_type ?? profile.role_type}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                            <span className="capitalize">{formatDate(session.session_date)}</span>
                            <span className="text-border">·</span>
                            <span>{formatTime(session.start_time)} – {formatTime(session.end_time)}</span>
                            <span className="text-border">·</span>
                            <span className="font-medium text-foreground/70">
                              {Math.floor(session.duration_minutes / 60) > 0
                                ? `${Math.floor(session.duration_minutes / 60)}h${session.duration_minutes % 60 > 0 ? ` ${session.duration_minutes % 60}min` : ""}`
                                : `${session.duration_minutes}min`
                              }
                            </span>
                            {session.location && (
                              <>
                                <span className="text-border">·</span>
                                <span className="flex items-center gap-0.5">
                                  <MapPin className="h-3 w-3" />
                                  {session.location}
                                </span>
                              </>
                            )}
                          </div>
                          {session.notes && (
                            <p className="text-xs text-muted-foreground/80 italic mt-0.5">
                              {session.notes}
                            </p>
                          )}
                        </div>

                        {/* Right: earned + status + actions */}
                        <div className="flex items-center gap-3">
                          <span className="text-base font-bold text-foreground tabular-nums">
                            €{session.earned.toFixed(2)}
                          </span>

                          {/* Payment status dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer ${statusConf.className}`}
                              >
                                <span className={`h-1.5 w-1.5 rounded-full ${statusConf.dot}`} />
                                {statusConf.label}
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-36 border-border/60 bg-white shadow-lg shadow-black/[0.08]">
                              {(["unpaid", "paid"] as PaymentStatus[]).map((s) => (
                                <DropdownMenuItem
                                  key={s}
                                  className="flex items-center gap-2 text-xs cursor-pointer"
                                  onClick={() => handleStatusChange(session, s)}
                                >
                                  <span className={`h-1.5 w-1.5 rounded-full ${STATUS_CONFIG[s].dot}`} />
                                  {STATUS_CONFIG[s].label}
                                  {session.payment_status === s && (
                                    <Check className="ml-auto h-3 w-3 text-primary" />
                                  )}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>

                          {/* Azioni — visibili all'hover */}
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <SessionDialog profile={profile} categorySlug={categorySlug} session={session} />

                            {isConf ? (
                              <div className="flex items-center gap-1 ml-1">
                                <button
                                  onClick={() => handleDelete(session.id)}
                                  disabled={isDel}
                                  className="cursor-pointer rounded-lg px-2.5 py-1 text-[11px] font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                                >
                                  {isDel ? "…" : "Elimina"}
                                </button>
                                <button
                                  onClick={() => setConfirmId(null)}
                                  className="cursor-pointer rounded-lg px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                                >
                                  Annulla
                                </button>
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 cursor-pointer text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setConfirmId(session.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* -- Paginazione ---------------------------------------------- */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border/30 pt-4">
          <p className="text-xs text-muted-foreground">
            {filtered.length} sessioni · pagina {page + 1} di {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 0}
              className="cursor-pointer rounded-xl border border-border/60 bg-white/70 px-3.5 py-1.5 text-xs font-medium text-foreground shadow-sm transition-colors hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Precedente
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages - 1}
              className="cursor-pointer rounded-xl border border-border/60 bg-white/70 px-3.5 py-1.5 text-xs font-medium text-foreground shadow-sm transition-colors hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Successiva →
            </button>
          </div>
        </div>
      )}

    </div>
    </div>
  )
}
