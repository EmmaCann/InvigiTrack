"use client"

/**
 * CLIENT COMPONENT — perché?
 * Usa useState, onClick, react-hook-form: tutti hook che richiedono il browser.
 * Il "use client" dice a Next.js "questo componente gira nel browser".
 * Analogia Laravel: come un Blade component con Alpine.js per interattività.
 */

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { login, register } from "@/app/actions/auth"

// ─── Schema di validazione con Zod ──────────────────────────────────────────
// Analogia Laravel: come le Form Request con le rules di validazione

const authSchema = z.object({
  email: z.string().email("Email non valida"),
  password: z.string().min(8, "La password deve avere almeno 8 caratteri"),
})

type AuthFormValues = z.infer<typeof authSchema>

// ─── Componente ─────────────────────────────────────────────────────────────

export function AuthForm() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: "", password: "" },
  })

  // Costruisce un FormData da inviare alla Server Action
  function buildFormData(values: AuthFormValues): FormData {
    const fd = new FormData()
    fd.set("email", values.email)
    fd.set("password", values.password)
    return fd
  }

  async function handleLogin(values: AuthFormValues) {
    setServerError(null)
    setIsLoading(true)
    const result = await login(buildFormData(values))
    // Se la Server Action fa redirect(), questa riga non viene mai raggiunta
    if (result?.error) {
      setServerError(result.error)
      setIsLoading(false)
    }
  }

  async function handleRegister(values: AuthFormValues) {
    setServerError(null)
    setIsLoading(true)
    const result = await register(buildFormData(values))
    if (result?.error) {
      setServerError(result.error)
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">InvigiTrack</CardTitle>
        <CardDescription>Accedi o crea un account</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tab Login / Registrati */}
        <Tabs defaultValue="login" onValueChange={() => setServerError(null)}>
          <TabsList className="w-full">
            <TabsTrigger value="login" className="flex-1">Accedi</TabsTrigger>
            <TabsTrigger value="register" className="flex-1">Registrati</TabsTrigger>
          </TabsList>

          {/* ── TAB LOGIN ── */}
          <TabsContent value="login">
            <form
              onSubmit={form.handleSubmit(handleLogin)}
              className="space-y-3 pt-2"
            >
              <div className="space-y-1">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="nome@esempio.it"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  {...form.register("password")}
                />
                {form.formState.errors.password && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              {serverError && (
                <p className="text-sm text-destructive">{serverError}</p>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Accesso in corso..." : "Accedi"}
              </Button>
            </form>
          </TabsContent>

          {/* ── TAB REGISTRATI ── */}
          <TabsContent value="register">
            <form
              onSubmit={form.handleSubmit(handleRegister)}
              className="space-y-3 pt-2"
            >
              <div className="space-y-1">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="nome@esempio.it"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="register-password">Password</Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="min. 8 caratteri"
                  {...form.register("password")}
                />
                {form.formState.errors.password && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              {serverError && (
                <p className="text-sm text-destructive">{serverError}</p>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Registrazione..." : "Crea account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

