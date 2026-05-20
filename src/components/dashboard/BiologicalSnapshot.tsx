import { Info } from '@phosphor-icons/react'

const getLevelStrength = (levelStr: string) => {
  const str = levelStr.toLowerCase()
  if (str.includes('low') || str.includes('crashing')) return 1
  if (str.includes('rising') || str.includes('moderate') || str.includes('starting')) return 2
  if (str.includes('peaking') || str.includes('high')) return 3
  return 1
}

interface BiologicalSnapshotProps {
  estrogen: string
  progesterone: string
  description: string
}

export function BiologicalSnapshot({ estrogen, progesterone, description }: BiologicalSnapshotProps) {
  return (
    <div>
      <h4 className="text-xs font-normal text-[var(--mf-muted)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Info size={14} className="text-[var(--mf-muted)]" />
        Biological Snapshot
      </h4>
      <div className="space-y-3 text-xs">
        <div className="flex justify-between items-center border-b border-[var(--mf-border)]/50 pb-2">
          <span className="text-[var(--mf-text)] font-normal">Estrogen Level:</span>
          <div className="flex items-center gap-2">
            <span className="font-normal text-pink-500">{estrogen}</span>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 3 }).map((_, idx) => {
                const estStrength = getLevelStrength(estrogen)
                return (
                  <div
                    key={idx}
                    className={`w-3.5 h-1.5 rounded-full transition-all duration-300 ${
                      idx < estStrength ? 'bg-pink-500' : 'bg-[var(--mf-border)]'
                    }`}
                  />
                )
              })}
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center border-b border-[var(--mf-border)]/50 pb-2">
          <span className="text-[var(--mf-text)] font-normal">Progesterone Level:</span>
          <div className="flex items-center gap-2">
            <span className="font-normal text-violet-500">{progesterone}</span>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 3 }).map((_, idx) => {
                const progStrength = getLevelStrength(progesterone)
                return (
                  <div
                    key={idx}
                    className={`w-3.5 h-1.5 rounded-full transition-all duration-300 ${
                      idx < progStrength ? 'bg-violet-500' : 'bg-[var(--mf-border)]'
                    }`}
                  />
                )
              })}
            </div>
          </div>
        </div>
        <p className="text-[var(--mf-text)] leading-relaxed pt-1 text-[11.5px] font-normal">
          {description}
        </p>
      </div>
    </div>
  )
}
