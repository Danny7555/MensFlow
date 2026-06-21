import { useMemo, useReducer, useState, useEffect, useCallback } from 'react'
import { Heart } from '@phosphor-icons/react'
import { useStore } from '../store/useStore'
import { TipsSkeleton } from '../components/skeletons/TipsSkeleton'
import { cn } from '@/lib/utils'
import { tipsApi } from '../services/tipsService'
import type { ApiWellnessTip } from '../services/tipsService'
import { toast } from 'sonner'
import { useSEO } from '../hooks/useSEO'

const CATS: { id: ApiWellnessTip['category'] | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'nutrition', label: 'Nutrition' },
  { id: 'movement', label: 'Movement' },
  { id: 'rest', label: 'Rest' },
  { id: 'mind', label: 'Mind' },
]

// ─── Tip Card ────────────────────────────────────────────────────────────────
interface TipCardProps {
  tip: ApiWellnessTip
  isSaved: boolean
  onToggleSave: (id: string) => void
}

function TipCard({ tip, isSaved, onToggleSave }: TipCardProps) {
  const keyId = tip.id || tip._id || ''

  return (
    <li className="tip-card relative group/card">
      <div className="tip-card-top">
        <span className="tip-tag">{tip.phaseTag}</span>
        <button
          type="button"
          className={`tip-heart ${isSaved ? 'tip-heart--on' : ''}`}
          aria-pressed={isSaved}
          aria-label={isSaved ? 'Remove from saved' : 'Save tip'}
          onClick={() => onToggleSave(keyId)}
        >
          <img
            src="/images/heart.png"
            alt=""
            width={20}
            height={20}
            className={cn(
              'object-contain transition-all duration-300',
              !isSaved && 'opacity-40 grayscale',
            )}
            aria-hidden
          />
        </button>
      </div>
      <h2 className="tip-title pr-12">{tip.title}</h2>
      <p className="tip-summary">{tip.summary}</p>
      <span className="tip-cat">{tip.category}</span>
    </li>
  )
}

// ─── Fetch state reducer ──────────────────────────────────────────────────────
interface FetchState {
  tips: ApiWellnessTip[]
  isLoading: boolean
  errored: boolean
}
type FetchAction =
  | { type: 'loaded'; tips: ApiWellnessTip[] }
  | { type: 'error' }

function fetchReducer(state: FetchState, action: FetchAction): FetchState {
  switch (action.type) {
    case 'loaded': return { tips: action.tips, isLoading: false, errored: false }
    case 'error':  return { ...state, isLoading: false, errored: true }
    default:       return state
  }
}

// ─── Main View ───────────────────────────────────────────────────────────────
export function TipsView() {
  useSEO({
    title: 'Wellness & Tips',
    description: 'Daily nutrition, movement, sleep, and self-care recommendations customized for your active cycle phase.',
    keywords: 'wellness tips, cycle care, cycle tips, wellness score, phase nutrition, phase exercise'
  })
  const { partnerStatus, user, dashboard: ownDashboard } = useStore()

  const data = (user?.role === 'partner' && partnerStatus?.paired && partnerStatus?.cycle)
    ? partnerStatus.cycle
    : ownDashboard

  // Independent state — each controls a separate, unrelated concern
  const [cat, setCat] = useState<(typeof CATS)[number]['id']>('all')
  const [saved, setSaved] = useState<Set<string>>(() => new Set())

  // Grouped: data loading (tips + isLoading always transition together)
  const [fetch, dispatchFetch] = useReducer(fetchReducer, { tips: [], isLoading: true, errored: false })

  const fetchTips = useCallback(async () => {
    try {
      const dbTips = await tipsApi.getTips()
      dispatchFetch({ type: 'loaded', tips: dbTips })
    } catch (err) {
      console.error('Failed to load wellness tips:', err)
      toast.error('Could not load wellness tips from server.')
      dispatchFetch({ type: 'error' })
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => { fetchTips() }, 0)
    return () => clearTimeout(timer)
  }, [fetchTips])

  const fromDashboard = useMemo(() => {
    const rotate: ApiWellnessTip['category'][] = ['nutrition', 'movement', 'rest', 'mind']
    const lines = (data && 'guidanceLines' in data) ? (data.guidanceLines || []) : []
    return lines.map((text: string, i: number) => ({
      id: `dash-${i}`,
      category: rotate[i % rotate.length],
      title: user?.role === 'partner' ? `From her dashboard (${i + 1})` : `From your dashboard (${i + 1})`,
      summary: text,
      phaseTag: data?.phaseLabel || '',
    }))
  }, [data, user?.role])

  const merged: ApiWellnessTip[] = useMemo(
    () => [
      ...fromDashboard.map((t) => ({
        id: t.id,
        category: t.category,
        title: t.title,
        summary: t.summary,
        phaseTag: t.phaseTag,
      })),
      ...fetch.tips,
    ],
    [fromDashboard, fetch.tips],
  )

  const filtered = merged.filter((t) => cat === 'all' || t.category === cat)

  const toggleSave = (id: string) => {
    setSaved((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  if (fetch.isLoading) {
    return <TipsSkeleton />
  }

  if (fetch.errored) {
    return (
      <div className="tips-page">
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="size-16 rounded-2xl bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] flex items-center justify-center">
            <Heart size={32} weight="thin" />
          </div>
          <div className="text-center space-y-1.5 max-w-xs">
            <p className="text-base font-semibold text-[var(--mf-text-strong)]">Could not load tips</p>
            <p className="text-sm text-muted-foreground">Something went wrong. Please try again.</p>
            <button
              type="button"
              onClick={fetchTips}
              className="mt-4 px-6 py-2.5 rounded-full bg-[var(--mf-accent)] text-white text-sm font-medium hover:brightness-110 transition-all cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="tips-page">
      <div className="flex flex-col gap-1.5 text-left mb-6 px-4 sm:px-0">
        <h1 className="text-2xl sm:text-3xl font-normal tracking-tight text-[var(--mf-text-strong)]" id="tips-title">Wellness Tips</h1>
        <p className="text-xs text-muted-foreground">Daily recommendations for nutrition, movement, rest, and mindset tailored to your cycle.</p>
      </div>

      <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
        <div className="filter-chips mb-0" role="tablist" aria-label="Tip category">
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
      </div>

      <ul className="tips-grid">
        {filtered.map((t) => {
          const keyId = t.id || t._id || ''
          return (
            <TipCard
              key={keyId}
              tip={t}
              isSaved={saved.has(keyId)}
              onToggleSave={toggleSave}
            />
          )
        })}
      </ul>
    </div>
  )
}
