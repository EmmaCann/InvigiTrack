"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { LessonUploadInput, LessonUploadResult } from "@/lib/clients/lesson-files"

export function LessonUploadForm({ task, label, endpoint, uploadAction }: {
  task: string | null
  label: string
  endpoint?: string
  uploadAction?: (payload: LessonUploadInput) => Promise<LessonUploadResult>
}) {
  const router = useRouter()
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)
  const [awaitingConfirmation, setAwaitingConfirmation] = useState("")

  async function send(payload: LessonUploadInput): Promise<LessonUploadResult> {
    if (uploadAction) return uploadAction(payload)
    if (!endpoint) return {}
    const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    if (response.status === 403) return { error: "Il link personale non è più valido." }
    return response.json()
  }

  return <form className="space-y-2" onSubmit={async (event) => {
    event.preventDefault()
    if (busy) return
    const form = event.currentTarget
    setBusy(true)
    setMessage("")
    try {
      let batch = awaitingConfirmation
      if (!batch) {
        const files = new FormData(form).getAll("files").filter((file): file is File => file instanceof File && file.size > 0)
        if (!files.length || files.length > 5 || files.some((file) => file.size > 20 * 1024 * 1024)) {
          setMessage("Seleziona fino a 5 file, massimo 20 MB ciascuno.")
          return
        }
        const result = await send({ step: "start", task, files: files.map(({ name, size }) => ({ name, size })) })
        if (!result.upload || result.urls?.length !== files.length) {
          setMessage(result.error ?? "Caricamento non disponibile.")
          return
        }
        for (const [index, file] of files.entries()) {
          const { url, mime } = result.urls[index]
          const response = await fetch(url, {
            method: "PUT",
            headers: { "Content-Type": mime, "Cache-Control": "max-age=0", "x-upsert": "false" },
            body: file,
          })
          if (!response.ok) throw new Error("Errore di caricamento")
        }
        batch = result.upload
        setAwaitingConfirmation(batch)
      }
      const result = await send({ step: "confirm", upload: batch })
      if (!result.confirmed) {
        setMessage(result.error ?? "Conferma non riuscita. Riprova.")
        return
      }
      form.reset()
      setAwaitingConfirmation("")
      setMessage("Caricamento completato.")
      router.refresh()
    } catch {
      setMessage("Caricamento interrotto. Riprova.")
    } finally {
      setBusy(false)
    }
  }}>
    <label className="grid gap-1.5 text-sm font-medium">
      {label}
      <Input type="file" name="files" multiple required={!awaitingConfirmation} disabled={busy || !!awaitingConfirmation}
        accept=".pdf,.docx,.txt,.jpg,.jpeg,.png" className="h-auto" />
    </label>
    <p className="text-xs text-muted-foreground">Fino a 5 file di massimo 20 MB ciascuno.</p>
    <div className="flex flex-wrap gap-2">
      <Button type="submit" size="sm" disabled={busy}>{busy ? "Caricamento…" : awaitingConfirmation ? "Riprova conferma" : "Carica file"}</Button>
      {awaitingConfirmation && <Button type="button" size="sm" variant="outline" disabled={busy}
        onClick={() => { setAwaitingConfirmation(""); setMessage("") }}>Scegli altri file</Button>}
    </div>
    {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
  </form>
}
