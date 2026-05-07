/** Skeleton for the sessions page */
export default function SessionsLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="h-6 w-28 rounded-full bg-muted-foreground/15" />
        <div className="h-9 w-32 rounded-xl bg-muted-foreground/10" />
      </div>
      {/* Filter bar */}
      <div className="glass rounded-2xl p-3 flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-8 w-20 rounded-xl bg-muted-foreground/10" />
        ))}
      </div>
      {/* Session rows */}
      <div className="glass rounded-2xl overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-border/30 last:border-0">
            <div className="h-2 w-2 rounded-full bg-muted-foreground/20 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-2/5 rounded-full bg-muted-foreground/15" />
              <div className="h-2.5 w-1/3 rounded-full bg-muted-foreground/10" />
            </div>
            <div className="h-3 w-14 rounded-full bg-muted-foreground/15 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
