/** Skeleton for the calendar page */
export default function CalendarLoading() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px] animate-pulse">
      {/* Calendar grid */}
      <div className="glass rounded-2xl p-5">
        {/* Month header */}
        <div className="flex items-center justify-between mb-5">
          <div className="h-5 w-32 rounded-full bg-muted-foreground/15" />
          <div className="flex gap-2">
            <div className="h-8 w-8 rounded-xl bg-muted-foreground/10" />
            <div className="h-8 w-8 rounded-xl bg-muted-foreground/10" />
          </div>
        </div>
        {/* Day-of-week labels */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-5 rounded-full bg-muted-foreground/10 mx-auto w-6" />
          ))}
        </div>
        {/* Day cells — 5 rows */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-muted-foreground/[0.07]" />
          ))}
        </div>
      </div>
      {/* Day panel */}
      <div className="glass rounded-2xl p-4 h-56">
        <div className="h-3 w-20 rounded-full bg-muted-foreground/15 mb-3" />
        <div className="h-4 w-32 rounded-full bg-muted-foreground/20 mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-muted-foreground/10" />
          ))}
        </div>
      </div>
    </div>
  )
}
