import { useMemo, useState } from 'react'
import { Heart } from '@phosphor-icons/react'
import { TIPS_DUMMY, type WellnessTip } from '../data/tipsData'
import { useDashboardData } from '../context/useDashboardData'

const CATS: { id: WellnessTip['category'] | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'nutrition', label: 'Nutrition' },
  { id: 'movement', label: 'Movement' },
  { id: 'rest', label: 'Rest' },
  { id: 'mind', label: 'Mind' },
]

export function TipsView() {
  const { data } = useDashboardData()
  const [cat, setCat] = useState<(typeof CATS)[number]['id']>('all')
  const [saved, setSaved] = useState<Set<string>>(
    () => new Set(TIPS_DUMMY.slice(0, 2).map((t) => t.id)),
  )

  const fromDashboard = useMemo(() => {
    const rotate: WellnessTip['category'][] = [
      'nutrition',
      'movement',
      'rest',
      'mind',
    ]
    return data.guidanceLines.map((text, i) => ({
      id: `dash-${i}`,
      category: rotate[i % rotate.length],
      title: `From your dashboard (${i + 1})`,
      summary: text,
      phaseTag: data.phaseLabel,
    }))
  }, [data.guidanceLines, data.phaseLabel])

  const merged: WellnessTip[] = useMemo(
    () => [
      ...fromDashboard.map((t) => ({
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
                <Heart
                  size={22}
                  weight={saved.has(t.id) ? 'fill' : 'regular'}
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
