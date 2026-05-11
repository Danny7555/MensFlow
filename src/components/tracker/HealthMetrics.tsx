import { Plus } from '@phosphor-icons/react'
import { useState } from 'react'

export function HealthMetrics() {
  const [water, setWater] = useState(4)
  const [weight, setWeight] = useState(62.5)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 w-full max-w-[1050px] mx-auto px-2">
      <div className="bg-card border border-border rounded-3xl p-6 flex items-center justify-between group hover:border-[var(--mf-accent-border)] transition-all cursor-pointer">
        <div className="flex items-center gap-4">
          <img src="/images/water.png" alt="" className="size-12 object-contain" />
          <div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Water</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-medium text-foreground">{water * 250}</span>
              <span className="text-sm text-muted-foreground">ml</span>
            </div>
          </div>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); setWater(w => w + 1) }}
          className="size-10 rounded-full bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] flex items-center justify-center hover:scale-110 transition-transform"
        >
          <Plus size={20} weight="bold" />
        </button>
      </div>

      <div className="bg-card border border-border rounded-3xl p-6 flex items-center justify-between group hover:border-[var(--mf-accent-border)] transition-all cursor-pointer">
        <div className="flex items-center gap-4">
          <img src="/images/weight.png" alt="" className="size-12 object-cover rounded-2xl" />
          <div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Weight</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-medium text-foreground">{weight}</span>
              <span className="text-sm text-muted-foreground">kg</span>
            </div>
          </div>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); setWeight(w => w + 0.1) }}
          className="size-10 rounded-full bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] flex items-center justify-center hover:scale-110 transition-transform"
        >
          <Plus size={20} weight="bold" />
        </button>
      </div>
    </div>
  )
}
