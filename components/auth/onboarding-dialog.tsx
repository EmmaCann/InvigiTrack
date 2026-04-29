"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { AlertTriangle, Check, Loader2, ShieldCheck, UserRound } from "lucide-react"
import { createProfile } from "@/app/actions/auth"
import type { InvigilationRole } from "@/types/database"

// ── Schemi ────────────────────────────────────────────────────────────────────

const userSchema = z.object({
  full_name: z.string().min(2, "Il nome deve avere almeno 2 caratteri"),
  role_type: z.enum(["invigilator", "supervisor"], { message: "Seleziona un ruolo" }),
  default_hourly_rate: z
    .number({ error: "Inserisci un numero valido" })
    .min(0, "La tariffa non può essere negativa")
    .max(999, "Tariffa troppo alta"),
})

const PREDEFINED_CATEGORIES = [
  { value: "invigilation",     label: "Sorveglianza Esami"  },
  { value: "tutoring",         label: "Ripetizioni Private" },
  { value: "personal_training",label: "Personal Training"   },
] as const

const adminSchema = z.object({
  full_name: z.string().min(2, "Il nome deve avere almeno 2 caratteri"),
  primary_category: z.enum(
    ["invigilation", "tutoring", "personal_training", "custom"],
    { message: "Seleziona un tipo di lavoro" },
  ),
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

// ── Componente principale ─────────────────────────────────────────────────────

export function OnboardingDialog({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter()
  const [serverError,  setServerError]  = useState<string | null>(null)
  const [isLoading,    setIsLoading]    = useState(false)
  const [customLabel,  setCustomLabel]  = useState("")
  const [customDesc,   setCustomDesc]   = useState("")

  const userForm = useForm<UserValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { full_name: "", role_type: undefined, default_hourly_rate: 12.5 },
  })
  const adminForm = useForm<AdminValues>({
    resolver: zodResolver(adminSchema),
    defaultValues: { full_name: "", primary_category: undefined, role_type: undefined, default_hourly_rate: 12.5 },
  })
  const selectedCategory = adminForm.watch("primary_category")

  async function onSubmitUser(values: UserValues) {
    setServerError(null); setIsLoading(true)
    const result = await createProfile({
      full_name:           values.full_name,
      role_type:           values.role_type as InvigilationRole,
      default_hourly_rate: values.default_hourly_rate,
    })
    if (result?.error) { setServerError(result.error); setIsLoading(false); return }
    router.refresh()
  }

  async function onSubmitAdmin(values: AdminValues) {
    setServerError(null)

    // Valida categoria personalizzata prima di procedere
    if (values.primary_category === "custom" && !customLabel.trim()) {
      setServerError("Inserisci il nome del tipo di lavoro personalizzato")
      return
    }

    setIsLoading(true)
    const result = await createProfile({
      full_name:                    values.full_name,
      role_type:                    values.primary_category === "invigilation"
                                      ? (values.role_type as InvigilationRole)
                                      : null,
      default_hourly_rate:          values.default_hourly_rate,
      primary_category_slug:        values.primary_category,
      custom_category_label:        values.primary_category === "custom" ? customLabel.trim() : undefined,
      custom_category_description:  values.primary_category === "custom" ? customDesc.trim()  : undefined,
    })
    if (result?.error) { setServerError(result.error); setIsLoading(false); return }
    router.refresh()
  }

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">

      {/* Sfondo sfocato */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-primary/5 backdrop-blur-sm" />

      {/* Card */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/60 bg-white shadow-2xl shadow-black/[0.12]">

        {/* Header */}
        <div className="border-b border-border/20 bg-primary/[0.04] px-7 py-6">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
            {isAdmin
              ? <ShieldCheck className="h-5 w-5 text-primary" />
              : <UserRound   className="h-5 w-5 text-primary" />
            }
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Benvenuto/a su InvigiTrack!
            </h1>
            {isAdmin && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                <ShieldCheck className="h-3 w-3" /> Admin
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {isAdmin
              ? "Account admin configurato. Scegli il tuo tipo di lavoro principale — potrai attivare le altre viste in seguito."
              : "Prima di iniziare, dicci qualcosa su di te. Potrai modificare tutto nelle Impostazioni."}
          </p>
        </div>

        {/* ── Form USER ──────────────────────────────────────────────────── */}
        {!isAdmin && (
          <form onSubmit={userForm.handleSubmit(onSubmitUser)}>
            <div className="space-y-5 px-7 py-6">

              <OField label="Nome completo" error={userForm.formState.errors.full_name?.message}>
                <OInput
                  placeholder="Es. Emma Rossi"
                  {...userForm.register("full_name")}
                />
              </OField>

              <OField label="Ruolo" error={userForm.formState.errors.role_type?.message}>
                <OSelect
                  placeholder="Seleziona il tuo ruolo"
                  options={[
                    { value: "invigilator", label: "Invigilator" },
                    { value: "supervisor",  label: "Supervisor"  },
                  ]}
                  onChange={(v) => userForm.setValue("role_type", v as InvigilationRole, { shouldValidate: true })}
                />
              </OField>

              <OField label="Tariffa oraria (€)" error={userForm.formState.errors.default_hourly_rate?.message}>
                <OInput
                  type="number" step="0.01" min="0"
                  placeholder="Es. 12.50"
                  {...userForm.register("default_hourly_rate", { valueAsNumber: true })}
                />
              </OField>

              {serverError && <p className="text-sm text-destructive">{serverError}</p>}
            </div>

            <SubmitBar isLoading={isLoading} />
          </form>
        )}

        {/* ── Form ADMIN ─────────────────────────────────────────────────── */}
        {isAdmin && (
          <form onSubmit={adminForm.handleSubmit(onSubmitAdmin)}>
            <div className="space-y-5 px-7 py-6">

              <OField label="Nome completo" error={adminForm.formState.errors.full_name?.message}>
                <OInput
                  placeholder="Es. Emma Rossi"
                  {...adminForm.register("full_name")}
                />
              </OField>

              <OField label="Tipo di lavoro principale" error={adminForm.formState.errors.primary_category?.message}>
                <div className="space-y-1.5">
                  {/* Categorie predefinite */}
                  {PREDEFINED_CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => adminForm.setValue("primary_category", cat.value, { shouldValidate: true })}
                      className={`flex w-full items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm transition-all ${
                        selectedCategory === cat.value
                          ? "border-primary/40 bg-primary/5 text-primary ring-1 ring-primary/20"
                          : "border-border/60 bg-muted/20 text-foreground/80 hover:bg-muted/40"
                      }`}
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-bold text-muted-foreground">
                        {cat.label[0]}
                      </span>
                      <span className="flex-1 text-left">{cat.label}</span>
                      {selectedCategory === cat.value && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                    </button>
                  ))}

                  {/* Opzione categoria personalizzata */}
                  <button
                    type="button"
                    onClick={() => adminForm.setValue("primary_category", "custom", { shouldValidate: true })}
                    className={`flex w-full items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm transition-all ${
                      selectedCategory === "custom"
                        ? "border-amber-400/50 bg-amber-50/60 text-amber-800 ring-1 ring-amber-300/40"
                        : "border-dashed border-border/60 bg-white/10 text-muted-foreground hover:text-foreground hover:bg-muted/20"
                    }`}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-100 text-[11px]">✏️</span>
                    <span className="flex-1 text-left">Il tuo lavoro non è tra questi?</span>
                    {selectedCategory === "custom" && <Check className="h-3.5 w-3.5 shrink-0 text-amber-600" />}
                  </button>
                </div>
              </OField>

              {/* Pannello categoria personalizzata */}
              {selectedCategory === "custom" && (
                <div className="rounded-xl border border-amber-300/50 bg-amber-50/50 px-4 py-3.5 space-y-3">
                  <div className="flex items-start gap-2.5 text-amber-800">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                    <p className="text-xs leading-relaxed">
                      <span className="font-semibold">Attenzione:</span> la categoria che crei verrà aggiunta al database e sarà visibile a tutti gli utenti della piattaforma.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-amber-700">
                      Nome del tipo di lavoro <span className="text-amber-500">*</span>
                    </p>
                    <input
                      type="text"
                      value={customLabel}
                      onChange={(e) => setCustomLabel(e.target.value)}
                      placeholder="es. Life Coaching, Fisioterapia…"
                      className="w-full rounded-xl border border-amber-300/60 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-amber-400/60 focus:ring-2 focus:ring-amber-200/60"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-amber-700">
                      Descrizione <span className="text-amber-400/70">(opzionale)</span>
                    </p>
                    <input
                      type="text"
                      value={customDesc}
                      onChange={(e) => setCustomDesc(e.target.value)}
                      placeholder="Breve descrizione del tipo di lavoro…"
                      className="w-full rounded-xl border border-amber-300/60 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-amber-400/60 focus:ring-2 focus:ring-amber-200/60"
                    />
                  </div>
                </div>
              )}

              {selectedCategory === "invigilation" && (
                <OField label="Ruolo" error={adminForm.formState.errors.role_type?.message}>
                  <OSelect
                    placeholder="Seleziona il tuo ruolo"
                    options={[
                      { value: "invigilator", label: "Invigilator" },
                      { value: "supervisor",  label: "Supervisor"  },
                    ]}
                    onChange={(v) => adminForm.setValue("role_type", v as InvigilationRole, { shouldValidate: true })}
                  />
                </OField>
              )}

              <OField label="Tariffa oraria (€)" error={adminForm.formState.errors.default_hourly_rate?.message}>
                <OInput
                  type="number" step="0.01" min="0"
                  placeholder="Es. 12.50"
                  {...adminForm.register("default_hourly_rate", { valueAsNumber: true })}
                />
              </OField>

              {serverError && <p className="text-sm text-destructive">{serverError}</p>}
            </div>

            <SubmitBar isLoading={isLoading} />
          </form>
        )}

      </div>
    </div>
  )
}

// ── Sotto-componenti ──────────────────────────────────────────────────────────

function OField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground/70">{label}</p>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

const OInput = ({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={`w-full rounded-xl border border-border/60 bg-muted/30 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/10 ${className ?? ""}`}
    {...props}
  />
)

function OSelect({
  placeholder,
  options,
  onChange,
}: {
  placeholder: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <select
      defaultValue=""
      onChange={(e) => onChange(e.target.value)}
      className="w-full appearance-none rounded-xl border border-border/60 bg-muted/30 px-4 py-2.5 text-sm text-foreground outline-none transition-all focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/10"
    >
      <option value="" disabled className="text-muted-foreground">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

function SubmitBar({ isLoading }: { isLoading: boolean }) {
  return (
    <div className="border-t border-border/20 bg-muted/10 px-7 py-5">
      <button
        type="submit"
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-md shadow-primary/20 transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {isLoading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Salvataggio...</>
        ) : (
          "Inizia →"
        )}
      </button>
    </div>
  )
}
