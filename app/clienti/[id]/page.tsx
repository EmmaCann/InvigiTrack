import { getClientMaterials } from "@/lib/clients/files"
import { PortalMaterials, pendingTaskCount } from "@/components/clients/materials"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { authorizePortal, uuidPattern } from "@/lib/clients/access"
import { getClientRecords } from "@/lib/clients/records"
import { PortalEntry } from "@/components/clients/portal-entry"
import { PortalView } from "@/components/clients/portal-view"

export const dynamic = "force-dynamic"
export const metadata: Metadata = {
  title: "Area cliente",
  description: "Area cliente personale",
  robots: { index: false, follow: false },
}

export default async function ClientPortal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!uuidPattern.test(id)) notFound()
  const access = await authorizePortal(id)
  const records = access ? await getClientRecords(access.db, access.client) : null
  const materials = access && records ? await getClientMaterials(access.db, id, records.lessons.map((lesson) => lesson.id)) : null
  return (
    <main className="min-h-dvh bg-[#f3f6fc] px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <PortalEntry id={id} authorized={Boolean(access)} />
        {access && records && materials && <PortalView name={access.client.name} records={records}
          taskCount={pendingTaskCount(materials)} materials={materials.tasks.length || materials.batches.length
            ? <PortalMaterials id={id} materials={materials} lessons={records.lessons} /> : undefined} />}
      </div>
    </main>
  )
}
