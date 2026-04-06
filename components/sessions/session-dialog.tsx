"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import {
  Plus,
  Pencil,
  Loader2,
  Clock,
  Euro,
  Copy,
  Sparkles,
  CalendarCheck,
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { createSession, editSession } from "@/app/actions/sessions"
import type { Profile, Session, InvigilationRole } from "@/types/database"

const sessionSchema = z.object({
  session_date: z.string().min(1, "Select a date"),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, "HH:MM format required"),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, "HH:MM format required"),
  location: z.string().optional(),
  exam_name: z.string().min(1, "Enter the exam name"),
  role_type: z.enum(["invigilator", "supervisor"]).optional(),
  hourly_rate: z.number({ error: "Invalid rate" }).min(0).max(999),
  notes: z.string().optional(),
})

type SessionValues = z.infer<typeof sessionSchema>

function calcPreview(start: string, end: string, rate: number) {
  const [sh, sm] = start.split(":").map(Number)
  const [eh, em] = end.split(":").map(Number)
  const mins = eh * 60 + em - (sh * 60 + sm)
  if (isNaN(mins) || mins <= 0) return null
  const hours = Math.floor(mins / 60)
  const minutes = mins % 60
  const earned = Math.round((mins / 60) * rate * 100) / 100
  const duration =
    hours > 0
      ? `${hours}h${minutes > 0 ? ` ${minutes}min` : ""}`
      : `${minutes}min`
  return { duration, earned, mins }
}

function todayISO() {
  return new Date().toISOString().split("T")[0]
}

interface Props {
  profile: Profile
  categorySlug: string       // slug del workspace attivo — controlla quali campi mostrare
  session?: Session
  lastSession?: Session
  defaultDate?: string       // pre-compila session_date (dal calendario)
  defaultStartTime?: string  // pre-compila start_time (dal click su slot orario)
  trigger?: React.ReactNode
  onSuccess?: () => void     // callback dopo salvataggio (per il calendario)
}

