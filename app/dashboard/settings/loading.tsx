/** Skeleton for the settings page */
export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 animate-pulse">
      {/* Section cards */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="glass rounded-2xl p-5">
          <div className="h-4 w-32 rounded-full bg-muted-foreground/20 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <div className="h-3 w-28 rounded-full bg-muted-foreground/15" />
                  <div className="h-2.5 w-20 rounded-full bg-muted-foreground/10" />
                </div>
                <div className="h-9 w-36 rounded-xl bg-muted-foreground/10" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
