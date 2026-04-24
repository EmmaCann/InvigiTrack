"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, KeyRound } from "lucide-react"
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

// ── Stile input underline ─────────────────────────────────────────────────────

const inp =
  "w-full border-0 border-b border-white/20 bg-transparent pb-2.5 pt-1 text-sm text-white placeholder:text-white/30 outline-none transition-all duration-300 focus:border-white/70"

// ── Componente principale ─────────────────────────────────────────────────────

export function AuthPage() {
  const [reg,   setReg]   = useState(false)
  const [errL,  setErrL]  = useState<string | null>(null)
  const [errR,  setErrR]  = useState<string | null>(null)
  const [loadL,  setLoadL]  = useState(false)
  const [loadR,  setLoadR]  = useState(false)
  const [loadML, setLoadML] = useState(false)
  const [loadMR, setLoadMR] = useState(false)
  const [errML,  setErrML]  = useState<string | null>(null)
  const [errMR,  setErrMR]  = useState<string | null>(null)

  // Istanze desktop
  const lf = useForm<LV>({ resolver: zodResolver(loginSchema),    defaultValues: { email: "", password: "" } })
  const rf = useForm<RV>({ resolver: zodResolver(registerSchema), defaultValues: { email: "", password: "", secret_key: "" } })
  // Istanze mobile separate (evita conflitti sui ref dei campi)
  const mlf = useForm<LV>({ resolver: zodResolver(loginSchema),    defaultValues: { email: "", password: "" } })
  const mrf = useForm<RV>({ resolver: zodResolver(registerSchema), defaultValues: { email: "", password: "", secret_key: "" } })

  function toggle() {
    setReg(v => !v)
    setErrL(null); setErrR(null); lf.reset(); rf.reset()
    setErrML(null); setErrMR(null); mlf.reset(); mrf.reset()
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

  async function handleMobileLogin(v: LV) {
    setErrML(null); setLoadML(true)
    const fd = new FormData()
    fd.set("email", v.email); fd.set("password", v.password)
    const r = await login(fd)
    if (r?.error) { setErrML(r.error); setLoadML(false) }
  }

  async function handleMobileRegister(v: RV) {
    setErrMR(null); setLoadMR(true)
    const fd = new FormData()
    fd.set("email", v.email); fd.set("password", v.password)
    if (v.secret_key) fd.set("secret_key", v.secret_key)
    const r = await register(fd)
    if (r?.error) { setErrMR(r.error); setLoadMR(false) }
  }

  return (
    <>
      <style>{`
        @keyframes fade-up {
          from { opacity:0; transform:translateY(18px); }
          to   { opacity:1; transform:translateY(0);    }
        }
        @keyframes fade-in {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:translateY(0);    }
        }
        .fu  { animation: fade-up .5s ease-out both; }
        .fu1 { animation: fade-up .5s .1s ease-out both; }
        .fu2 { animation: fade-up .5s .2s ease-out both; }
        .fu3 { animation: fade-up .5s .3s ease-out both; }
        .fu4 { animation: fade-up .5s .4s ease-out both; }
        .fi  { animation: fade-in .35s ease-out both; }
        .brand-name {
          font-family: var(--font-geist-sans), system-ui, sans-serif;
          font-weight: 800;
          font-size: 52px;
          letter-spacing: -0.03em;
          line-height: 1;
          color: rgba(220, 230, 245, 0.92);
        }
      `}</style>

      {/* ── Sfondo: foto Big Ben ── */}
      <div className="relative flex min-h-[100dvh] overflow-hidden bg-[#0a0c14]">

        {/* Immagine di sfondo */}
        <Image
          src="/big-ben.jpg"
          alt=""
          fill
          priority
          style={{ objectFit: "cover", objectPosition: "70% center" }}
          className="pointer-events-none select-none"
        />
        {/* Overlay scuro */}
        <div className="pointer-events-none absolute inset-0"
          style={{ background: "linear-gradient(135deg, rgba(5,8,20,0.68) 0%, rgba(10,14,30,0.55) 100%)" }} />

        {/* ══════════════════════════════════════════════════════════════
            PANNELLO LOGIN (sinistra) — desktop
        ══════════════════════════════════════════════════════════════ */}
        <div
          className="absolute left-0 top-0 hidden h-full w-1/2 items-center justify-center px-16 md:flex"
          style={{
            opacity:       reg ? 0 : 1,
            transform:     reg ? "translateX(-50px)" : "translateX(0)",
            transition:    "opacity .5s ease, transform .5s ease",
            pointerEvents: reg ? "none" : "auto",
            zIndex: 1,
          }}
        >
          <div className="w-full max-w-[340px]">
            <div className="fu mb-10">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/30">Bentornato/a</p>
              <h2 className="text-[32px] font-bold leading-tight tracking-tight text-white">Accedi al tuo<br />account</h2>
            </div>
            <form onSubmit={lf.handleSubmit(handleLogin)} className="space-y-7">
              <UField id="le" label="Email" type="email" placeholder="tu@esempio.com"
                reg={lf.register("email")} err={lf.formState.errors.email?.message} />
              <UField id="lp" label="Password" type="password" placeholder="••••••••"
                reg={lf.register("password")} err={lf.formState.errors.password?.message} />
              {errL && <ErrMsg msg={errL} />}
              <DarkBtn loading={loadL} label="Accedi" loadingLabel="Accesso…" />
            </form>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            PANNELLO REGISTER (destra) — desktop
        ══════════════════════════════════════════════════════════════ */}
        <div
          className="absolute right-0 top-0 hidden h-full w-1/2 items-center justify-center px-16 md:flex"
          style={{
            opacity:       reg ? 1 : 0,
            transform:     reg ? "translateX(0)" : "translateX(50px)",
            transition:    "opacity .5s ease, transform .5s ease",
            pointerEvents: reg ? "auto" : "none",
            zIndex: 1,
          }}
        >
          <div className="w-full max-w-[340px]">
            <div className="fu mb-10">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/30">Inizia ora</p>
              <h2 className="text-[32px] font-bold leading-tight tracking-tight text-white">Crea il tuo<br />account</h2>
            </div>
            <form onSubmit={rf.handleSubmit(handleRegister)} className="space-y-7">
              <UField id="re" label="Email" type="email" placeholder="tu@esempio.com"
                reg={rf.register("email")} err={rf.formState.errors.email?.message} />
              <UField id="rp" label="Password" type="password" placeholder="Min. 8 caratteri"
                reg={rf.register("password")} err={rf.formState.errors.password?.message} />
              <div>
                <label className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">
                  <KeyRound className="h-3 w-3" /> Codice accesso
                  <span className="font-normal normal-case tracking-normal text-white/20">— opzionale</span>
                </label>
                <input type="password" placeholder="Lascia vuoto se non ne hai uno" className={inp} {...rf.register("secret_key")} />
              </div>
              {errR && <ErrMsg msg={errR} />}
              <DarkBtn loading={loadR} label="Crea account" loadingLabel="Creazione…" />
            </form>
            <p className="mt-6 text-center text-[11px] leading-relaxed text-white/20">
              Continuando accetti{" "}
              <Link href="/terms"   target="_blank" className="text-white/40 hover:text-white underline">Termini</Link>
              {" "}e{" "}
              <Link href="/privacy" target="_blank" className="text-white/40 hover:text-white underline">Privacy Policy</Link>.
            </p>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            PANNELLO BRAND SCORREVOLE — desktop
        ══════════════════════════════════════════════════════════════ */}
        <div
          className="absolute top-0 hidden h-full w-1/2 md:block"
          style={{
            left:       reg ? 0 : "50%",
            transition: "left .65s cubic-bezier(.77,0,.18,1)",
            zIndex:     10,
          }}
        >
          <div
            className="relative flex h-full flex-col items-center justify-center overflow-hidden px-10 text-center"
            style={{
              background:     "rgba(255,255,255,0.04)",
              backdropFilter: "blur(16px)",
              borderLeft:     reg ? "none" : "1px solid rgba(255,255,255,0.07)",
              borderRight:    reg ? "1px solid rgba(255,255,255,0.07)" : "none",
            }}
          >
            <div className="pointer-events-none absolute inset-0"
              style={{
                background: reg
                  ? "radial-gradient(ellipse 80% 60% at 80% 30%, rgba(99,102,241,.15) 0%, transparent 60%)"
                  : "radial-gradient(ellipse 80% 60% at 20% 70%, rgba(59,130,246,.15) 0%, transparent 60%)",
                transition: "background 1s ease",
              }} />

            <Image src="/logo.png" alt="InvigiTrack" width={130} height={143} priority className="mb-6 drop-shadow-2xl" />
            <p className="brand-name">InvigiTrack</p>
            <p className="mt-3 text-[12px] font-light tracking-[0.12em] text-white/45">
              Organizza. Supervisiona. Semplifica.
            </p>
            <p className="mt-5 text-[13px] text-white/30">
              {reg ? "Hai già un account?" : "Non hai ancora un account?"}
            </p>
            <button
              onClick={toggle}
              className="mt-6 rounded-full px-8 py-2.5 text-[13px] font-semibold text-white transition-all"
              style={{ border: "1px solid rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.06)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
            >
              {reg ? "Accedi" : "Registrati"}
            </button>
            <p className="absolute bottom-8 text-[11px] text-white/15">
              © {new Date().getFullYear()} InvigiTrack
            </p>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            MOBILE — glass card centrata sulla foto
        ══════════════════════════════════════════════════════════════ */}
        <div className="flex min-h-[100dvh] w-full items-center justify-center px-5 py-10 md:hidden">
          <div
            className="w-full max-w-[360px] overflow-hidden rounded-3xl"
            style={{
              background:           "rgba(255,255,255,0.07)",
              backdropFilter:       "blur(28px)",
              WebkitBackdropFilter: "blur(28px)",
              border:               "1px solid rgba(255,255,255,0.12)",
              boxShadow:            "0 24px 80px rgba(0,0,0,0.45)",
            }}
          >
            {/* Header: logo + brand */}
            <div
              className="flex flex-col items-center px-7 pb-6 pt-8 text-center"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
            >
              <Image src="/logo.png" alt="InvigiTrack" width={72} height={79} priority className="mb-4 drop-shadow-2xl" />
              <p className="brand-name" style={{ fontSize: "36px" }}>InvigiTrack</p>
              <p className="mt-2 text-[11px] tracking-[0.12em] text-white/40">
                Organizza. Supervisiona. Semplifica.
              </p>
            </div>

            {/* Tab bar */}
            <div className="flex border-b border-white/10 px-7">
              {(["login", "register"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => { setReg(t === "register"); setErrL(null); setErrR(null); lf.reset(); rf.reset() }}
                  className={`-mb-px flex-1 py-3.5 text-[13px] font-semibold transition-all ${
                    (t === "register") === reg
                      ? "border-b-2 border-white/70 text-white"
                      : "text-white/30 hover:text-white/60"
                  }`}
                >
                  {t === "login" ? "Accedi" : "Registrati"}
                </button>
              ))}
            </div>

            {/* Form con animazione al cambio tab */}
            <div key={reg ? "reg" : "login"} className="fi px-7 py-7">
              {!reg ? (
                <form onSubmit={mlf.handleSubmit(handleMobileLogin)} className="space-y-6">
                  <UField id="mle" label="Email" type="email" placeholder="tu@esempio.com"
                    reg={mlf.register("email")} err={mlf.formState.errors.email?.message} />
                  <UField id="mlp" label="Password" type="password" placeholder="••••••••"
                    reg={mlf.register("password")} err={mlf.formState.errors.password?.message} />
                  {errML && <ErrMsg msg={errML} />}
                  <DarkBtn loading={loadML} label="Accedi" loadingLabel="Accesso…" />
                </form>
              ) : (
                <form onSubmit={mrf.handleSubmit(handleMobileRegister)} className="space-y-6">
                  <UField id="mre" label="Email" type="email" placeholder="tu@esempio.com"
                    reg={mrf.register("email")} err={mrf.formState.errors.email?.message} />
                  <UField id="mrp" label="Password" type="password" placeholder="Min. 8 caratteri"
                    reg={mrf.register("password")} err={mrf.formState.errors.password?.message} />
                  <div>
                    <label className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">
                      <KeyRound className="h-3 w-3" /> Codice accesso
                      <span className="font-normal normal-case tracking-normal text-white/20">— opzionale</span>
                    </label>
                    <input type="password" placeholder="Lascia vuoto se non ne hai uno" className={inp} {...mrf.register("secret_key")} />
                  </div>
                  {errMR && <ErrMsg msg={errMR} />}
                  <DarkBtn loading={loadMR} label="Crea account" loadingLabel="Creazione…" />
                </form>
              )}
            </div>

            {/* Footer card */}
            <p className="pb-5 text-center text-[11px] text-white/20">
              © {new Date().getFullYear()} InvigiTrack
            </p>
          </div>
        </div>

      </div>
    </>
  )
}

