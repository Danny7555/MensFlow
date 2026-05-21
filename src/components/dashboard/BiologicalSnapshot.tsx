import { Info, Waveform, Drop } from '@phosphor-icons/react'

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
    <div className="flex flex-col h-full">
      <h4 className="text-[10px] font-medium text-[var(--mf-muted)] uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
        <div className="size-5 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-500">
          <Info size={12} weight="bold" />
        </div>
        Biological Snapshot
      </h4>
      
      <div className="space-y-4 flex-grow">
        <div className="bg-[var(--mf-card)]/40 border border-[var(--mf-border)]/50 rounded-2xl p-3.5 transition-all hover:bg-[var(--mf-card)]/60">
          <div className="flex justify-between items-center mb-2.5">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500">
                <Drop size={14} weight="fill" />
              </div>
              <span className="text-[11px] text-[var(--mf-text-strong)] font-normal">Estrogen Level</span>
            </div>
            <span className="text-[11px] font-medium text-pink-500">{estrogen}</span>
          </div>
          
          <div className="flex items-center gap-1.5 h-1.5 w-full">
            {Array.from({ length: 3 }).map((_, idx) => {
              const estStrength = getLevelStrength(estrogen)
              return (
                <div
                  key={idx}
                  className={`flex-1 h-full rounded-full transition-all duration-500 ${
                    idx < estStrength 
                      ? 'bg-pink-500' 
                      : 'bg-[var(--mf-border)]/40'
                  }`}
                />
              )
            })}
          </div>
        </div>

        <div className="bg-[var(--mf-card)]/40 border border-[var(--mf-border)]/50 rounded-2xl p-3.5 transition-all hover:bg-[var(--mf-card)]/60">
          <div className="flex justify-between items-center mb-2.5">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-500">
                <Waveform size={14} weight="bold" />
              </div>
              <span className="text-[11px] text-[var(--mf-text-strong)] font-normal">Progesterone Level</span>
            </div>
            <span className="text-[11px] font-medium text-violet-500">{progesterone}</span>
          </div>
          
          <div className="flex items-center gap-1.5 h-1.5 w-full">
            {Array.from({ length: 3 }).map((_, idx) => {
              const progStrength = getLevelStrength(progesterone)
              return (
                <div
                  key={idx}
                  className={`flex-1 h-full rounded-full transition-all duration-500 ${
                    idx < progStrength 
                      ? 'bg-violet-500' 
                      : 'bg-[var(--mf-border)]/40'
                  }`}
                />
              )
            })}
          </div>
        </div>

        <div className="mt-2 px-1">
          <p className="text-[var(--mf-text)] leading-relaxed text-[11px] font-normal opacity-90">
            {description}
          </p>
        </div>
      </div>
    </div>
  )
}
