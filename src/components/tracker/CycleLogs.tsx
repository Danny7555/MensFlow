import { useStore } from "@/store/useStore"
import { format, parseISO } from "date-fns"
import { SYMPTOM_DEFS } from "@/data/symptomsData"

export function CycleLogs() {
  const { logs } = useStore()
  
  const sortedLogs = logs.toSorted((a, b) => b.date.localeCompare(a.date)).slice(0, 5)

  if (logs.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-2xl font-medium text-foreground tracking-tight">Recent logs</h2>
      </div>

      <div className="space-y-3">
        {sortedLogs.map((log) => (
          <div key={log.date} className="flo-card">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">
                {format(parseISO(log.date), 'EEEE, MMMM d')}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {log.symptoms.map((sId) => {
                const sDef = SYMPTOM_DEFS.find(s => s.id === sId)
                if (!sDef) return null
                return (
                  <div 
                    key={sId}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50 text-xs font-medium"
                  >
                    <div className="size-2 rounded-full bg-[var(--mf-accent)]" />
                    {sDef.label}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
