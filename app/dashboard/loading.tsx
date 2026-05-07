/** Skeleton for the main dashboard page */
export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* KPI cards row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass rounded-2xl p-4 h-24">
            <div className="h-3 w-16 rounded-full bg-muted-foreground/15 mb-3" />
            <div className="h-6 w-20 rounded-full bg-muted-foreground/20" />
          </div>
        ))}
      </div>
      {/* Two-column content */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass rounded-2xl p-5 h-64 lg:col-span-2">
          <div className="h-3 w-28 rounded-full bg-muted-foreground/15 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-muted-foreground/10 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-3/4 rounded-full bg-muted-foreground/15" />
                  <div className="h-2.5 w-1/2 rounded-full bg-muted-foreground/10" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="glass rounded-2xl p-5 h-64">
          <div className="h-3 w-20 rounded-full bg-muted-foreground/15 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-muted-foreground/10" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
