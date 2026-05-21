import { Info, Waveform, Drop, Sparkle } from '@phosphor-icons/react'

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
      <h4 className="text-[10px] font-medium text-[var(--mf-muted)] uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
        <div className="size-4 rounded-md bg-pink-500/10 flex items-center justify-center text-pink-500">
          <Info size={10} weight="bold" />
        </div>
        Biological Snapshot
      </h4>
      
      <div className="space-y-2">
        <div className="bg-[var(--mf-card)]/40 border border-[var(--mf-border)]/50 rounded-[12px] p-2.5 transition-all hover:bg-[var(--mf-card)]/60">
          <div className="flex justify-between items-center mb-1.5">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500">
                <Drop size={12} weight="fill" />
              </div>
              <span className="text-[11px] text-[var(--mf-text-strong)] font-normal">Estrogen Level</span>
            </div>
            <span className="text-[11px] font-medium text-pink-500">{estrogen}</span>
          </div>
          
          <div className="flex items-center gap-1 h-1 w-full">
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

        <div className="bg-[var(--mf-card)]/40 border border-[var(--mf-border)]/50 rounded-[16px] p-3 transition-all hover:bg-[var(--mf-card)]/60">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-500">
                <Waveform size={12} weight="bold" />
              </div>
              <span className="text-[11px] text-[var(--mf-text-strong)] font-normal">Progesterone Level</span>
            </div>
            <span className="text-[11px] font-medium text-violet-500">{progesterone}</span>
          </div>
          
          <div className="flex items-center gap-1 h-1 w-full">
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

        <div className="mt-3 pt-3 border-t border-[var(--mf-border)]/30">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkle size={10} className="text-pink-500" weight="fill" />
            <span className="text-[9px] font-medium text-pink-600 dark:text-pink-400 uppercase tracking-wider">Phase Insight:</span>
          </div>
          <p className="text-[var(--mf-text-strong)] leading-relaxed text-[10.5px] font-normal">
            {description}
          </p>
        </div>
      </div>
    </div>
  )
}
