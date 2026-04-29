"use client"

import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import {
  Plus, Pencil, Loader2, Clock, Euro, Copy, Sparkles, CalendarCheck, MapPin, ChevronDown,
} from "lucide-react"

import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

import { createSession, editSession } from "@/app/actions/sessions"
import { useIsMobile } from "@/hooks/use-is-mobile"
import type { Profile, Session, InvigilationRole } from "@/types/database"

// ── Schema ────────────────────────────────────────────────────────────────────

const sessionSchema = z.object({
  session_date: z.string().min(1, "Seleziona una data"),
  start_time:   z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM"),
  end_time:     z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM"),
  location:     z.string().optional(),
  exam_name:    z.string().min(1, "Inserisci il nome dell'esame"),
  role_type:    z.enum(["invigilator", "supervisor"]).optional(),
  hourly_rate:  z.number({ error: "Tariffa non valida" }).min(0).max(999),
  notes:        z.string().optional(),
})

type SessionValues = z.infer<typeof sessionSchema>

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcPreview(start: string, end: string, rate: number) {
  const [sh, sm] = start.split(":").map(Number)
  const [eh, em] = end.split(":").map(Number)
  const mins = eh * 60 + em - (sh * 60 + sm)
  if (isNaN(mins) || mins <= 0) return null
  const hours   = Math.floor(mins / 60)
  const minutes = mins % 60
  const earned  = Math.round((mins / 60) * rate * 100) / 100
  const duration = hours > 0
    ? `${hours}h${minutes > 0 ? ` ${minutes}min` : ""}`
    : `${minutes}min`
  return { duration, earned, mins }
}

function todayISO() { return new Date().toISOString().split("T")[0] }

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  profile:           Profile
  categorySlug:      string
  session?:          Session
  lastSession?:      Session
  knownLocations?:   string[]
  defaultDate?:      string
  defaultStartTime?: string
  trigger?:          React.ReactNode
  onSuccess?:        () => void
}

// ── Componente principale ─────────────────────────────────────────────────────

