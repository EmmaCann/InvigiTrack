/** Skeleton for the payments page */
export default function PaymentsLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Tab bar */}
      <div className="flex gap-1 glass rounded-2xl p-1.5 w-fit">
        <div className="h-8 w-24 rounded-xl bg-muted-foreground/15" />
        <div className="h-8 w-24 rounded-xl bg-muted-foreground/10" />
      </div>
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass rounded-2xl p-4 h-20">
            <div className="h-2.5 w-16 rounded-full bg-muted-foreground/15 mb-3" />
            <div className="h-5 w-20 rounded-full bg-muted-foreground/20" />
          </div>
        ))}
      </div>
      {/* Payment cards */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass rounded-2xl p-4 h-20 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-muted-foreground/10 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/3 rounded-full bg-muted-foreground/15" />
              <div className="h-2.5 w-1/4 rounded-full bg-muted-foreground/10" />
            </div>
            <div className="h-4 w-16 rounded-full bg-muted-foreground/15 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
