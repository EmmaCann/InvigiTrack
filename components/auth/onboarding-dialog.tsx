"use client"

/**
 * Dialog di onboarding — mostrato SOLO al primo login.
 *
 * Due varianti basate sul prop `isAdmin`:
 *
 *  USER  → sceglie solo Invigilator / Supervisor
 *  ADMIN → sceglie il tipo di lavoro primario (Invigilation / Tutoring / PT)
 *          Se sceglie Invigilation, appare anche il campo Role.
 *
 * Il prop "open" è sempre true e non ha onOpenChange —
 * l'utente DEVE completare l'onboarding, non può chiudere il dialog.
 */

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { ShieldCheck } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

import { createProfile } from "@/app/actions/auth"
import type { InvigilationRole } from "@/types/database"

// ─── Schema USER (invariato) ──────────────────────────────────────────────────

const userSchema = z.object({
  full_name: z.string().min(2, "Il nome deve avere almeno 2 caratteri"),
  role_type: z.enum(["invigilator", "supervisor"], {
    message: "Seleziona un ruolo",
  }),
  default_hourly_rate: z
    .number({ error: "Inserisci un numero valido" })
    .min(0, "La tariffa non può essere negativa")
    .max(999, "Tariffa troppo alta"),
})

// ─── Schema ADMIN ─────────────────────────────────────────────────────────────
// role_type è obbligatorio solo se primary_category = 'invigilation'

const adminSchema = z.object({
  full_name: z.string().min(2, "Il nome deve avere almeno 2 caratteri"),
  primary_category: z.enum(["invigilation", "tutoring", "personal_training"], {
    message: "Seleziona un tipo di lavoro",
  }),
  role_type: z.enum(["invigilator", "supervisor"]).optional(),
  default_hourly_rate: z
    .number({ error: "Inserisci un numero valido" })
    .min(0, "La tariffa non può essere negativa")
    .max(999, "Tariffa troppo alta"),
}).superRefine((data, ctx) => {
  if (data.primary_category === "invigilation" && !data.role_type) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Seleziona un ruolo per Exam Invigilation",
      path: ["role_type"],
    })
  }
})

type UserValues  = z.infer<typeof userSchema>
type AdminValues = z.infer<typeof adminSchema>

// ─── Componente ──────────────────────────────────────────────────────────────

