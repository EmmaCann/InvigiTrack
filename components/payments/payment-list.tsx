"use client"

import { useState, useMemo } from "react"
import { CheckSquare, Square, AlertCircle, CheckCircle2, History, Download, Search, Calendar, ChevronDown, Check, X, Filter } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { RegisterPaymentDialog } from "./register-payment-dialog"
import { PaymentHistoryCard } from "./payment-history-card"
import type { Session, PaymentWithSessions } from "@/types/database"

// --- Helpers ------------------------------------------------------------------

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("it-IT", {
    weekday: "short", day: "numeric", month: "short",
  })
}

function formatTime(t: string) { return t.slice(0, 5) }

function todayStr() { return new Date().toISOString().split("T")[0] }

function exportPaymentsCSV(payments: PaymentWithSessions[]) {
  const headers = ["Data", "Importo (€)", "Metodo", "Riferimento", "Sessioni", "Note"]
  const rows = payments.map((p) => [
    p.payment_date,
    p.amount.toFixed(2),
    p.method,
    p.reference ?? "",
    p.sessions.map((s) => (s.metadata as { exam_name?: string }).exam_name ?? "Sessione").join(" | "),
    p.notes ?? "",
  ])
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement("a"), { href: url, download: `pagamenti-${todayStr()}.csv` })
  a.click()
  URL.revokeObjectURL(url)
}

// --- Props --------------------------------------------------------------------

interface Props {
  unpaidSessions:  Session[]
  payments:        PaymentWithSessions[]
  summaryUnpaid:   number
  summaryPaidMonth: number
  summaryPaidTotal: number
  initialTab?:     "pending" | "history"
}

type Tab = "pending" | "history"

// --- Componente --------------------------------------------------------------

