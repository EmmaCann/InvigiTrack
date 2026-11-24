import Link from "next/link"
import { notFound } from "next/navigation"
import { getClientManager } from "@/lib/clients/access"
import { readPages } from "@/lib/clients/records"
import { ClientNameForm } from "@/components/clients/client-controls"
import { ClientPanel } from "@/components/clients/portal-view"
import { Badge } from "@/components/ui/badge"

export default async function ClientsPage() {
  const manager = await getClientManager()
  if (!manager) notFound()
  const { db, workspaceId, userId } = manager
  const clients = await readPages<{ id: string; name: string; disabled_at: string | null }>(
    db.from("clients").select("id, name, disabled_at").eq("user_id", userId).eq("workspace_id", workspaceId).order("name").order("id"),
  )
  const nameCounts = new Map<string, number>()
  for (const client of clients) nameCounts.set(client.name, (nameCounts.get(client.name) ?? 0) + 1)
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Clienti</h1>
        <p className="text-sm text-muted-foreground">Gestisci lezioni, contenuti e accessi personali.</p>
      </header>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <ClientPanel title="Elenco clienti">
          {clients.length ? <ul className="divide-y divide-border">{clients.map((client) =>
            <li key={client.id}>
              <Link className="flex items-center justify-between gap-2 rounded-lg p-3 font-medium hover:bg-primary/5" href={`/dashboard/clients/${client.id}`}>
                <span>{client.name}{(nameCounts.get(client.name) ?? 0) > 1 && (
                  <span className="ml-2 text-xs text-muted-foreground">{client.id.slice(0, 8)}</span>
                )}</span>
                {client.disabled_at && <Badge variant="outline">Disattivato</Badge>}
              </Link>
            </li>)}</ul> : <p className="text-sm text-muted-foreground">Nessun cliente in questo workspace.</p>}
        </ClientPanel>
        <ClientPanel title="Nuovo cliente"><ClientNameForm workspaceId={workspaceId} /></ClientPanel>
      </div>
    </div>
  )
}
