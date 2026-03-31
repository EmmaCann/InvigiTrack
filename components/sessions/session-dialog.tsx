"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Loader2, Clock, PoundSterling, Copy, Sparkles } from "lucide-react"

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

// ─── Schema ───────────────────────────────────────────────────────────────────

const sessionSchema = z.object({
  session_date: z.string().min(1, "Select a date"),
  start_time:   z.string().regex(/^\d{2}:\d{2}$/, "HH:MM format required"),
  end_time:     z.string().regex(/^\d{2}:\d{2}$/, "HH:MM format required"),
  location:     z.string().optional(),
  exam_name:    z.string().min(1, "Enter the exam name"),
  role_type:    z.enum(["invigilator", "supervisor"]),
  hourly_rate:  z.number({ error: "Invalid rate" }).min(0).max(999),
  notes:        z.string().optional(),
})

type SessionValues = z.infer<typeof sessionSchema>

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcPreview(start: string, end: string, rate: number) {
  const [sh, sm] = start.split(":").map(Number)
  const [eh, em] = end.split(":").map(Number)
  const mins = (eh * 60 + em) - (sh * 60 + sm)
  if (isNaN(mins) || mins <= 0) return null
  const hours    = Math.floor(mins / 60)
  const minutes  = mins % 60
  const earned   = Math.round((mins / 60) * rate * 100) / 100
  const duration = hours > 0
    ? `${hours}h${minutes > 0 ? ` ${minutes}min` : ""}`
    : `${minutes}min`
  return { duration, earned, mins }
}

function todayISO() {
  return new Date().toISOString().split("T")[0]
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  profile:      Profile
  session?:     Session
  lastSession?: Session
  trigger?:     React.ReactNode
}

// ─── Componente ──────────────────────────────────────────────────────────────

export function SessionDialog({ profile, session, lastSession, trigger }: Props) {
  const router = useRouter()
  const [open, setOpen]         = useState(false)
  const [isLoading, setLoading] = useState(false)
  const [serverError, setError] = useState<string | null>(null)
  const isEdit = !!session

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
      session_date: todayISO(),
      start_time:   "",
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
      start_time:   values.start_time,
      end_time:     values.end_time,
      location:     values.location,
      hourly_rate:  values.hourly_rate,
      notes:        values.notes,
      metadata: { exam_name: values.exam_name, role_type: values.role_type },
    }
    const result = isEdit
      ? await editSession(session!.id, data)
      : await createSession(data)

    if (result?.error) { setError(result.error); setLoading(false); return }
    setOpen(false)
    router.refresh()
  }

  const defaultTrigger = isEdit ? (
    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
      <Pencil className="h-3.5 w-3.5" />
    </Button>
  ) : (
    <Button size="sm" className="gap-2 font-semibold rounded-xl shadow-md shadow-primary/25 px-4 h-9">
      <Plus className="h-4 w-4" strokeWidth={2.5} />
      Nuova Sessione
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? defaultTrigger}
      </DialogTrigger>

      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden rounded-2xl border-white/60 shadow-2xl shadow-black/[0.15]">
        {/* ── Header colorato ──────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/[0.05] to-blue-50/50 px-6 pt-6 pb-5 border-b border-primary/10">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {isEdit ? "Modifica Sessione" : "Nuova Sessione"}
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isEdit
                ? "Aggiorna i dettagli di questa sessione."
                : "Registra una nuova sessione di lavoro e traccia i tuoi guadagni."}
            </p>
          </DialogHeader>

          {/* Log Similar button */}
          {!isEdit && lastSession && (
            <button
              type="button"
              onClick={loadLastSession}
              className="mt-4 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/10 transition-colors w-full"
            >
              <Copy className="h-3.5 w-3.5 shrink-0" />
              Copia dall&apos;ultima sessione —{" "}
              <span className="font-semibold truncate">
                {(lastSession.metadata as { exam_name?: string }).exam_name ?? "sessione precedente"}
              </span>
            </button>
          )}
        </div>

        {/* ── Form ─────────────────────────────────────────────────── */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">

          {/* Earnings preview live */}
          <div className={`rounded-xl border px-4 py-3.5 transition-all duration-300 ${
            preview
              ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800/40 dark:bg-emerald-950/20"
              : "border-dashed border-border bg-muted/30"
          }`}>
            {preview ? (
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm border border-border/50">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Durata</p>
                    <p className="text-sm font-bold text-foreground">{preview.duration}</p>
                  </div>
                </div>
                <Separator orientation="vertical" className="h-8" />
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 border border-emerald-200">
                    <PoundSterling className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Stimato</p>
                    <p className="text-sm font-bold text-emerald-600">£{preview.earned.toFixed(2)}</p>
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                  <Sparkles className="h-3 w-3" />
                  Live
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-0.5">
                Imposta orario inizio e fine per vedere il guadagno stimato
              </p>
            )}
          </div>

          {/* Data + Orari */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-3 sm:col-span-1">
              <Field label="Data" error={form.formState.errors.session_date?.message}>
                <Input type="date" className="h-10" {...form.register("session_date")} />
              </Field>
            </div>
            <div>
              <Field label="Inizio" error={form.formState.errors.start_time?.message}>
                <Input type="time" className="h-10" {...form.register("start_time")} />
              </Field>
            </div>
            <div>
              <Field label="Fine" error={form.formState.errors.end_time?.message}>
                <Input type="time" className="h-10" {...form.register("end_time")} />
              </Field>
            </div>
          </div>

          <Separator />

          {/* Esame + Sede */}
          <Field label="Nome esame" error={form.formState.errors.exam_name?.message}>
            <Input
              className="h-10"
              placeholder="es. A-Level Mathematics Paper 1"
              {...form.register("exam_name")}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Sede / Scuola" error={form.formState.errors.location?.message}>
              <Input
                className="h-10"
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
                <SelectTrigger className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="invigilator">Invigilatore</SelectItem>
                  <SelectItem value="supervisor">Supervisore</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Tariffa oraria (£)" error={form.formState.errors.hourly_rate?.message}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">£</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                className="h-10 pl-7"
                {...form.register("hourly_rate", { valueAsNumber: true })}
              />
            </div>
          </Field>

          <Field label="Note" error={form.formState.errors.notes?.message}>
            <Textarea
              placeholder="Dettagli aggiuntivi su questa sessione..."
              className="resize-none text-sm"
              rows={2}
              {...form.register("notes")}
            />
          </Field>

          {serverError && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5">
              <p className="text-sm text-destructive">{serverError}</p>
            </div>
          )}

          {/* Footer actions */}
          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Annulla
            </Button>
            <Button type="submit" className="flex-1 font-semibold" disabled={isLoading}>
              {isLoading
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvataggio…</>
                : isEdit ? "Salva modifiche" : "Registra sessione"
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Sotto-componente ─────────────────────────────────────────────────────────

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