export function SessionDialog({ profile, categorySlug, session, lastSession, defaultDate, defaultStartTime, trigger, onSuccess }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setLoading] = useState(false)
  const [serverError, setError] = useState<string | null>(null)
  const isEdit = !!session
  const isInvigilation = categorySlug === "invigilation"

  function defaultValues(src?: Session): SessionValues {
    if (src) {
      const meta = src.metadata as { exam_name?: string; role_type?: string }
      return {
        session_date: src.session_date,
        start_time: src.start_time.slice(0, 5),
        end_time: src.end_time.slice(0, 5),
        location: src.location ?? "",
        exam_name: meta.exam_name ?? "",
        role_type: (meta.role_type ?? profile.role_type ?? "invigilator") as InvigilationRole,
        hourly_rate: src.hourly_rate,
        notes: src.notes ?? "",
      }
    }
    return {
      session_date: defaultDate ?? todayISO(),
      start_time: defaultStartTime ?? "",
      end_time: "",
      location: "",
      exam_name: "",
      role_type: profile.role_type ?? "invigilator",
      hourly_rate: profile.default_hourly_rate,
      notes: "",
    }
  }

  const form = useForm<SessionValues>({
    resolver: zodResolver(sessionSchema),
    defaultValues: defaultValues(session),
  })

  useEffect(() => {
    if (open) {
      form.reset(defaultValues(session))
      setError(null)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const [startTime, endTime, hourlyRate] = form.watch(["start_time", "end_time", "hourly_rate"])
  const preview = calcPreview(startTime, endTime, hourlyRate)

  function loadLastSession() {
    if (!lastSession) return
    form.reset(defaultValues(lastSession))
    form.setValue("session_date", todayISO())
  }

  async function onSubmit(values: SessionValues) {
    setError(null)
    setLoading(true)
    const data = {
      session_date: values.session_date,
      start_time: values.start_time,
      end_time: values.end_time,
      location: values.location,
      hourly_rate: values.hourly_rate,
      notes: values.notes,
      metadata: isInvigilation
        ? { exam_name: values.exam_name, role_type: values.role_type ?? "invigilator" }
        : { exam_name: values.exam_name },
    }
    const result = isEdit ? await editSession(session!.id, data) : await createSession(data)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }
    setOpen(false)
    router.refresh()
    onSuccess?.()
  }

  const defaultTrigger = isEdit ? (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
    >
      <Pencil className="h-3.5 w-3.5" />
    </Button>
  ) : (
    <Button size="sm" className="h-10 gap-2 rounded-xl px-4 font-semibold shadow-md shadow-primary/25">
      <Plus className="h-4 w-4" strokeWidth={2.5} />
      Nuova Sessione
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>

      <DialogContent
        showCloseButton
        className="flex max-h-[min(92vh,780px)] w-full max-w-[540px] flex-col gap-0 overflow-hidden rounded-2xl border border-white/60 bg-white/95 p-0 shadow-2xl shadow-black/[0.12] backdrop-blur-2xl sm:max-w-[860px]"
      >
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">

          {/* -- Header compatto --------------------------------------------- */}
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-black/[0.06] px-6 py-4 pr-14">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CalendarCheck className="h-[1.1rem] w-[1.1rem]" strokeWidth={2.2} />
              </div>
              <div>
                <h2 className="text-[15px] font-bold tracking-tight text-foreground">
                  {isEdit ? "Modifica sessione" : "Registra sessione"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {isEdit ? "Aggiorna i dati di questa sessione" : "Archivia gli orari dell'esame"}
                </p>
              </div>
            </div>
            {/* Chip "Copia" — compatto, solo se non in edit e c'è lastSession */}
            {!isEdit && lastSession && (
              <button
                type="button"
                onClick={loadLastSession}
                className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-primary/25 bg-primary/[0.06] px-3 py-1.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/10"
              >
                <Copy className="h-3 w-3" />
                {(lastSession.metadata as { exam_name?: string }).exam_name
                  ? `Copia: ${(lastSession.metadata as { exam_name?: string }).exam_name}`
                  : "Copia ultima sessione"}
              </button>
            )}
          </div>

          {/* -- Corpo — due colonne su sm+ ---------------------------------- */}
          <div className="flex min-h-0 flex-1 flex-col sm:flex-row">

            {/* -- Colonna sinistra: data/ora/tariffa/preview ------------------ */}
            <div className="flex shrink-0 flex-col gap-4 border-b border-black/[0.06] p-5 sm:w-[248px] sm:border-b-0 sm:border-r">

              {/* Preview live */}
              <div className={`rounded-xl border p-3 transition-all ${
                preview
                  ? "border-emerald-200/70 bg-emerald-50/60"
                  : "border-border/40 bg-muted/30"
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
                      <span className="text-[10px] text-emerald-600 font-medium">Anteprima live</span>
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

              {/* Data */}
              <Field label="Data" error={form.formState.errors.session_date?.message}>
                <Input type="date" max={todayISO()} className="h-10 rounded-xl text-sm" {...form.register("session_date")} />
              </Field>

              {/* Orari */}
              <div className="grid grid-cols-2 gap-2">
                <Field label="Inizio" error={form.formState.errors.start_time?.message}>
                  <Input type="time" className="h-10 rounded-xl text-sm" {...form.register("start_time")} />
                </Field>
                <Field label="Fine" error={form.formState.errors.end_time?.message}>
                  <Input type="time" className="h-10 rounded-xl text-sm" {...form.register("end_time")} />
                </Field>
              </div>

              {/* Tariffa */}
              <Field label="Tariffa oraria (€)" error={form.formState.errors.hourly_rate?.message}>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">€</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    className="h-10 rounded-xl pl-7 text-sm"
                    {...form.register("hourly_rate", { valueAsNumber: true })}
                  />
                </div>
              </Field>
            </div>

            {/* -- Colonna destra: dettagli esame ----------------------------- */}
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">

              <Field label="Nome esame" error={form.formState.errors.exam_name?.message}>
                <Input
                  className="h-10 rounded-xl text-sm"
                  placeholder="es. A-Level Mathematics Paper 1"
                  {...form.register("exam_name")}
                />
              </Field>

              <div className={`grid grid-cols-1 gap-3 ${isInvigilation ? "sm:grid-cols-2" : ""}`}>
                <Field label="Sede / scuola" error={form.formState.errors.location?.message}>
                  <Input
                    className="h-10 rounded-xl text-sm"
                    placeholder="es. Westfield Academy"
                    {...form.register("location")}
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
                  placeholder="Dettagli aggiuntivi su questa sessione…"
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

          {/* -- Footer ----------------------------------------------------- */}
          <div className="flex shrink-0 gap-3 border-t border-black/[0.06] bg-muted/20 px-5 py-3.5">
            <Button
              type="button"
              variant="outline"
              className="h-10 flex-1 rounded-xl font-semibold"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Annulla
            </Button>
            <Button
              type="submit"
              className="h-10 flex-1 rounded-xl font-semibold shadow-md shadow-primary/20"
              disabled={isLoading}
            >
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvataggio…</>
              ) : isEdit ? "Salva modifiche" : "Registra sessione"}
            </Button>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
