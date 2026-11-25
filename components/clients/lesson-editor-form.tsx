"use client"

import { useState, useTransition, type ReactNode } from "react"
import { Button } from "@/components/ui/button"

export function LessonEditorForm({ saveAction, label, resetOnSave = false, children }: {
  saveAction: (form: FormData) => Promise<{ error?: string }>
  label: string
  resetOnSave?: boolean
  children: ReactNode
}) {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState("")

  return <form onSubmit={(event) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    startTransition(async () => {
      try {
        const result = await saveAction(data)
        if (!result.error && resetOnSave) form.reset()
        setMessage(result.error ?? "Salvato.")
      } catch { setMessage("Salvataggio non riuscito. Riprova.") }
    })
  }}>
    <fieldset disabled={pending} className="space-y-3">
      {children}
      <Button type="submit" size="sm">{pending ? "Salvataggio…" : label}</Button>
    </fieldset>
    {message && <p role="status" className="mt-2 text-sm text-muted-foreground">{message}</p>}
  </form>
}
