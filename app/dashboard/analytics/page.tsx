/**
 * PAGINA ANALYTICS — Server Component.
 * Placeholder — la costruiamo nel prossimo sprint.
 */

import { Card, CardContent } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"
import { PageHelpButton } from "@/components/help/page-help-button"

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
          Insights
        </p>
        <h2 className="text-2xl font-bold text-foreground">Analytics</h2>
      </div>

      <Card className="shadow-none border-border">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
            <BarChart3 className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-base font-semibold text-foreground">Coming soon</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Earnings trends, hours worked and payment history charts will be here.
          </p>
        </CardContent>
      </Card>

      <PageHelpButton help={{
        lines: [
          "Analizza le tue performance nel tempo.",
          "Qui troverai trend di ore e guadagni per periodo.",
        ],
        tutorialId: "overview",
      }} />
    </div>
  )
}
