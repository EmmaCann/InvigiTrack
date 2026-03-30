"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, KeyRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { login, register } from "@/app/actions/auth"

// ─── Schemi separati per login e registrazione ───────────────────────────────

const loginSchema = z.object({
  email:    z.string().email("Email non valida"),
  password: z.string().min(8, "Minimo 8 caratteri"),
})

const registerSchema = z.object({
  email:      z.string().email("Email non valida"),
  password:   z.string().min(8, "Minimo 8 caratteri"),
  secret_key: z.string().optional(),  // opzionale — se corretta → account admin
})

type LoginValues    = z.infer<typeof loginSchema>
type RegisterValues = z.infer<typeof registerSchema>

// ─── Componente ──────────────────────────────────────────────────────────────

export function AuthForm() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", secret_key: "" },
  })

  function resetErrors() {
    setServerError(null)
  }

  async function handleLogin(values: LoginValues) {
    setServerError(null)
    setIsLoading(true)
    const fd = new FormData()
    fd.set("email", values.email)
    fd.set("password", values.password)
    const result = await login(fd)
    if (result?.error) {
      setServerError(result.error)
      setIsLoading(false)
    }
  }

  async function handleRegister(values: RegisterValues) {
    setServerError(null)
    setIsLoading(true)
    const fd = new FormData()
    fd.set("email", values.email)
    fd.set("password", values.password)
    if (values.secret_key) fd.set("secret_key", values.secret_key)
    const result = await register(fd)
    if (result?.error) {
      setServerError(result.error)
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-[380px] border-border/60 shadow-xl shadow-black/[0.06]">
      <CardContent className="p-6">
        <Tabs defaultValue="login" onValueChange={() => { resetErrors(); loginForm.reset(); registerForm.reset() }}>

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

            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <FieldGroup
                id="login-email"
                label="Email address"
                type="email"
                placeholder="you@example.com"
                registration={loginForm.register("email")}
                error={loginForm.formState.errors.email?.message}
              />
              <FieldGroup
                id="login-password"
                label="Password"
                type="password"
                placeholder="••••••••"
                registration={loginForm.register("password")}
                error={loginForm.formState.errors.password?.message}
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

            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
              <FieldGroup
                id="register-email"
                label="Email address"
                type="email"
                placeholder="you@example.com"
                registration={registerForm.register("email")}
                error={registerForm.formState.errors.email?.message}
              />
              <FieldGroup
                id="register-password"
                label="Password"
                type="password"
                placeholder="Min. 8 characters"
                registration={registerForm.register("password")}
                error={registerForm.formState.errors.password?.message}
              />

              {/* ── Access code (opzionale) ───────────────────────── */}
              <div className="space-y-1.5">
                <Label htmlFor="secret_key" className="text-xs font-medium text-foreground/80 flex items-center gap-1.5">
                  <KeyRound className="h-3 w-3 text-muted-foreground" />
                  Access code
                  <span className="text-muted-foreground font-normal">— optional</span>
                </Label>
                <Input
                  id="secret_key"
                  type="password"
                  placeholder="Leave blank if you don't have one"
                  className="h-9 text-sm"
                  {...registerForm.register("secret_key")}
                />
              </div>

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

// ─── Sotto-componenti ─────────────────────────────────────────────────────────

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
