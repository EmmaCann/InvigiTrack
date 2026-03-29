/**
 * PAGINA SESSIONS — Server Component.
 * Placeholder — la costruiamo nel prossimo sprint.
 */

import { Card, CardContent } from "@/components/ui/card"
import { CalendarCheck } from "lucide-react"

export default function SessionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
            Academic Session Management
          </p>
          <h2 className="text-2xl font-bold text-foreground">Sessions</h2>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
          + New Session
        </button>
      </div>

      <Card className="shadow-none border-border">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
            <CalendarCheck className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-base font-semibold text-foreground">Coming soon</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Session management is being built. You'll be able to log, track and manage all your invigilation sessions here.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
