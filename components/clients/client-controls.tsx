"use client"

import { useState, useTransition, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { changeClientAccess, saveClient, setClientsEnabled } from "@/app/actions/clients"

export function ClientForm({ submitAction, children, label, resetOnSuccess = false }: {
  submitAction: (form: FormData) => Promise<{ error?: string }>
  children: ReactNode
  label: string
  resetOnSuccess?: boolean
}) {
  const [message, setMessage] = useState("")
  const [pending, start] = useTransition()
  return (
    <form className="space-y-3" onSubmit={(event) => {
      event.preventDefault()
      const form = event.currentTarget
      const data = new FormData(form)
      start(async () => {
        try {
          const result = await submitAction(data)
          setMessage(result.error ?? "Salvataggio completato.")
          if (!result.error && resetOnSuccess) form.reset()
        }
        catch { setMessage("Operazione non riuscita. Riprova.") }
      })
    }}>
      <fieldset disabled={pending} className="space-y-3">
        {children}
        <Button type="submit" size="sm">{pending ? "Salvataggio…" : label}</Button>
      </fieldset>
      {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
    </form>
  )
}

export function WorkspaceClientToggle({ workspaceId, enabled }: { workspaceId: string; enabled: boolean }) {
  return (
    <ClientForm label={enabled ? "Disabilita area clienti" : "Abilita area clienti"}
      submitAction={() => setClientsEnabled(workspaceId, !enabled)}>
      <p className="text-sm text-muted-foreground">
        {enabled ? "Disabilitando l’area, i link personali vengono revocati."
          : "Abilita la gestione dei clienti e la conservazione dei dettagli delle sessioni archiviate in questo workspace."}
      </p>
    </ClientForm>
  )
}

export function ClientNameForm({ workspaceId, client }: { workspaceId: string; client?: { id: string; name: string } }) {
  const router = useRouter()
  return (
    <ClientForm label={client ? "Salva nome" : "Aggiungi cliente"} submitAction={async (form) => {
      const result = await saveClient(workspaceId, String(form.get("name")), client?.id)
      if (result.id && !client) router.push(`/dashboard/clients/${result.id}`)
      return { error: result.error }
    }}>
      <label className="grid gap-1.5 text-sm font-medium">
        Nome cliente
        <Input name="name" defaultValue={client?.name} maxLength={120} required />
      </label>
    </ClientForm>
  )
}

export function ClientLinkControls({ workspaceId, id, activeLink, disabled }: {
  workspaceId: string; id: string; activeLink: boolean; disabled: boolean
}) {
  const [link, setLink] = useState("")
  const [message, setMessage] = useState("")
  const [pending, start] = useTransition()
  function change(action: Parameters<typeof changeClientAccess>[2]) {
    start(async () => {
      try {
        const result = await changeClientAccess(workspaceId, id, action)
        setMessage(result.error ?? "Operazione completata.")
        if (!result.error) setLink(result.fragment ? new URL(result.fragment, window.location.origin).href : "")
      } catch { setMessage("Operazione non riuscita. Riprova.") }
    })
  }
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Chiunque abbia il link può accedere. Copialo quando viene generato.</p>
      <div className="flex flex-wrap gap-2">
        {!disabled && <Button size="sm" disabled={pending} onClick={() => change("generate")}>
          {activeLink ? "Rigenera link" : "Genera link"}
        </Button>}
        {activeLink && <Button size="sm" variant="outline" disabled={pending} onClick={() => change("revoke")}>Revoca link</Button>}
        <Button size="sm" variant="outline" disabled={pending} onClick={() => change(disabled ? "enable" : "disable")}>
          {disabled ? "Riattiva cliente" : "Disattiva cliente"}
        </Button>
      </div>
      {link && <div className="flex flex-wrap gap-2">
        <Input aria-label="Link personale" readOnly value={link} onFocus={(event) => event.target.select()} className="flex-1" />
        <Button variant="outline" onClick={async () => {
          try { await navigator.clipboard.writeText(link); setMessage("Link copiato.") }
          catch { setMessage("Seleziona il link per copiarlo.") }
        }}>Copia</Button>
      </div>}
      {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
    </div>
  )
}
