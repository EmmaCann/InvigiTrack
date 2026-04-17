"use client"

import { useState } from "react"
import Image from "next/image"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, ArrowRight, KeyRound } from "lucide-react"
import { login, register } from "@/app/actions/auth"

// ── Schemi ────────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email:    z.string().email("Email non valida"),
  password: z.string().min(8, "Minimo 8 caratteri"),
})
const registerSchema = z.object({
  email:      z.string().email("Email non valida"),
  password:   z.string().min(8, "Minimo 8 caratteri"),
  secret_key: z.string().optional(),
})
type LV = z.infer<typeof loginSchema>
type RV = z.infer<typeof registerSchema>

// ── Stili input ────────────────────────────────────────────────────────────────

const inp =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-foreground placeholder:text-gray-400 outline-none transition-all focus:border-blue-400/60 focus:bg-white focus:ring-2 focus:ring-blue-400/10"

// ── Componente principale ─────────────────────────────────────────────────────

export function AuthPage() {
  const [reg,    setReg]    = useState(false)   // false = login, true = register
  const [errL,   setErrL]   = useState<string | null>(null)
  const [errR,   setErrR]   = useState<string | null>(null)
  const [loadL,  setLoadL]  = useState(false)
  const [loadR,  setLoadR]  = useState(false)

  const lf = useForm<LV>({ resolver: zodResolver(loginSchema),    defaultValues: { email: "", password: "" } })
  const rf = useForm<RV>({ resolver: zodResolver(registerSchema), defaultValues: { email: "", password: "", secret_key: "" } })

  function toggle() {
    setReg(!reg)
    setErrL(null); setErrR(null)
    lf.reset(); rf.reset()
  }

  async function handleLogin(v: LV) {
    setErrL(null); setLoadL(true)
    const fd = new FormData()
    fd.set("email", v.email); fd.set("password", v.password)
    const r = await login(fd)
    if (r?.error) { setErrL(r.error); setLoadL(false) }
  }

  async function handleRegister(v: RV) {
    setErrR(null); setLoadR(true)
    const fd = new FormData()
    fd.set("email", v.email); fd.set("password", v.password)
    if (v.secret_key) fd.set("secret_key", v.secret_key)
    const r = await register(fd)
    if (r?.error) { setErrR(r.error); setLoadR(false) }
  }

  return (
    <>
      <style>{`
        @keyframes ring-cw  { to { transform:rotate(360deg);  } }
        @keyframes ring-ccw { to { transform:rotate(-360deg); } }
        @keyframes glow-p {
          0%,100% { opacity:.3; transform:scale(1);    }
          50%      { opacity:.6; transform:scale(1.1); }
        }
        @keyframes fade-in {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0);    }
        }
        .rc  { animation: ring-cw   30s linear      infinite; }
        .rcc { animation: ring-ccw  22s linear      infinite; }
        .rc2 { animation: ring-cw   44s linear      infinite; }
        .gp  { animation: glow-p     5s ease-in-out infinite; }
        .fi  { animation: fade-in  .45s ease-out both; }
      `}</style>

      {/* ── Wrapper ── */}
      <div className="relative flex min-h-[100dvh] overflow-hidden bg-white">

        {/* ══════════════════════════════════════════════════════════════
            PANNELLO LOGIN  — posizione sinistra in default, nascosto
            quando brand scivola sopra
        ══════════════════════════════════════════════════════════════ */}
        <div
          className="absolute left-0 top-0 hidden h-full w-1/2 items-center justify-center px-16 lg:flex"
          style={{
            opacity:          reg ? 0 : 1,
            transform:        reg ? "translateX(-40px)" : "translateX(0)",
            transition:       "opacity .55s ease, transform .55s ease",
            pointerEvents:    reg ? "none" : "auto",
            zIndex:           1,
          }}
        >
          <div className="fi w-full max-w-[360px]">
            <h2 className="mb-1.5 text-[26px] font-bold tracking-tight text-gray-900">Bentornato/a</h2>
            <p className="mb-8 text-sm text-gray-400">Inserisci le credenziali per accedere</p>

            <form onSubmit={lf.handleSubmit(handleLogin)} className="space-y-4">
              <Field id="le" label="Email"    type="email"    placeholder="tu@esempio.com" reg={lf.register("email")}    err={lf.formState.errors.email?.message} />
              <Field id="lp" label="Password" type="password" placeholder="••••••••"       reg={lf.register("password")} err={lf.formState.errors.password?.message} />
              {errL && <Err msg={errL} />}
              <Btn loading={loadL} label="Accedi" loadingLabel="Accesso…" />
            </form>

            {/* Mobile toggle */}
            <p className="mt-6 text-center text-sm text-gray-400 lg:hidden">
              Non hai un account?{" "}
              <button onClick={toggle} className="font-semibold text-blue-600 hover:underline">Registrati</button>
            </p>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            PANNELLO REGISTER — posizione destra in default, nascosto
            quando brand è a destra
        ══════════════════════════════════════════════════════════════ */}
        <div
          className="absolute right-0 top-0 hidden h-full w-1/2 items-center justify-center px-16 lg:flex"
          style={{
            opacity:       reg ? 1 : 0,
            transform:     reg ? "translateX(0)" : "translateX(40px)",
            transition:    "opacity .55s ease, transform .55s ease",
            pointerEvents: reg ? "auto" : "none",
            zIndex:        1,
          }}
        >
          <div className="fi w-full max-w-[360px]">
            <h2 className="mb-1.5 text-[26px] font-bold tracking-tight text-gray-900">Crea il tuo account</h2>
            <p className="mb-8 text-sm text-gray-400">Inizia a usare InvigiTrack gratuitamente</p>

            <form onSubmit={rf.handleSubmit(handleRegister)} className="space-y-4">
              <Field id="re" label="Email"    type="email"    placeholder="tu@esempio.com"  reg={rf.register("email")}    err={rf.formState.errors.email?.message} />
              <Field id="rp" label="Password" type="password" placeholder="Min. 8 caratteri" reg={rf.register("password")} err={rf.formState.errors.password?.message} />
              <div className="space-y-1.5">
                <label htmlFor="sk" className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                  <KeyRound className="h-3 w-3 text-gray-400" />
                  Codice di accesso
                  <span className="font-normal text-gray-400">— opzionale</span>
                </label>
                <input id="sk" type="password" placeholder="Lascia vuoto se non ne hai uno" className={inp} {...rf.register("secret_key")} />
              </div>
              {errR && <Err msg={errR} />}
              <Btn loading={loadR} label="Crea account" loadingLabel="Creazione…" />
            </form>

            <p className="mt-5 text-center text-[11px] leading-relaxed text-gray-300">
              Continuando accetti{" "}
              <span className="cursor-pointer text-blue-500 hover:underline">Termini</span>
              {" "}e{" "}
              <span className="cursor-pointer text-blue-500 hover:underline">Privacy Policy</span>.
            </p>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            PANNELLO BRAND SCORREVOLE
            default: right-0 (destra)
            register: left-0 (sinistra)
        ══════════════════════════════════════════════════════════════ */}
        <div
          className="absolute top-0 hidden h-full w-1/2 lg:block"
          style={{
            left:       reg ? 0 : "50%",
            transition: "left .65s cubic-bezier(.77,0,.18,1)",
            zIndex:     10,
            background: `
              radial-gradient(ellipse 80% 60% at 20% 15%, rgba(99,102,241,.7) 0%, transparent 55%),
              radial-gradient(ellipse 70% 80% at 85% 85%, rgba(37,99,235,.55) 0%, transparent 55%),
              radial-gradient(ellipse 60% 50% at 55% 45%, rgba(79,70,229,.25) 0%, transparent 65%),
              #07091a
            `,
          }}
        >
          {/* Dot grid */}
          <div
            className="absolute inset-0 opacity-[0.045]"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,.9) 1px, transparent 1px)",
              backgroundSize: "36px 36px",
            }}
          />

          {/* Anelli */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div style={{ width: 420, height: 420, position: "relative" }}>
              <div className="rc  absolute inset-0 rounded-full"          style={{ border: "1px solid rgba(255,255,255,.09)" }} />
              <div className="rcc absolute rounded-full"                  style={{ inset: -56, border: "1px solid rgba(255,255,255,.06)" }} />
              <div className="rc2 absolute rounded-full"                  style={{ inset: -120, border: "1px solid rgba(255,255,255,.04)" }} />
            </div>
          </div>

          {/* Glow */}
          <div className="gp absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-400/20 blur-3xl" />

          {/* Contenuto centrato */}
          <div className="relative flex h-full flex-col items-center justify-center px-10 text-center">

            {/* Logo */}
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.15] bg-white/[0.10] shadow-2xl shadow-indigo-500/20 backdrop-blur-sm">
              <Image src="/logo.png" alt="InvigiTrack" width={34} height={38} priority />
            </div>

            <p className="mb-1 text-[22px] font-bold tracking-tight text-white">InvigiTrack</p>

            {/* Testo contestuale */}
            <p
              style={{
                opacity:    1,
                transition: "opacity .3s ease",
              }}
              className="mt-3 text-sm leading-relaxed text-white/50"
            >
              {reg
                ? "Hai già un account? Accedi qui."
                : "Non hai ancora un account? Creane uno."}
            </p>

            {/* Bottone toggle */}
            <button
              onClick={toggle}
              className="mt-6 rounded-full border border-white/30 bg-white/10 px-7 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
            >
              {reg ? "Accedi" : "Registrati"}
            </button>
          </div>

          {/* Linea di separazione laterale */}
          <div
            className="absolute top-0 h-full w-px bg-gradient-to-b from-transparent via-white/[0.07] to-transparent"
            style={{ left: reg ? "auto" : 0, right: reg ? 0 : "auto" }}
          />
        </div>

        {/* ══════════════════════════════════════════════════════════════
            LAYOUT MOBILE — semplice, niente sliding
        ══════════════════════════════════════════════════════════════ */}
        <div className="flex w-full flex-col items-center justify-center px-6 py-14 lg:hidden">

          <div className="mb-8 flex items-center gap-2.5">
            <Image src="/logo.png" alt="InvigiTrack" width={30} height={33} priority />
            <span className="text-[15px] font-bold tracking-tight text-gray-900">InvigiTrack</span>
          </div>

          <div className="w-full max-w-[360px] rounded-2xl border border-gray-100 bg-white p-8 shadow-xl shadow-black/[0.07]">

            {/* Tab mobile */}
            <div className="mb-7 flex gap-5 border-b border-gray-100">
              {(["login", "register"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setReg(t === "register"); setErrL(null); setErrR(null); lf.reset(); rf.reset() }}
                  className={`-mb-px pb-3 text-sm font-semibold transition-all ${
                    (t === "register") === reg
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {t === "login" ? "Accedi" : "Registrati"}
                </button>
              ))}
            </div>

            {!reg ? (
              <form onSubmit={lf.handleSubmit(handleLogin)} className="space-y-4">
                <Field id="mle" label="Email"    type="email"    placeholder="tu@esempio.com" reg={lf.register("email")}    err={lf.formState.errors.email?.message} />
                <Field id="mlp" label="Password" type="password" placeholder="••••••••"       reg={lf.register("password")} err={lf.formState.errors.password?.message} />
                {errL && <Err msg={errL} />}
                <Btn loading={loadL} label="Accedi" loadingLabel="Accesso…" />
              </form>
            ) : (
              <form onSubmit={rf.handleSubmit(handleRegister)} className="space-y-4">
                <Field id="mre" label="Email"    type="email"    placeholder="tu@esempio.com"  reg={rf.register("email")}    err={rf.formState.errors.email?.message} />
                <Field id="mrp" label="Password" type="password" placeholder="Min. 8 caratteri" reg={rf.register("password")} err={rf.formState.errors.password?.message} />
                <div className="space-y-1.5">
                  <label htmlFor="msk" className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                    <KeyRound className="h-3 w-3 text-gray-400" />
                    Codice di accesso <span className="font-normal text-gray-400">— opzionale</span>
                  </label>
                  <input id="msk" type="password" placeholder="Lascia vuoto se non ne hai uno" className={inp} {...rf.register("secret_key")} />
                </div>
                {errR && <Err msg={errR} />}
                <Btn loading={loadR} label="Crea account" loadingLabel="Creazione…" />
              </form>
            )}
          </div>

          <p className="mt-8 text-[11px] text-gray-300">© {new Date().getFullYear()} InvigiTrack</p>
        </div>

      </div>
    </>
  )
}

// ── Sotto-componenti ──────────────────────────────────────────────────────────

function Field({
  id, label, type, placeholder, reg, err,
}: {
  id: string; label: string; type: string; placeholder: string
  reg: ReturnType<ReturnType<typeof useForm>["register"]>
  err?: string
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-semibold text-gray-500">{label}</label>
      <input id={id} type={type} placeholder={placeholder} className={inp} {...reg} />
      {err && <p className="text-[11px] font-medium text-red-500">{err}</p>}
    </div>
  )
}

function Btn({ loading, label, loadingLabel }: { loading: boolean; label: string; loadingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="group mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-all hover:bg-blue-700 disabled:opacity-60"
    >
      {loading
        ? <><Loader2 className="h-4 w-4 animate-spin" /> {loadingLabel}</>
        : <>{label} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>
      }
    </button>
  )
}

function Err({ msg }: { msg: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
      <p className="text-xs font-medium text-red-600">{msg}</p>
    </div>
  )
}
