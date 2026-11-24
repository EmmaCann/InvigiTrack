"use client"

import { createContext, useContext, type ReactNode } from "react"

type ClientOption = { id: string; name: string }
const ClientOptions = createContext<ClientOption[] | null>(null)

export function ClientOptionsProvider({ options, children }: { options: ClientOption[] | null; children: ReactNode }) {
  return <ClientOptions.Provider value={options}>{children}</ClientOptions.Provider>
}

export function useClientOptions() {
  return useContext(ClientOptions)
}

export function ClientPicker({ value, onChange, disabled = false }: {
  value: string; onChange: (value: string) => void; disabled?: boolean
}) {
  const options = useClientOptions()
  if (!options) return null
  const nameCounts = new Map<string, number>()
  for (const client of options) nameCounts.set(client.name, (nameCounts.get(client.name) ?? 0) + 1)
  return <label className="grid gap-1.5 text-sm font-medium">
    Cliente (facoltativo)
    <select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}
      className="w-full rounded-xl border border-border/60 bg-white/70 px-3 py-2.5 text-sm">
      <option value="">Nessun cliente</option>
      {value && !options.some((client) => client.id === value) && <option value={value}>Cliente disattivato</option>}
      {options.map((client) => <option key={client.id} value={client.id}>
        {client.name}{(nameCounts.get(client.name) ?? 0) > 1 ? ` · ${client.id.slice(0, 8)}` : ""}
      </option>)}
    </select>
  </label>
}
