"use client"

import { useState, useTransition } from "react"
import { Link2 } from "lucide-react"
import { getLocationPortalLink } from "@/app/actions/location-portal"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

export function LocationLinkDialog({ locations, workspaceId }: { locations: string[]; workspaceId: string }) {
  const [location, setLocation] = useState("")
  const [link, setLink] = useState("")
  const [message, setMessage] = useState("")
  const [pending, startTransition] = useTransition()
  if (!locations.length) return null

  return (
    <Dialog onOpenChange={(open) => {
      if (!open) {
        setLocation("")
        setLink("")
        setMessage("")
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-10 gap-2 rounded-xl">
          <Link2 className="h-4 w-4" aria-hidden />
          Link cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="space-y-2">
        <DialogTitle>Link cliente</DialogTitle>
        <DialogDescription>Seleziona un cliente per aprire la pagina con le sue sessioni.</DialogDescription>
        <form className="space-y-3" onSubmit={(event) => {
          event.preventDefault()
          startTransition(async () => {
            setMessage("")
            setLink("")
            try {
              const result = await getLocationPortalLink(workspaceId, location)
              if (result.path) setLink(new URL(result.path, window.location.origin).href)
              else setMessage(result.error ?? "Impossibile generare il link.")
            } catch {
              setMessage("Impossibile generare il link. Riprova.")
            }
          })
        }}>
          <label className="grid gap-1.5 text-sm font-medium">
            Cliente
            <select required value={location} disabled={pending} onChange={(event) => {
              setLocation(event.target.value)
              setLink("")
              setMessage("")
            }} className="rounded-xl border border-border bg-background px-3 py-2 text-sm">
              <option value="">Scegli un cliente</option>
              {locations.map((option) => <option value={option} key={option}>{option}</option>)}
            </select>
          </label>
          <Button type="submit" disabled={!location || pending} size="sm">{pending ? "Generazione…" : "Genera link"}</Button>
        </form>
        {link && <div className="space-y-2">
          <Input value={link} readOnly aria-label="Link personale del cliente" onFocus={(event) => event.currentTarget.select()} />
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <a href={link} target="_blank" rel="noreferrer">Apri come cliente</a>
            </Button>
            <Button size="sm" variant="outline" onClick={async () => {
              try {
                await navigator.clipboard.writeText(link)
                setMessage("Link copiato.")
              } catch {
                setMessage("Seleziona il link per copiarlo.")
              }
            }}>Copia link</Button>
          </div>
        </div>}
        {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
      </DialogContent>
    </Dialog>
  )
}
