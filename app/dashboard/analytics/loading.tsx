/** Skeleton for the analytics page */
export default function AnalyticsLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="h-5 w-24 rounded-full bg-muted-foreground/15" />
        <div className="h-9 w-28 rounded-xl bg-muted-foreground/10" />
      </div>
      {/* Chart cards grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass rounded-2xl p-5 h-52">
            <div className="h-3 w-24 rounded-full bg-muted-foreground/15 mb-1" />
            <div className="h-2.5 w-16 rounded-full bg-muted-foreground/10 mb-4" />
            <div className="flex items-end gap-1.5 h-28 px-2">
              {Array.from({ length: 8 }).map((_, j) => (
                <div
                  key={j}
                  className="flex-1 rounded-t-md bg-muted-foreground/10"
                  style={{ height: `${30 + ((i * 3 + j * 7) % 60)}%` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