export function OnboardingDialog({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading]     = useState(false)

  // ── Form USER ──────────────────────────────────────────────────────────────
  const userForm = useForm<UserValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { full_name: "", role_type: undefined, default_hourly_rate: 12.5 },
  })

  // ── Form ADMIN ─────────────────────────────────────────────────────────────
  const adminForm = useForm<AdminValues>({
    resolver: zodResolver(adminSchema),
    defaultValues: {
      full_name: "",
      primary_category: undefined,
      role_type: undefined,
      default_hourly_rate: 12.5,
    },
  })

  // Traccia la categoria selezionata dall'admin per mostrare/nascondere il campo role
  const selectedCategory = adminForm.watch("primary_category")

  // ── Submit USER ────────────────────────────────────────────────────────────
  async function onSubmitUser(values: UserValues) {
    setServerError(null)
    setIsLoading(true)
    const result = await createProfile({
      full_name:            values.full_name,
      role_type:            values.role_type as InvigilationRole,
      default_hourly_rate:  values.default_hourly_rate,
    })
    if (result?.error) { setServerError(result.error); setIsLoading(false); return }
    router.refresh()
  }

  // ── Submit ADMIN ───────────────────────────────────────────────────────────
  async function onSubmitAdmin(values: AdminValues) {
    setServerError(null)
    setIsLoading(true)
    const result = await createProfile({
      full_name:             values.full_name,
      role_type:             values.primary_category === "invigilation"
                               ? (values.role_type as InvigilationRole)
                               : null,
      default_hourly_rate:   values.default_hourly_rate,
      primary_category_slug: values.primary_category,
    })
    if (result?.error) { setServerError(result.error); setIsLoading(false); return }
    router.refresh()
  }

  return (
    <Dialog open>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>Benvenuto/a su InvigiTrack!</DialogTitle>
            {isAdmin && (
              <Badge variant="secondary" className="gap-1 text-[11px]">
                <ShieldCheck className="h-3 w-3" />
                Admin
              </Badge>
            )}
          </div>
          <DialogDescription>
            {isAdmin
              ? "Account admin configurato. Scegli il tuo tipo di lavoro principale — potrai attivare le altre viste in seguito."
              : "Prima di iniziare, dicci qualcosa su di te. Potrai modificare queste informazioni nelle impostazioni."}
          </DialogDescription>
        </DialogHeader>

        {/* ── FORM USER ─────────────────────────────────────────────────── */}
        {!isAdmin && (
          <form onSubmit={userForm.handleSubmit(onSubmitUser)} className="space-y-4">
            <Field label="Nome completo" error={userForm.formState.errors.full_name?.message}>
              <Input placeholder="Mario Rossi" {...userForm.register("full_name")} />
            </Field>

            <Field label="Ruolo" error={userForm.formState.errors.role_type?.message}>
              <Select
                onValueChange={(v) =>
                  userForm.setValue("role_type", v as InvigilationRole, { shouldValidate: true })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleziona il tuo ruolo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="invigilator">Invigilator</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <HourlyRateField
              registration={userForm.register("default_hourly_rate", { valueAsNumber: true })}
              error={userForm.formState.errors.default_hourly_rate?.message}
            />

            {serverError && <p className="text-sm text-destructive">{serverError}</p>}
            <DialogFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Salvataggio..." : "Inizia"}
              </Button>
            </DialogFooter>
          </form>
        )}

        {/* ── FORM ADMIN ────────────────────────────────────────────────── */}
        {isAdmin && (
          <form onSubmit={adminForm.handleSubmit(onSubmitAdmin)} className="space-y-4">
            <Field label="Nome completo" error={adminForm.formState.errors.full_name?.message}>
              <Input placeholder="Mario Rossi" {...adminForm.register("full_name")} />
            </Field>

            <Field label="Tipo di lavoro principale" error={adminForm.formState.errors.primary_category?.message}>
              <Select
                onValueChange={(v) =>
                  adminForm.setValue(
                    "primary_category",
                    v as "invigilation" | "tutoring" | "personal_training",
                    { shouldValidate: true },
                  )
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleziona il tipo di lavoro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="invigilation">Sorveglianza Esami</SelectItem>
                  <SelectItem value="tutoring">Ripetizioni Private</SelectItem>
                  <SelectItem value="personal_training">Personal Training</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {/* Ruolo — visibile solo se la categoria scelta è Invigilation */}
            {selectedCategory === "invigilation" && (
              <Field label="Ruolo" error={adminForm.formState.errors.role_type?.message}>
                <Select
                  onValueChange={(v) =>
                    adminForm.setValue("role_type", v as InvigilationRole, { shouldValidate: true })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleziona il tuo ruolo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="invigilator">Invigilator</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            )}

            <HourlyRateField
              registration={adminForm.register("default_hourly_rate", { valueAsNumber: true })}
              error={adminForm.formState.errors.default_hourly_rate?.message}
            />

            {serverError && <p className="text-sm text-destructive">{serverError}</p>}
            <DialogFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Salvataggio..." : "Inizia"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── Sotto-componenti ─────────────────────────────────────────────────────────

function Field({
  label, error, children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function HourlyRateField({
  registration, error,
}: {
  registration: ReturnType<ReturnType<typeof useForm>["register"]>
  error?: string
}) {
  return (
    <Field
      label="Tariffa oraria (£)"
      error={error}
    >
      <Input
        type="number"
        step="0.01"
        min="0"
        {...registration}
      />
    </Field>
  )
}