// ── Sotto-componenti ──────────────────────────────────────────────────────────

function UField({ id, label, type, placeholder, reg, err }: {
  id: string; label: string; type: string; placeholder: string
  reg: ReturnType<ReturnType<typeof useForm>["register"]>; err?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">
        {label}
      </label>
      <input id={id} type={type} placeholder={placeholder}
        className="w-full border-0 border-b border-white/20 bg-transparent pb-2.5 pt-1 text-sm text-white placeholder:text-white/25 outline-none transition-all duration-300 focus:border-white/60"
        {...reg}
      />
      {err && <p className="mt-1.5 text-[11px] text-red-400">{err}</p>}
    </div>
  )
}

function DarkBtn({ loading, label, loadingLabel }: { loading: boolean; label: string; loadingLabel: string }) {
  return (
    <button
      type="submit" disabled={loading}
      className="mt-2 w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all disabled:opacity-50"
      style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)" }}
      onMouseEnter={e => !loading && (e.currentTarget.style.background = "rgba(255,255,255,0.18)")}
      onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
    >
      {loading ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />{loadingLabel}</span> : label}
    </button>
  )
}

function ErrMsg({ msg }: { msg: string }) {
  return (
    <div className="rounded-xl px-3 py-2.5" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
      <p className="text-xs text-red-400">{msg}</p>
    </div>
  )
}
