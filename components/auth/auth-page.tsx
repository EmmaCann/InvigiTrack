"use client"

import { useState } from "react"
import Image from "next/image"
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
  const [loadL, setLoadL] = useState(false)
  const [loadR, setLoadR] = useState(false)

  const lf = useForm<LV>({ resolver: zodResolver(loginSchema),    defaultValues: { email: "", password: "" } })
  const rf = useForm<RV>({ resolver: zodResolver(registerSchema), defaultValues: { email: "", password: "", secret_key: "" } })

  function toggle() {
    setReg(v => !v); setErrL(null); setErrR(null); lf.reset(); rf.reset()
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
        @keyframes aurora-1 {
          0%,100% { transform:translate(0,0) scale(1); }
          40%      { transform:translate(60px,-80px) scale(1.15); }
          70%      { transform:translate(-40px,50px) scale(0.9); }
        }
        @keyframes aurora-2 {
          0%,100% { transform:translate(0,0) scale(1); }
          40%      { transform:translate(-70px,60px) scale(0.92); }
          70%      { transform:translate(50px,-60px) scale(1.12); }
        }
        @keyframes aurora-3 {
          0%,100% { transform:translate(0,0) scale(1); }
          50%      { transform:translate(30px,80px) scale(1.08); }
        }
        @keyframes fade-up {
          from { opacity:0; transform:translateY(18px); }
          to   { opacity:1; transform:translateY(0);    }
        }
        .a1 { animation: aurora-1 18s ease-in-out infinite; }
        .a2 { animation: aurora-2 22s ease-in-out infinite; }
        .a3 { animation: aurora-3 28s ease-in-out infinite; }
        .fu { animation: fade-up  .5s ease-out both; }
        .fu1{ animation: fade-up  .5s .1s ease-out both; }
        .fu2{ animation: fade-up  .5s .2s ease-out both; }
        .fu3{ animation: fade-up  .5s .3s ease-out both; }
        .fu4{ animation: fade-up  .5s .4s ease-out both; }
      `}</style>

      {/* ── Sfondo globale dark ── */}
      <div className="relative flex min-h-[100dvh] overflow-hidden" style={{ background: "#080c18" }}>

        {/* Aurora bg layers */}
        <div className="a1 pointer-events-none absolute -left-60 -top-60 h-[700px] w-[700px] rounded-full opacity-40 blur-[130px]"
          style={{ background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)" }} />
        <div className="a2 pointer-events-none absolute -bottom-60 right-[20%] h-[600px] w-[600px] rounded-full opacity-30 blur-[110px]"
          style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)" }} />
        <div className="a3 pointer-events-none absolute right-0 top-[20%] h-[400px] w-[400px] rounded-full opacity-20 blur-[90px]"
          style={{ background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)" }} />

        {/* Dot grid */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,.8) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

        {/* ══════════════════════════════════════════════════════════════
            PANNELLO LOGIN (sinistra)
        ══════════════════════════════════════════════════════════════ */}
        <div
          className="absolute left-0 top-0 hidden h-full w-1/2 items-center justify-center px-16 lg:flex"
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

            <p className="mt-8 text-[13px] text-white/30 lg:hidden">
              Non hai un account?{" "}
              <button onClick={toggle} className="text-white/70 hover:text-white underline">Registrati</button>
            </p>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            PANNELLO REGISTER (destra)
        ══════════════════════════════════════════════════════════════ */}
        <div
          className="absolute right-0 top-0 hidden h-full w-1/2 items-center justify-center px-16 lg:flex"
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
                  <KeyRound className="h-3 w-3" /> Codice accesso <span className="font-normal normal-case tracking-normal text-white/20">— opzionale</span>
                </label>
                <input type="password" placeholder="Lascia vuoto se non ne hai uno" className={inp} {...rf.register("secret_key")} />
              </div>
              {errR && <ErrMsg msg={errR} />}
              <DarkBtn loading={loadR} label="Crea account" loadingLabel="Creazione…" />
            </form>

            <p className="mt-6 text-center text-[11px] leading-relaxed text-white/20">
              Continuando accetti{" "}
              <span className="cursor-pointer text-white/40 hover:text-white underline">Termini</span>
              {" "}e{" "}
              <span className="cursor-pointer text-white/40 hover:text-white underline">Privacy Policy</span>.
            </p>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            PANNELLO BRAND SCORREVOLE
        ══════════════════════════════════════════════════════════════ */}
        <div
          className="absolute top-0 hidden h-full w-1/2 lg:block"
          style={{
            left:       reg ? 0 : "50%",
            transition: "left .65s cubic-bezier(.77,0,.18,1)",
            zIndex:     10,
          }}
        >
          {/* Glass panel */}
          <div
            className="relative flex h-full flex-col items-center justify-center overflow-hidden px-10 text-center"
            style={{
              background:     "rgba(255,255,255,0.04)",
              backdropFilter: "blur(24px)",
              borderLeft:     reg ? "none" : "1px solid rgba(255,255,255,0.07)",
              borderRight:    reg ? "1px solid rgba(255,255,255,0.07)" : "none",
            }}
          >
            {/* Inner glow */}
            <div className="pointer-events-none absolute inset-0"
              style={{
                background: reg
                  ? "radial-gradient(ellipse 80% 60% at 80% 30%, rgba(99,102,241,.15) 0%, transparent 60%)"
                  : "radial-gradient(ellipse 80% 60% at 20% 70%, rgba(59,130,246,.15) 0%, transparent 60%)",
                transition: "background 1s ease",
              }} />

            {/* Logo */}
            <div className="mb-6 flex h-[72px] w-[72px] items-center justify-center rounded-2xl"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <Image src="/logo.png" alt="InvigiTrack" width={36} height={40} priority />
            </div>

            <p className="text-[20px] font-bold tracking-tight text-white">InvigiTrack</p>
            <p className="mt-2 text-[13px] text-white/30">
              {reg ? "Hai già un account?" : "Non hai ancora un account?"}
            </p>

            {/* CTA */}
            <button
              onClick={toggle}
              className="mt-6 rounded-full px-8 py-2.5 text-[13px] font-semibold text-white transition-all"
              style={{ border: "1px solid rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.06)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
            >
              {reg ? "Accedi" : "Registrati"}
            </button>

            {/* Footer */}
            <p className="absolute bottom-8 text-[11px] text-white/15">
              © {new Date().getFullYear()} InvigiTrack
            </p>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            MOBILE
        ══════════════════════════════════════════════════════════════ */}
        <div className="flex w-full flex-col justify-center px-6 py-14 lg:hidden">
          <div className="mb-10 flex items-center gap-3">
            <Image src="/logo.png" alt="InvigiTrack" width={30} height={33} priority />
            <span className="text-[15px] font-bold text-white">InvigiTrack</span>
          </div>

          {/* Tab */}
          <div className="mb-8 flex gap-6 border-b border-white/10">
            {(["login", "register"] as const).map(t => (
              <button key={t}
                onClick={() => { setReg(t === "register"); setErrL(null); setErrR(null); lf.reset(); rf.reset() }}
                className={`-mb-px pb-3 text-sm font-semibold transition-all ${
                  (t === "register") === reg
                    ? "border-b-2 border-white text-white"
                    : "text-white/30 hover:text-white/60"
                }`}
              >
                {t === "login" ? "Accedi" : "Registrati"}
              </button>
            ))}
          </div>

          {!reg ? (
            <form onSubmit={lf.handleSubmit(handleLogin)} className="space-y-7">
              <UField id="mle" label="Email" type="email" placeholder="tu@esempio.com"
                reg={lf.register("email")} err={lf.formState.errors.email?.message} />
              <UField id="mlp" label="Password" type="password" placeholder="••••••••"
                reg={lf.register("password")} err={lf.formState.errors.password?.message} />
              {errL && <ErrMsg msg={errL} />}
              <DarkBtn loading={loadL} label="Accedi" loadingLabel="Accesso…" />
            </form>
          ) : (
            <form onSubmit={rf.handleSubmit(handleRegister)} className="space-y-7">
              <UField id="mre" label="Email" type="email" placeholder="tu@esempio.com"
                reg={rf.register("email")} err={rf.formState.errors.email?.message} />
              <UField id="mrp" label="Password" type="password" placeholder="Min. 8 caratteri"
                reg={rf.register("password")} err={rf.formState.errors.password?.message} />
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-white/30">
                  Codice accesso <span className="font-normal normal-case text-white/20">— opzionale</span>
                </label>
                <input type="password" placeholder="Lascia vuoto se non ne hai uno" className={inp} {...rf.register("secret_key")} />
              </div>
              {errR && <ErrMsg msg={errR} />}
              <DarkBtn loading={loadR} label="Crea account" loadingLabel="Creazione…" />
            </form>
          )}
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
