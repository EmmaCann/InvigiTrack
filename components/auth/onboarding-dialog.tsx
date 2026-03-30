"use client"

/**
 * Dialog di onboarding — mostrato SOLO al primo login.
 * Raccoglie: nome completo, ruolo, tariffa oraria.
 *
 * Perché Client Component? Perché usa:
 * - useState per gestire il caricamento
 * - react-hook-form per il form interattivo
 * - Il Dialog di shadcn che richiede interattività browser
 *
 * Nota: il prop "open" è sempre true e non ha onOpenChange —
 * l'utente DEVE completare l'onboarding, non può chiudere il dialog.
 */

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"

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

import { createProfile } from "@/app/actions/auth"
import type { InvigilationRole } from "@/types/database"

// ─── Schema validazione ──────────────────────────────────────────────────────

const onboardingSchema = z.object({
  full_name: z.string().min(2, "Il nome deve avere almeno 2 caratteri"),
  role_type: z.enum(["invigilator", "supervisor"], {
    message: "Seleziona un ruolo",
  }),
  default_hourly_rate: z
    .number({ error: "Inserisci un numero valido" })
    .min(0, "La tariffa non può essere negativa")
    .max(999, "Tariffa troppo alta"),
})

type OnboardingValues = z.infer<typeof onboardingSchema>

// ─── Componente ─────────────────────────────────────────────────────────────

export function OnboardingDialog() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      full_name: "",
      role_type: undefined,
      default_hourly_rate: 12.5,
    },
  })

  async function onSubmit(values: OnboardingValues) {
    setServerError(null)
    setIsLoading(true)

    const result = await createProfile({
      full_name: values.full_name,
      role_type: values.role_type as InvigilationRole,
      default_hourly_rate: values.default_hourly_rate,
    })

    if (result?.error) {
      setServerError(result.error)
      setIsLoading(false)
      return
    }

    // Dopo il salvataggio, ricarichiamo la pagina per mostrare il "Ciao nome"
    // router.refresh() dice a Next.js di ri-fetchare i Server Components
    // senza un reload completo della pagina — come un soft refresh.
    router.refresh()
  }

  return (
    <Dialog open>
      {/* showCloseButton={false} — l'utente non può saltare l'onboarding */}
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Benvenuto/a su InvigiTrack!</DialogTitle>
          <DialogDescription>
            Prima di iniziare, dicci qualcosa su di te. Potrai modificare
            queste informazioni in qualsiasi momento nelle impostazioni.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Nome completo */}
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Nome completo</Label>
            <Input
              id="full_name"
              placeholder="Mario Rossi"
              {...form.register("full_name")}
            />
            {form.formState.errors.full_name && (
              <p className="text-xs text-destructive">
                {form.formState.errors.full_name.message}
              </p>
            )}
          </div>

          {/* Ruolo */}
          <div className="space-y-1.5">
            <Label htmlFor="role_type">Ruolo</Label>
            <Select
              onValueChange={(val) =>
                form.setValue("role_type", val as InvigilationRole, {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger id="role_type" className="w-full">
                <SelectValue placeholder="Seleziona il tuo ruolo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="invigilator">Invigilator</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.role_type && (
              <p className="text-xs text-destructive">
                {form.formState.errors.role_type.message}
              </p>
            )}
          </div>

          {/* Tariffa oraria */}
          <div className="space-y-1.5">
            <Label htmlFor="hourly_rate">
              Tariffa oraria (£)
              <span className="ml-1 text-xs text-muted-foreground font-normal">
                — modificabile nelle impostazioni
              </span>
            </Label>
            <Input
              id="hourly_rate"
              type="number"
              step="0.01"
              min="0"
              {...form.register("default_hourly_rate", {
                valueAsNumber: true,
              })}
            />
            {form.formState.errors.default_hourly_rate && (
              <p className="text-xs text-destructive">
                {form.formState.errors.default_hourly_rate.message}
              </p>
            )}
          </div>

          {serverError && (
            <p className="text-sm text-destructive">{serverError}</p>
          )}

          <DialogFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Salvataggio..." : "Inizia"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
