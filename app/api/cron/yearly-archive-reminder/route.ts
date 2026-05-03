/**
 * Cron job — Promemoria annuale per compattare il database.
 *
 * Invocato da Vercel il 1° gennaio alle 09:00 UTC.
 * Crea una notifica broadcast (target_type = "all") visibile a tutti gli utenti.
 *
 * Sicurezza: Vercel invia automaticamente
 *   Authorization: Bearer <CRON_SECRET>
 * Il valore deve essere impostato nelle variabili d'ambiente Vercel
 * con il nome CRON_SECRET.
 */

import { NextResponse }     from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"

export async function GET(request: Request) {

  // ── Autorizzazione ────────────────────────────────────────────────────────
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error("[cron/yearly-archive-reminder] CRON_SECRET non configurata")
    return NextResponse.json({ error: "Configurazione mancante" }, { status: 500 })
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
  }

  // ── Corpo della notifica ──────────────────────────────────────────────────
  const prevYear = new Date().getFullYear() - 1

  const title   = `💾 Compatta il database del ${prevYear}`
  const message =
    `È iniziato un nuovo anno! Puoi liberare spazio archiviando le sessioni del ${prevYear} ` +
    `in formato aggregato: vai su Impostazioni → Gestione dati → Compatta database. ` +
    `I dati resteranno visibili nelle statistiche.`

  // ── Inserimento con service role (bypassa RLS) ────────────────────────────
  const supabase = createAdminClient()

  if (!supabase) {
    return NextResponse.json({ error: "Client admin non disponibile" }, { status: 500 })
  }

  const { error } = await supabase
    .from("notifications")
    .insert({
      target_type:    "all",
      target_role:    null,
      target_user_id: null,
      title,
      message,
      type:           "system",
      created_by:     null,   // notifica automatica di sistema
    })

  if (error) {
    console.error("[cron/yearly-archive-reminder] Errore inserimento:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log(`[cron/yearly-archive-reminder] Notifica ${prevYear} inviata con successo.`)
  return NextResponse.json({ ok: true, year: prevYear })
}