export function SessionDialog({
  profile, categorySlug, session, lastSession, knownLocations = [],
  defaultDate, defaultStartTime, trigger, onSuccess,
}: Props) {
  const router  = useRouter()
  const isMobile = useIsMobile()
  const [open, setOpen]     = useState(false)
  const [isLoading, setLoading] = useState(false)
  const [serverError, setError] = useState<string | null>(null)
  const isEdit        = !!session
  const isInvigilation = categorySlug === "invigilation"

  function defaultValues(src?: Session): SessionValues {
    if (src) {
      const meta = src.metadata as { exam_name?: string; role_type?: string }
      return {
        session_date: src.session_date,
        start_time:   src.start_time.slice(0, 5),
        end_time:     src.end_time.slice(0, 5),
        location:     src.location ?? "",
        exam_name:    meta.exam_name ?? "",
        role_type:    (meta.role_type ?? profile.role_type ?? "invigilator") as InvigilationRole,
        hourly_rate:  src.hourly_rate,
        notes:        src.notes ?? "",
      }
    }
    return {
      session_date: defaultDate ?? todayISO(),
      start_time:   defaultStartTime ?? "",
      end_time:     "",
      location:     "",
      exam_name:    "",
      role_type:    profile.role_type ?? "invigilator",
      hourly_rate:  profile.default_hourly_rate,
      notes:        "",
    }
  }

  const form = useForm<SessionValues>({
    resolver: zodResolver(sessionSchema),
    defaultValues: defaultValues(session),
  })

  useEffect(() => {
    if (open) { form.reset(defaultValues(session)); setError(null); setLoading(false) }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const [startTime, endTime, hourlyRate] = form.watch(["start_time", "end_time", "hourly_rate"])
  const preview = calcPreview(startTime, endTime, hourlyRate)

  function loadLastSession() {
    if (!lastSession) return
    form.reset(defaultValues(lastSession))
    form.setValue("session_date", todayISO())
  }

  async function onSubmit(values: SessionValues) {
    setError(null); setLoading(true)
    const data = {
      session_date: values.session_date,
      start_time:   values.start_time,
      end_time:     values.end_time,
      location:     values.location,
      hourly_rate:  values.hourly_rate,
      notes:        values.notes,
      metadata:     isInvigilation
        ? { exam_name: values.exam_name, role_type: values.role_type ?? "invigilator" }
        : { exam_name: values.exam_name },
    }
    const result = isEdit ? await editSession(session!.id, data) : await createSession(data)
    if (result?.error) { setError(result.error); setLoading(false); return }
    setLoading(false); setOpen(false); router.refresh(); onSuccess?.()
  }

  const defaultTrigger = isEdit ? (
    <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-muted-foreground hover:text-primary hover:bg-primary/10">
      <Pencil className="h-3.5 w-3.5" />
    </Button>
  ) : (
    <Button size="sm" className="h-10 gap-2 rounded-xl px-4 font-semibold shadow-md shadow-primary/25">
      <Plus className="h-4 w-4" strokeWidth={2.5} />
      <span className="hidden sm:inline">Nuova Sessione</span>
      <span className="sm:hidden">Nuova</span>
    </Button>
  )

  const formContent = (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">

      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-black/[0.06] px-5 py-4 pr-12">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CalendarCheck className="h-[1.1rem] w-[1.1rem]" strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="text-[15px] font-bold tracking-tight text-foreground">
              {isEdit ? "Modifica sessione" : "Registra sessione"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isEdit ? "Aggiorna i dati" : "Archivia gli orari dell'esame"}
            </p>
          </div>
        </div>
        {!isEdit && lastSession && (
          <button
            type="button"
            onClick={loadLastSession}
            className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-primary/25 bg-primary/[0.06] px-2.5 py-1.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/10"
          >
            <Copy className="h-3 w-3" />
            Copia
          </button>
        )}
      </div>

      {/* Body — stack su mobile, 2 colonne su sm+ */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto sm:flex-row sm:overflow-hidden">

        {/* Colonna sinistra: data/ora/tariffa/preview */}
        <div className="flex shrink-0 flex-col gap-4 border-b border-black/[0.06] p-5 sm:w-[248px] sm:overflow-y-auto sm:border-b-0 sm:border-r">

          {/* Preview live */}
          <div className={`rounded-xl border p-3 transition-all ${
            preview ? "border-emerald-200/70 bg-emerald-50/60" : "border-border/40 bg-muted/30"
          }`}>
            {preview ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Durata</span>
                  </div>
                  <span className="text-sm font-bold tabular-nums text-foreground">{preview.duration}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Euro className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Stimato</span>
                  </div>
                  <span className="text-sm font-bold tabular-nums text-emerald-700">€{preview.earned.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-1 pt-0.5">
                  <Sparkles className="h-2.5 w-2.5 text-emerald-500" />
                  <span className="text-[10px] font-medium text-emerald-600">Anteprima live</span>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 py-0.5">
                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Imposta <span className="font-medium text-foreground">inizio</span> e{" "}
                  <span className="font-medium text-foreground">fine</span> per vedere durata e guadagno.
                </p>
              </div>
            )}
          </div>

          <Field label="Data" error={form.formState.errors.session_date?.message}>
            <Input type="date" max={todayISO()} className="h-10 rounded-xl text-sm" {...form.register("session_date")} />
          </Field>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Inizio" error={form.formState.errors.start_time?.message}>
              <Input type="time" className="h-10 rounded-xl text-sm" {...form.register("start_time")} />
            </Field>
            <Field label="Fine" error={form.formState.errors.end_time?.message}>
              <Input type="time" className="h-10 rounded-xl text-sm" {...form.register("end_time")} />
            </Field>
          </div>

          <Field label="Tariffa oraria (€)" error={form.formState.errors.hourly_rate?.message}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">€</span>
              <Input
                type="number" step="0.01" min="0"
                className="h-10 rounded-xl pl-7 text-sm"
                {...form.register("hourly_rate", { valueAsNumber: true })}
              />
            </div>
          </Field>
        </div>

        {/* Colonna destra: dettagli esame */}
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <Field label="Nome esame" error={form.formState.errors.exam_name?.message}>
            <Input
              className="h-10 rounded-xl text-sm"
              placeholder="es. A-Level Mathematics Paper 1"
              {...form.register("exam_name")}
            />
          </Field>

          <div className={`grid gap-3 ${isInvigilation ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
            <Field label="Sede / scuola" error={form.formState.errors.location?.message}>
              <LocationCombobox
                value={form.watch("location") ?? ""}
                onChange={(v) => form.setValue("location", v, { shouldValidate: true })}
                suggestions={knownLocations}
              />
            </Field>
            {isInvigilation && (
              <Field label="Ruolo" error={form.formState.errors.role_type?.message}>
                <Select
                  defaultValue={form.getValues("role_type") ?? "invigilator"}
                  onValueChange={(v) => form.setValue("role_type", v as InvigilationRole, { shouldValidate: true })}
                >
                  <SelectTrigger className="h-10 w-full rounded-xl text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="invigilator">Invigilator</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            )}
          </div>

          <Field label="Note" error={form.formState.errors.notes?.message}>
            <Textarea
              placeholder="Dettagli aggiuntivi…"
              className="min-h-[80px] resize-none rounded-xl text-sm"
              rows={3}
              {...form.register("notes")}
            />
          </Field>

          {serverError && (
            <div className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3">
              <p className="text-sm text-destructive">{serverError}</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex shrink-0 gap-3 border-t border-black/[0.06] bg-muted/20 px-5 py-3.5" style={{ paddingBottom: "max(14px, env(safe-area-inset-bottom))" }}>
        <Button type="button" variant="outline" className="h-11 flex-1 rounded-xl font-semibold" onClick={() => setOpen(false)} disabled={isLoading}>
          Annulla
        </Button>
        <Button type="submit" className="h-11 flex-1 rounded-xl font-semibold shadow-md shadow-primary/20" disabled={isLoading}>
          {isLoading
            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvataggio…</>
            : isEdit ? "Salva modifiche" : "Registra sessione"
          }
        </Button>
      </div>
    </form>
  )

  // ── Mobile: Sheet dal basso ───────────────────────────────────────────────

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>{trigger ?? defaultTrigger}</SheetTrigger>
        <SheetContent
          side="bottom"
          className="flex flex-col gap-0 rounded-t-2xl p-0"
          style={{ height: "92dvh" }}
        >
          <SheetTitle className="sr-only">
            {isEdit ? "Modifica sessione" : "Registra sessione"}
          </SheetTitle>
          {/* Drag handle */}
          <div className="flex shrink-0 justify-center pt-3 pb-1">
            <div className="h-1 w-10 rounded-full bg-muted-foreground/25" />
          </div>
          {formContent}
        </SheetContent>
      </Sheet>
    )
  }

  // ── Desktop: Dialog centrato ──────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      <DialogContent
        showCloseButton
        className="flex max-h-[min(92vh,780px)] w-full max-w-[540px] flex-col gap-0 overflow-hidden rounded-2xl border border-white/60 bg-white/95 p-0 shadow-2xl shadow-black/[0.12] backdrop-blur-2xl sm:max-w-[860px]"
      >
        <DialogTitle className="sr-only">{session ? "Modifica sessione" : "Nuova sessione"}</DialogTitle>
        {formContent}
      </DialogContent>
    </Dialog>
  )
}

// ── LocationCombobox ──────────────────────────────────────────────────────────

function LocationCombobox({
  value, onChange, suggestions,
}: { value: string; onChange: (v: string) => void; suggestions: string[] }) {
  const [open,    setOpen]    = useState(false)
  const [query,   setQuery]   = useState(value)
  const containerRef          = useRef<HTMLDivElement>(null)

  // Keep query in sync when form resets
  useEffect(() => { setQuery(value) }, [value])

  // Close on outside click
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [])

  const filtered = query.trim()
    ? suggestions.filter((s) => s.toLowerCase().includes(query.trim().toLowerCase()))
    : suggestions

  function select(loc: string) {
    setQuery(loc)
    onChange(loc)
    setOpen(false)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value)
    onChange(e.target.value)
    setOpen(true)
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative flex items-center">
        <MapPin className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-muted-foreground/50" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          placeholder="es. Westfield Academy"
          className="h-10 w-full rounded-xl border border-input bg-background pl-8 pr-8 text-sm shadow-sm outline-none placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
        />
        {suggestions.length > 0 && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setOpen((v) => !v)}
            className="absolute right-2.5 text-muted-foreground/50 hover:text-muted-foreground"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-border/60 bg-white py-1 shadow-lg shadow-black/[0.08]">
          {filtered.map((loc) => (
            <li key={loc}>
              <button
                type="button"
                onPointerDown={(e) => e.preventDefault()} // keep focus on input
                onClick={() => select(loc)}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-foreground hover:bg-primary/[0.06] hover:text-primary"
              >
                <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                {loc}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Field helper ──────────────────────────────────────────────────────────────

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
