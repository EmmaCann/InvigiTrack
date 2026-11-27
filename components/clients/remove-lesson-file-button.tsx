"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function RemoveLessonFileButton({ name, removeAction, endpoint }: {
  name: string
  removeAction?: () => Promise<{ error?: string }>
  endpoint?: string
}) {
  const router = useRouter()
  const [confirm, setConfirm] = useState(false)
  const [error, setError] = useState("")
  const [pending, startTransition] = useTransition()

  function remove() {
    startTransition(async () => {
      setError("")
      try {
        const result = removeAction ? await removeAction() : endpoint
          ? await fetch(endpoint, { method: "DELETE" }).then((response) => response.json() as Promise<{ error?: string }>)
          : { error: "Il file non può essere rimosso." }
        if (result.error) {
          setError(result.error)
          return
        }
        setConfirm(false)
        router.refresh()
      } catch { setError("Impossibile rimuovere il file. Riprova.") }
    })
  }

  if (!confirm) return <Button type="button" variant="ghost" size="icon-sm" aria-label={`Rimuovi ${name}`} title="Rimuovi file"
    className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => setConfirm(true)}>
    <Trash2 className="size-4" aria-hidden />
  </Button>

  return <div className="flex w-full flex-wrap items-center gap-2 rounded-xl border border-destructive/15 bg-destructive/5 p-2">
    <p className="mr-auto break-all text-xs font-medium">Rimuovere «{name}»?</p>
    <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => { setConfirm(false); setError("") }}>Annulla</Button>
    <Button type="button" size="sm" variant="destructive" disabled={pending} onClick={remove}>{pending ? "Rimozione…" : "Rimuovi"}</Button>
    {error && <p role="alert" className="basis-full text-xs text-destructive">{error}</p>}
  </div>
}
