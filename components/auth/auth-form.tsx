"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { login, register } from "@/app/actions/auth"

// ─── Validazione ─────────────────────────────────────────────────────────────

const authSchema = z.object({
  email: z.string().email("Email non valida"),
  password: z.string().min(8, "Minimo 8 caratteri"),
})

type AuthFormValues = z.infer<typeof authSchema>

// ─── Componente ──────────────────────────────────────────────────────────────

export function AuthForm() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: "", password: "" },
  })

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
    <Card className="w-full max-w-[380px] border-border/60 shadow-xl shadow-black/[0.06]">
      <CardContent className="p-6">
        <Tabs defaultValue="login" onValueChange={() => { setServerError(null); form.reset() }}>

          {/* ── Tab switcher ────────────────────────────────────────── */}
          <TabsList className="mb-5 grid w-full grid-cols-2 bg-muted/70">
            <TabsTrigger value="login" className="text-sm font-medium">
              Sign in
            </TabsTrigger>
            <TabsTrigger value="register" className="text-sm font-medium">
              Create account
            </TabsTrigger>
          </TabsList>

          {/* ── Sign in ─────────────────────────────────────────────── */}
          <TabsContent value="login">
            <div className="mb-5">
              <h2 className="text-base font-semibold text-foreground">Welcome back</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sign in to your InvigiTrack account
              </p>
            </div>

            <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4">
              <FieldGroup
                id="login-email"
                label="Email address"
                type="email"
                placeholder="you@example.com"
                registration={form.register("email")}
                error={form.formState.errors.email?.message}
              />
              <FieldGroup
                id="login-password"
                label="Password"
                type="password"
                placeholder="••••••••"
                registration={form.register("password")}
                error={form.formState.errors.password?.message}
              />

              {serverError && <ErrorBanner message={serverError} />}

              <Button type="submit" className="w-full font-semibold" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…</> : "Sign in"}
              </Button>
            </form>
          </TabsContent>

          {/* ── Create account ──────────────────────────────────────── */}
          <TabsContent value="register">
            <div className="mb-5">
              <h2 className="text-base font-semibold text-foreground">Create your account</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Get started with InvigiTrack for free
              </p>
            </div>

            <form onSubmit={form.handleSubmit(handleRegister)} className="space-y-4">
              <FieldGroup
                id="register-email"
                label="Email address"
                type="email"
                placeholder="you@example.com"
                registration={form.register("email")}
                error={form.formState.errors.email?.message}
              />
              <FieldGroup
                id="register-password"
                label="Password"
                type="password"
                placeholder="Min. 8 characters"
                registration={form.register("password")}
                error={form.formState.errors.password?.message}
              />

              {serverError && <ErrorBanner message={serverError} />}

              <Button type="submit" className="w-full font-semibold" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account…</> : "Create account"}
              </Button>

              <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
                By creating an account you agree to our{" "}
                <span className="text-primary cursor-pointer hover:underline">Terms of Service</span>
                {" "}and{" "}
                <span className="text-primary cursor-pointer hover:underline">Privacy Policy</span>.
              </p>
            </form>
          </TabsContent>

        </Tabs>
      </CardContent>
    </Card>
  )
}

// ─── Sotto-componenti per pulizia ─────────────────────────────────────────────

function FieldGroup({
  id, label, type, placeholder, registration, error,
}: {
  id: string
  label: string
  type: string
  placeholder: string
  registration: ReturnType<ReturnType<typeof useForm>["register"]>
  error?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-foreground/80">
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        className="h-9 text-sm"
        {...registration}
      />
      {error && (
        <p className="text-[11px] font-medium text-destructive">{error}</p>
      )}
    </div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5">
      <p className="text-xs font-medium text-destructive">{message}</p>
    </div>
  )
}
