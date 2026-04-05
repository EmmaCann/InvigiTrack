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
  PoundSterling,
  Copy,
  Sparkles,
  CalendarCheck,
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
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
  role_type: z.enum(["invigilator", "supervisor"]),
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
  session?: Session
  lastSession?: Session
  defaultDate?: string       // pre-compila session_date (dal calendario)
  defaultStartTime?: string  // pre-compila start_time (dal click su slot orario)
  trigger?: React.ReactNode
  onSuccess?: () => void     // callback dopo salvataggio (per il calendario)
}

export function SessionDialog({ profile, session, lastSession, defaultDate, defaultStartTime, trigger, onSuccess }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setLoading] = useState(false)
  const [serverError, setError] = useState<string | null>(null)
  const isEdit = !!session

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
      metadata: { exam_name: values.exam_name, role_type: values.role_type },
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
        className="flex max-h-[min(90vh,760px)] w-full max-w-[520px] flex-col gap-0 overflow-hidden rounded-2xl border border-white/60 bg-white/92 p-0 shadow-2xl shadow-primary/10 backdrop-blur-2xl sm:max-w-[820px]"
      >
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          {/* Header */}
          <div className="relative shrink-0 bg-gradient-to-br from-primary/[0.14] via-primary/[0.06] to-background px-6 pb-5 pt-7 pr-14">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-inner ring-1 ring-primary/20">
                <CalendarCheck className="h-6 w-6" strokeWidth={2} />
              </div>
              <DialogHeader className="flex-1 space-y-1 text-left">
                <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                  {isEdit ? "Modifica sessione" : "Nuova sessione"}
                </DialogTitle>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {isEdit
                    ? "Aggiorna i dettagli di questa sessione."
                    : "Registra data, orari e tariffe: il guadagno stimato si aggiorna in tempo reale."}
                </p>
              </DialogHeader>
            </div>

            {!isEdit && lastSession && (
              <button
                type="button"
                onClick={loadLastSession}
                className="mt-5 flex w-full items-start gap-3 rounded-2xl border border-primary/25 bg-white/60 p-4 text-left shadow-sm backdrop-blur-sm transition-all hover:border-primary/40 hover:bg-primary/[0.07]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
                  <Copy className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wide text-primary">Copia dall&apos;ultima sessione</p>
                  <p className="mt-1 truncate text-sm font-medium text-foreground">
                    {(lastSession.metadata as { exam_name?: string }).exam_name ?? "Sessione precedente"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Applica sede, ruolo e tariffa — imposti tu data e orari.
                  </p>
                </div>
              </button>
            )}
          </div>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-6">
            <div
              className={`rounded-2xl border px-4 py-4 transition-all ${
                preview
                  ? "border-emerald-200/80 bg-emerald-50/50 shadow-sm dark:border-emerald-800/40 dark:bg-emerald-950/20"
                  : "border-primary/15 bg-primary/[0.04]"
              }`}
            >
              {preview ? (
                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/80 bg-white/90 shadow-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Durata</p>
                      <p className="text-base font-bold tabular-nums text-foreground">{preview.duration}</p>
                    </div>
                  </div>
                  <Separator orientation="vertical" className="hidden h-10 sm:block" />
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200/60 bg-emerald-100/80">
                      <PoundSterling className="h-4 w-4 text-emerald-700" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Stimato</p>
                      <p className="text-base font-bold tabular-nums text-emerald-700">£{preview.earned.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="ml-auto flex items-center gap-1 rounded-full bg-emerald-100/80 px-2.5 py-1 text-[10px] font-semibold text-emerald-800">
                    <Sparkles className="h-3 w-3" />
                    Anteprima live
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 py-1">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Clock className="h-4 w-4" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Imposta <span className="font-medium text-foreground">inizio</span> e{" "}
                    <span className="font-medium text-foreground">fine</span> per vedere durata e guadagno stimato.
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-3 sm:col-span-1">
                <Field label="Data" error={form.formState.errors.session_date?.message}>
                  <Input type="date" max={todayISO()} className="h-11 rounded-xl" {...form.register("session_date")} />
                </Field>
              </div>
              <div>
                <Field label="Inizio" error={form.formState.errors.start_time?.message}>
                  <Input type="time" className="h-11 rounded-xl" {...form.register("start_time")} />
                </Field>
              </div>
              <div>
                <Field label="Fine" error={form.formState.errors.end_time?.message}>
                  <Input type="time" className="h-11 rounded-xl" {...form.register("end_time")} />
                </Field>
              </div>
            </div>

            <Separator className="bg-border/60" />

            <Field label="Nome esame" error={form.formState.errors.exam_name?.message}>
              <Input
                className="h-11 rounded-xl"
                placeholder="es. A-Level Mathematics Paper 1"
                {...form.register("exam_name")}
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Sede / scuola" error={form.formState.errors.location?.message}>
                <Input
                  className="h-11 rounded-xl"
                  placeholder="es. Westfield Academy"
                  {...form.register("location")}
                />
              </Field>
              <Field label="Ruolo" error={form.formState.errors.role_type?.message}>
                <Select
                  defaultValue={form.getValues("role_type")}
                  onValueChange={(v) =>
                    form.setValue("role_type", v as InvigilationRole, { shouldValidate: true })
                  }
                >
                  <SelectTrigger className="h-11 w-full rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="invigilator">Invigilator</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field label="Tariffa oraria (£)" error={form.formState.errors.hourly_rate?.message}>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                  £
                </span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  className="h-11 rounded-xl pl-8"
                  {...form.register("hourly_rate", { valueAsNumber: true })}
                />
              </div>
            </Field>

            <Field label="Note" error={form.formState.errors.notes?.message}>
              <Textarea
                placeholder="Dettagli aggiuntivi su questa sessione…"
                className="min-h-[88px] resize-none rounded-xl text-sm"
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

          <div className="flex shrink-0 gap-3 border-t border-white/50 bg-white/30 px-6 py-4 backdrop-blur-sm">
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 rounded-xl font-semibold"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Annulla
            </Button>
            <Button type="submit" className="h-11 flex-1 rounded-xl font-semibold shadow-md shadow-primary/20" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvataggio…
                </>
              ) : isEdit ? (
                "Salva modifiche"
              ) : (
                "Registra sessione"
              )}
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