export function PaymentList({
  unpaidSessions,
  payments,
  summaryUnpaid,
  summaryPaidMonth,
  summaryPaidTotal,
  initialTab = "pending",
}: Props) {
  const [tab,         setTab]         = useState<Tab>(initialTab)
  const [selected,    setSelected]    = useState<Set<string>>(new Set())
  const [showModal,   setShowModal]   = useState(false)

  // -- Filtri storico -----------------------------------------------------------
  const [historySearch,   setHistorySearch]   = useState("")
  const [historyMethod,   setHistoryMethod]   = useState<"all" | "bank_transfer" | "cash" | "other">("all")
  const [historyDateRange, setHistoryDateRange] = useState<"all" | "30d" | "3m" | "1y">("all")

  // -- Selezione ---------------------------------------------------------------
  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === unpaidSessions.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(unpaidSessions.map((s) => s.id)))
    }
  }

  const selectedSessions = unpaidSessions.filter((s) => selected.has(s.id))
  const selectedTotal    = selectedSessions.reduce((a, s) => a + s.earned, 0)
  const allSelected      = selected.size === unpaidSessions.length && unpaidSessions.length > 0

  const filteredPayments = useMemo(() => {
    let result = payments

    if (historySearch.trim()) {
      const q = historySearch.trim().toLowerCase()
      result = result.filter((p) =>
        p.sessions.some((s) => ((s.metadata as { exam_name?: string }).exam_name ?? "").toLowerCase().includes(q)) ||
        (p.reference ?? "").toLowerCase().includes(q) ||
        (p.notes ?? "").toLowerCase().includes(q)
      )
    }

    if (historyMethod !== "all") {
      result = result.filter((p) => p.method === historyMethod)
    }

    if (historyDateRange !== "all") {
      const cutoff = new Date()
      if (historyDateRange === "30d") cutoff.setDate(cutoff.getDate() - 30)
      if (historyDateRange === "3m")  cutoff.setMonth(cutoff.getMonth() - 3)
      if (historyDateRange === "1y")  cutoff.setFullYear(cutoff.getFullYear() - 1)
      result = result.filter((p) => new Date(p.payment_date + "T00:00:00") >= cutoff)
    }

    return result
  }, [payments, historySearch, historyMethod, historyDateRange])

  const hasHistoryFilters = !!(historySearch || historyMethod !== "all" || historyDateRange !== "all")

  function handleSuccess() {
    setShowModal(false)
    setSelected(new Set())
  }

  return (
    <div className="space-y-5">

      {/* -- Summary bar ------------------------------------------------ */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "In attesa",       value: `€${summaryUnpaid.toFixed(2)}`,     color: "text-amber-600",   bg: "bg-amber-500/8" },
          { label: "Ricevuto (mese)", value: `€${summaryPaidMonth.toFixed(2)}`,  color: "text-emerald-600", bg: "bg-emerald-500/8" },
          { label: "Ricevuto totale", value: `€${summaryPaidTotal.toFixed(2)}`,  color: "text-primary",     bg: "bg-primary/8" },
        ].map((s) => (
          <div key={s.label} className="glass-dashboard rounded-2xl px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* -- Tab switcher ----------------------------------------------- */}
      <div className="flex gap-1 rounded-xl border border-border/40 bg-muted/30 p-1">
        {([
          { value: "pending" as Tab, label: "Da Pagare",         icon: AlertCircle, count: unpaidSessions.length },
          { value: "history" as Tab, label: "Storico",           icon: History,     count: payments.length },
        ]).map(({ value, label, icon: Icon, count }) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={cn(
              "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all",
              tab === value
                ? "bg-white shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
            <span className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
              tab === value ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
            )}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* -- Tab: Da Pagare --------------------------------------------- */}
      {tab === "pending" && (
        <div className="space-y-3">

          {unpaidSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/50 py-16 text-center">
              <CheckCircle2 className="mb-3 h-10 w-10 text-emerald-500/60" />
              <p className="text-sm font-semibold text-foreground">Tutto pagato!</p>
              <p className="mt-1 text-xs text-muted-foreground">Nessuna sessione in attesa di pagamento.</p>
            </div>
          ) : (
            <>
              {/* Toolbar seleziona tutte */}
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleAll}
                  className="flex cursor-pointer items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {allSelected
                    ? <CheckSquare className="h-4 w-4 text-primary" />
                    : <Square className="h-4 w-4" />}
                  {allSelected ? "Deseleziona tutte" : "Seleziona tutte"}
                </button>
                <span className="text-xs text-muted-foreground">
                  {unpaidSessions.length} session{unpaidSessions.length !== 1 ? "i" : "e"} · €{unpaidSessions.reduce((a, s) => a + s.earned, 0).toFixed(2)} totale
                </span>
              </div>

              {/* Lista sessioni */}
              <div className="space-y-2">
                {unpaidSessions.map((session) => {
                  const meta     = session.metadata as { exam_name?: string }
                  const checked  = selected.has(session.id)

                  return (
                    <div
                      key={session.id}
                      onClick={() => toggle(session.id)}
                      className={cn(
                        "group flex cursor-pointer items-center gap-3 overflow-hidden rounded-2xl border px-4 py-3 transition-all sm:gap-4 sm:px-5 sm:py-3.5",
                        checked
                          ? "border-primary/30 bg-primary/[0.06] shadow-sm shadow-primary/10"
                          : "glass-dashboard border-white/60 hover:border-primary/20",
                      )}
                    >
                      {/* Checkbox */}
                      <div className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all",
                        checked ? "border-primary bg-primary" : "border-border/60 bg-white/60",
                      )}>
                        {checked && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>

                      {/* Data (solo desktop) */}
                      <div className="hidden w-12 shrink-0 text-center sm:block">
                        <p className="text-base font-bold leading-none text-foreground">
                          {new Date(session.session_date + "T00:00:00").getDate()}
                        </p>
                        <p className="mt-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                          {new Date(session.session_date + "T00:00:00").toLocaleDateString("it-IT", { month: "short" })}
                        </p>
                      </div>

                      <div className="hidden h-8 w-px shrink-0 bg-border/40 sm:block" />

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {meta.exam_name ?? "Sessione"}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          <span className="sm:hidden">{formatDate(session.session_date)} · </span>
                          {formatTime(session.start_time)} – {formatTime(session.end_time)}
                          {session.location && ` · ${session.location}`}
                        </p>
                      </div>

                      {/* Status (solo desktop) */}
                      <span className="hidden shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 sm:inline">
                        Non pagato
                      </span>

                      {/* Importo */}
                      <p className="shrink-0 text-base font-bold tabular-nums text-foreground">
                        €{session.earned.toFixed(2)}
                      </p>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* -- Tab: Storico ----------------------------------------------- */}
      {tab === "history" && (
        <div className="space-y-3">

          {/* Riga azioni: contatore + CSV */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{filteredPayments.length} pagamenti</span>
            <button
              onClick={() => exportPaymentsCSV(filteredPayments)}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-border/50 bg-white/70 px-4 py-2 text-xs font-semibold text-muted-foreground shadow-sm transition-all hover:bg-white hover:text-foreground hover:shadow-md"
            >
              <Download className="h-3.5 w-3.5" />
              Esporta CSV
            </button>
          </div>

          {/* Filter bar */}
          <div className="glass-dashboard flex items-center gap-2 overflow-x-auto rounded-2xl px-3 py-2 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
            {/* Search */}
            <div className="flex min-w-[160px] flex-1 items-center gap-2 rounded-xl border border-border/30 bg-white/50 px-3 py-2">
              <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
              <input
                type="text"
                placeholder="Cerca pagamenti…"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground/50"
              />
              {historySearch && (
                <button onClick={() => setHistorySearch("")} className="cursor-pointer">
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>

            {/* Method filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-border/30 bg-white/50 px-3 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground">
                  <Filter className="h-3.5 w-3.5 shrink-0" />
                  {historyMethod === "all" ? "Tutti i metodi" : historyMethod === "bank_transfer" ? "Bonifico" : historyMethod === "cash" ? "Contanti" : "Altro"}
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 border-border/60 bg-white shadow-lg shadow-black/[0.08]">
                {[
                  { v: "all" as const,           l: "Tutti i metodi" },
                  { v: "bank_transfer" as const, l: "Bonifico" },
                  { v: "cash" as const,          l: "Contanti" },
                  { v: "other" as const,         l: "Altro" },
                ].map(({ v, l }) => (
                  <DropdownMenuItem key={v} onClick={() => setHistoryMethod(v)} className="flex cursor-pointer items-center justify-between text-xs">
                    {l} {historyMethod === v && <Check className="h-3 w-3 text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Date range */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-border/30 bg-white/50 px-3 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  {historyDateRange === "all" ? "Tutto il periodo" : historyDateRange === "30d" ? "Ultimi 30gg" : historyDateRange === "3m" ? "Ultimi 3 mesi" : "Quest'anno"}
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 border-border/60 bg-white shadow-lg shadow-black/[0.08]">
                {[
                  { v: "all" as const,  l: "Tutto il periodo" },
                  { v: "30d" as const,  l: "Ultimi 30 giorni" },
                  { v: "3m" as const,   l: "Ultimi 3 mesi" },
                  { v: "1y" as const,   l: "Quest'anno" },
                ].map(({ v, l }) => (
                  <DropdownMenuItem key={v} onClick={() => setHistoryDateRange(v)} className="flex cursor-pointer items-center justify-between text-xs">
                    {l} {historyDateRange === v && <Check className="h-3 w-3 text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Clear */}
            {hasHistoryFilters && (
              <button
                onClick={() => { setHistorySearch(""); setHistoryMethod("all"); setHistoryDateRange("all") }}
                className="flex cursor-pointer items-center gap-1 rounded-xl border border-border/30 bg-white/50 px-2.5 py-2 text-xs text-muted-foreground transition-colors hover:text-destructive"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}

          </div>

          {filteredPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/50 py-16 text-center">
              <History className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-semibold text-foreground">
                {payments.length === 0 ? "Nessun pagamento registrato" : "Nessun risultato"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {payments.length === 0 ? "I pagamenti confermati appariranno qui." : "Prova a modificare i filtri."}
              </p>
            </div>
          ) : (
            filteredPayments.map((p) => <PaymentHistoryCard key={p.id} payment={p} />)
          )}
        </div>
      )}

      {/* -- Toolbar contestuale (selezione attiva) --------------------- */}
      {selected.size > 0 && tab === "pending" && (
        <div className="fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-4 rounded-2xl border border-white/50 bg-foreground/95 px-5 py-3.5 shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="text-sm text-white/80">
            <span className="font-bold text-white">{selected.size}</span> selezionate ·{" "}
            <span className="font-bold text-white">€{selectedTotal.toFixed(2)}</span>
          </div>
          <button
            onClick={() => setSelected(new Set())}
            className="cursor-pointer text-xs text-white/50 hover:text-white/80"
          >
            Annulla
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="cursor-pointer rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
          >
            Registra Pagamento →
          </button>
        </div>
      )}

      {/* -- Modal ------------------------------------------------------ */}
      {showModal && (
        <RegisterPaymentDialog
          sessions={selectedSessions}
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}
