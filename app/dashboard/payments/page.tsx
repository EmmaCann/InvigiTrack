/**
 * PAGINA PAYMENTS — Server Component.
 * Placeholder — la costruiamo nel prossimo sprint.
 */

import { Card, CardContent } from "@/components/ui/card"
import { CreditCard } from "lucide-react"

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
          Payment Tracking
        </p>
        <h2 className="text-2xl font-bold text-foreground">Payments</h2>
      </div>

      <Card className="shadow-none border-border">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
            <CreditCard className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-base font-semibold text-foreground">Coming soon</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Payment tracking and reconciliation will be available here.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
