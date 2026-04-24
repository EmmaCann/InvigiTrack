"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, KeyRound, ArrowRight } from "lucide-react"
import { login, register } from "@/app/actions/auth"

// --- Schemi -------------------------------------------------------------------

const loginSchema = z.object({
  email:    z.string().email("Email non valida"),
  password: z.string().min(1, "Inserisci la password"),
})

const registerSchema = z.object({
  email:      z.string().email("Email non valida"),
  password:   z.string().min(6, "Minimo 6 caratteri"),
  secret_key: z.string().optional(),
})

type LoginValues    = z.infer<typeof loginSchema>
type RegisterValues = z.infer<typeof registerSchema>

// --- Stili condivisi ----------------------------------------------------------

const inputBase =
  "w-full rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-all focus:border-primary/40 focus:bg-white focus:ring-3 focus:ring-primary/[0.07]"

// --- Componente principale ---------------------------------------------------

export function AuthForm({ dark: _ = false }: { dark?: boolean }) {
  const [tab,         setTab]         = useState<"login" | "register">("login")
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading,   setIsLoading]   = useState(false)

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", secret_key: "" },
  })

  function switchTab(t: "login" | "register") {
    setTab(t)
    setServerError(null)
    loginForm.reset()
    registerForm.reset()
  }

  async function handleLogin(values: LoginValues) {
    setServerError(null); setIsLoading(true)
    const fd = new FormData()
    fd.set("email", values.email); fd.set("password", values.password)
    const result = await login(fd)
    if (result?.error) { setServerError(result.error); setIsLoading(false) }
  }

  async function handleRegister(values: RegisterValues) {
    setServerError(null); setIsLoading(true)
    const fd = new FormData()
    fd.set("email", values.email); fd.set("password", values.password)
    if (values.secret_key) fd.set("secret_key", values.secret_key)
    const result = await register(fd)
    if (result?.error) { setServerError(result.error); setIsLoading(false) }
  }

  return (
    <div>
      {/* Heading */}
      <div className="mb-9">
        <h2 className="text-[26px] font-bold tracking-tight text-foreground">
          {tab === "login" ? "Bentornato/a" : "Crea il tuo account"}
        </h2>
        <p className="mt-1.5 text-[13px] text-muted-foreground">
          {tab === "login"
            ? "Inserisci le tue credenziali per accedere"
            : "Inizia a usare InvigiTrack gratuitamente"}
        </p>
      </div>

      {/* Tab switcher */}
      <div className="mb-7 flex gap-6 border-b border-border/50">
        {(["login", "register"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => switchTab(t)}
            className={`-mb-px pb-3 text-sm font-semibold transition-all ${
              tab === t
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "login" ? "Accedi" : "Registrati"}
          </button>
        ))}
      </div>

      {/* ── Login ── */}
      {tab === "login" && (
        <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
          <Field
            id="l-email" label="Email" type="email"
            placeholder="tu@esempio.com"
            registration={loginForm.register("email")}
            error={loginForm.formState.errors.email?.message}
          />
          <Field
            id="l-password" label="Password" type="password"
            placeholder="••••••••"
            registration={loginForm.register("password")}
            error={loginForm.formState.errors.password?.message}
          />

          {serverError && <ErrorBanner message={serverError} />}

          <SubmitBtn loading={isLoading} label="Accedi" loadingLabel="Accesso in corso…" />
        </form>
      )}

      {/* ── Registrati ── */}
      {tab === "register" && (
        <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
          <Field
            id="r-email" label="Email" type="email"
            placeholder="tu@esempio.com"
            registration={registerForm.register("email")}
            error={registerForm.formState.errors.email?.message}
          />
          <Field
            id="r-password" label="Password" type="password"
            placeholder="Min. 6 caratteri"
            registration={registerForm.register("password")}
            error={registerForm.formState.errors.password?.message}
          />

          <div className="space-y-1.5">
            <label htmlFor="secret_key" className="flex items-center gap-1.5 text-xs font-semibold text-foreground/70">
              <KeyRound className="h-3 w-3 text-muted-foreground" />
              Codice di accesso
              <span className="font-normal text-muted-foreground">— opzionale</span>
            </label>
            <input
              id="secret_key" type="password"
              placeholder="Lascia vuoto se non ne hai uno"
              className={inputBase}
              {...registerForm.register("secret_key")}
            />
          </div>

          {serverError && <ErrorBanner message={serverError} />}

          <SubmitBtn loading={isLoading} label="Crea account" loadingLabel="Creazione in corso…" />

          <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
            Continuando accetti i{" "}
            <Link href="/terms"   target="_blank" className="text-primary hover:underline">Termini di Servizio</Link>
            {" "}e la{" "}
            <Link href="/privacy" target="_blank" className="text-primary hover:underline">Privacy Policy</Link>.
          </p>
        </form>
      )}
    </div>
  )
}

// --- Sotto-componenti ---------------------------------------------------------

function Field({
  id, label, type, placeholder, registration, error,
}: {
  id: string; label: string; type: string; placeholder: string
  registration: ReturnType<ReturnType<typeof useForm>["register"]>
  error?: string
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-semibold text-foreground/70">
        {label}
      </label>
      <input id={id} type={type} placeholder={placeholder} className={inputBase} {...registration} />
      {error && <p className="text-[11px] font-medium text-destructive">{error}</p>}
    </div>
  )
}

function SubmitBtn({ loading, label, loadingLabel }: {
  loading: boolean; label: string; loadingLabel: string
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="group mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-primary/30 disabled:opacity-60"
    >
      {loading
        ? <><Loader2 className="h-4 w-4 animate-spin" /> {loadingLabel}</>
        : <>{label} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>
      }
    </button>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2.5">
      <p className="text-xs font-medium text-destructive">{message}</p>
    </div>
  )
}
