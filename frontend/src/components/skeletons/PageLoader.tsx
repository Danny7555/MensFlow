export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[80vh] w-full">
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 rounded-full border-2 border-[var(--mf-border)] border-t-[var(--mf-accent)] animate-spin" />
        <span className="text-xs text-muted-foreground">Loading...</span>
      </div>
    </div>
  )
}
