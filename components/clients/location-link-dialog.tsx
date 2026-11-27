"use client"

import { useState, useTransition } from "react"
import { ArrowUpRight, Link2 } from "lucide-react"
import { getLocationPortalLink, listLocationPortalLinks, revokeLocationPortalLink } from "@/app/actions/location-portal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

type LinkList = NonNullable<Awaited<ReturnType<typeof listLocationPortalLinks>>["links"]>
const dateLabel = new Intl.DateTimeFormat("it-IT", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Rome" })

export function LocationLinkDialog({ locations, workspaceId }: { locations: string[]; workspaceId: string }) {
  const [location, setLocation] = useState("")
  const [links, setLinks] = useState<LinkList | null>(null)
  const [visiblePath, setVisiblePath] = useState("")
  const [confirmId, setConfirmId] = useState("")
  const [message, setMessage] = useState("")
  const [listError, setListError] = useState("")
  const [pending, startTransition] = useTransition()

  async function refreshLinks() {
    const result = await listLocationPortalLinks(workspaceId)
    if (result.error) {
      setListError(result.error)
      return
    }
    setListError("")
    setLinks(result.links ?? [])
  }

  function run(action: () => Promise<void>) {
    startTransition(async () => {
      try { await action() }
      catch { setMessage("Operazione non riuscita. Riprova.") }
    })
  }

  function showPath(path: string) {
    setVisiblePath(new URL(path, window.location.origin).href)
    setMessage("")
  }

  return (
    <Dialog onOpenChange={(open) => {
      setVisiblePath("")
      setConfirmId("")
      setMessage("")
      if (open) run(refreshLinks)
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-10 gap-2 rounded-xl">
          <Link2 className="h-4 w-4" aria-hidden />
          Link clienti
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-xl sm:p-6">
        <div className="space-y-1 pr-8">
          <DialogTitle>Gestione link clienti</DialogTitle>
          <DialogDescription>I link danno accesso alla pagina del cliente selezionato.</DialogDescription>
        </div>
        {locations.length > 0 && (
          <form className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-background/60 p-3" onSubmit={(event) => {
            event.preventDefault()
            run(async () => {
              setMessage("")
              const result = await getLocationPortalLink(workspaceId, location)
              if (!result.path) { setMessage(result.error ?? "Impossibile generare il link."); return }
              showPath(result.path)
              setMessage("Nuovo link generato.")
              await refreshLinks()
            })
          }}>
            <label className="grid min-w-40 flex-1 gap-1.5 text-sm font-medium">
              Cliente
              <select required value={location} disabled={pending} onChange={(event) => setLocation(event.target.value)}
                className="h-9 rounded-xl border border-border bg-background px-3 text-sm">
                <option value="">Scegli un cliente</option>
                {locations.map((option) => <option value={option} key={option}>{option}</option>)}
              </select>
            </label>
            <Button type="submit" disabled={!location || pending}>Genera nuovo link</Button>
          </form>
        )}

        {visiblePath && <div className="space-y-2 rounded-xl border border-primary/15 bg-primary/5 p-3">
          <label className="grid gap-1.5 text-sm font-medium">
            Link da condividere
            <Input value={visiblePath} readOnly onFocus={(event) => event.currentTarget.select()} />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <a href={visiblePath} target="_blank" rel="noreferrer">Apri come cliente<ArrowUpRight className="size-3.5" aria-hidden /></a>
            </Button>
            <Button size="sm" variant="outline" onClick={async () => {
              try {
                await navigator.clipboard.writeText(visiblePath)
                setMessage("Link copiato.")
              } catch { setMessage("Seleziona il link per copiarlo.") }
            }}>Copia link</Button>
          </div>
        </div>}

        <section aria-labelledby="customer-links-heading" className="space-y-2">
          <h3 id="customer-links-heading" className="font-semibold">Link generati</h3>
          {listError && <div className="flex flex-wrap items-center gap-2">
            <p role="alert" className="text-sm text-destructive">{listError}</p>
            <Button size="sm" variant="outline" disabled={pending} onClick={() => run(refreshLinks)}>Riprova</Button>
          </div>}
          {!links && pending && <p role="status" className="text-sm text-muted-foreground">Caricamento link…</p>}
          {links?.length === 0 && <p className="text-sm text-muted-foreground">Nessun link generato per questo workspace.</p>}
          {!!links?.length && (
            <ul className="divide-y divide-border rounded-xl border border-border">
              {links.map((link) => <li key={link.id} className="space-y-2 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="break-words font-medium">{link.location}</span>
                      <Badge variant={link.revokedAt ? "outline" : "secondary"}>{link.revokedAt ? "Revocato" : "Attivo"}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {link.revokedAt ? `Revocato il ${dateLabel.format(new Date(link.revokedAt))}`
                        : link.createdAt ? `Creato il ${dateLabel.format(new Date(link.createdAt))}` : "Data di creazione assente"}
                    </p>
                  </div>
                  {!link.revokedAt && <div className="flex flex-wrap gap-1.5">
                    {link.path && <Button size="sm" variant="outline" disabled={pending} onClick={() => showPath(link.path!)}>Mostra link</Button>}
                    <Button size="sm" variant="ghost" className="text-destructive" disabled={pending}
                      onClick={() => setConfirmId(link.id)}>Revoca</Button>
                  </div>}
                </div>
                {!link.revokedAt && !link.path && <p className="text-xs text-muted-foreground">Il codice di questo link non è recuperabile.</p>}
                {confirmId === link.id && !link.revokedAt && (
                  <div className="flex flex-wrap items-center gap-2 rounded-lg bg-destructive/5 p-2">
                    <p className="w-full text-xs text-muted-foreground">Le persone che usano questo link perderanno l’accesso.</p>
                    <Button size="sm" variant="destructive" disabled={pending} onClick={() => run(async () => {
                      setMessage("")
                      const result = await revokeLocationPortalLink(workspaceId, link.id)
                      if (result.error) { setMessage(result.error); return }
                      setVisiblePath("")
                      setConfirmId("")
                      setMessage("Link revocato.")
                      await refreshLinks()
                    })}>Conferma revoca</Button>
                    <Button size="sm" variant="outline" disabled={pending} onClick={() => setConfirmId("")}>Annulla</Button>
                  </div>
                )}
              </li>)}
            </ul>
          )}
        </section>
        {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
      </DialogContent>
    </Dialog>
  )
}
