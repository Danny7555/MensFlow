import { useMemo, useState, useEffect } from 'react'

import { TIPS_DUMMY, type WellnessTip } from '../data/tipsData'
import { useStore } from '../store/useStore'
import { TipsSkeleton } from '../components/skeletons/TipsSkeleton'
import { cn } from '@/lib/utils'

const CATS: { id: WellnessTip['category'] | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'nutrition', label: 'Nutrition' },
  { id: 'movement', label: 'Movement' },
  { id: 'rest', label: 'Rest' },
  { id: 'mind', label: 'Mind' },
]

export function TipsView() {
  const { dashboard: ownDashboard, partnerStatus, user } = useStore()

  const data = (user?.role === 'partner' && partnerStatus?.paired && partnerStatus?.cycle)
    ? partnerStatus.cycle
    : ownDashboard

  const [cat, setCat] = useState<(typeof CATS)[number]['id']>('all')
  const [saved, setSaved] = useState<Set<string>>(
    () => new Set(TIPS_DUMMY.slice(0, 2).map((t) => t.id)),
  )
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  const fromDashboard = useMemo(() => {
    const rotate: WellnessTip['category'][] = [
      'nutrition',
      'movement',
      'rest',
      'mind',
    ]
    const lines = (data && 'guidanceLines' in data) ? (data.guidanceLines || []) : []
    return lines.map((text: string, i: number) => ({
      id: `dash-${i}`,
      category: rotate[i % rotate.length],
      title: user?.role === 'partner' ? `From her dashboard (${i + 1})` : `From your dashboard (${i + 1})`,
      summary: text,
      phaseTag: data?.phaseLabel || '',
    }))
  }, [data, user?.role])

  const merged: WellnessTip[] = useMemo(
    () => [
      ...fromDashboard.map((t: { id: string; category: WellnessTip['category']; title: string; summary: string; phaseTag: string }) => ({
        id: t.id,
        category: t.category,
        title: t.title,
        summary: t.summary,
        phaseTag: t.phaseTag,
      })),
      ...TIPS_DUMMY,
    ],
    [fromDashboard],
  )

  const filtered = merged.filter(
    (t) => cat === 'all' || t.category === cat,
  )

  const toggleSave = (id: string) => {
    setSaved((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  if (isLoading) {
    return <TipsSkeleton />
  }

  return (
    <div className="tips-page">


      <div className="filter-chips" role="tablist" aria-label="Tip category">
        {CATS.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={cat === c.id}
            className={`filter-chip ${cat === c.id ? 'filter-chip--on' : ''}`}
            onClick={() => setCat(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <ul className="tips-grid">
        {filtered.map((t) => (
          <li key={t.id} className="tip-card">
            <div className="tip-card-top">
              <span className="tip-tag">{t.phaseTag}</span>
              <button
                type="button"
                className={`tip-heart ${saved.has(t.id) ? 'tip-heart--on' : ''}`}
                aria-pressed={saved.has(t.id)}
                aria-label={saved.has(t.id) ? 'Remove from saved' : 'Save tip'}
                onClick={() => toggleSave(t.id)}
              >
                <img 
                  src="/images/heart.png" 
                  alt="" 
                  width={20} 
                  height={20} 
                  className={cn(
                    "object-contain transition-all duration-300", 
                    !saved.has(t.id) && "opacity-40 grayscale"
                  )} 
                  aria-hidden 
                />
              </button>
            </div>
            <h2 className="tip-title">{t.title}</h2>
            <p className="tip-summary">{t.summary}</p>
            <span className="tip-cat">{t.category}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
