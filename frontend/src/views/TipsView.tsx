import { useMemo, useState, useEffect, useCallback } from 'react'
import { useStore } from '../store/useStore'
import { TipsSkeleton } from '../components/skeletons/TipsSkeleton'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/useAuth'
import { tipsApi } from '../services/tipsService'
import type { ApiWellnessTip } from '../services/tipsService'
import { toast } from 'sonner'
import { Plus, Trash, PencilSimple } from '@phosphor-icons/react'
import { TipFormModal } from '../components/tips/TipFormModal'

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
  isAuthenticated: boolean
  onToggleSave: (id: string) => void
  onEdit: (tip: ApiWellnessTip) => void
  onDelete: (tip: ApiWellnessTip) => void
}

function TipCard({ tip, isSaved, isAuthenticated, onToggleSave, onEdit, onDelete }: TipCardProps) {
  const isDbTip = !tip.id?.startsWith('dash-')
  const keyId = tip.id || tip._id || ''

  return (
    <li className="tip-card relative group/card">
      {isAuthenticated && isDbTip && (
        <div className="absolute top-4 right-12 flex items-center gap-1.5 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 z-20">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onEdit(tip) }}
            className="size-7 rounded-full bg-card hover:bg-[var(--mf-hover)] text-[var(--mf-text-strong)] flex items-center justify-center transition-all cursor-pointer border border-border active-squish shadow-xs"
            aria-label="Edit tip"
          >
            <PencilSimple size={12} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onDelete(tip) }}
            className="size-7 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 flex items-center justify-center transition-all cursor-pointer border border-rose-500/20 active-squish shadow-xs"
            aria-label="Delete tip"
          >
            <Trash size={12} />
          </button>
        </div>
      )}

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

// ─── Main View ───────────────────────────────────────────────────────────────
export function TipsView() {
  const { isAuthenticated } = useAuth()
  const { dashboard: ownDashboard, partnerStatus, user } = useStore()

  const data = (user?.role === 'partner' && partnerStatus?.paired && partnerStatus?.cycle)
    ? partnerStatus.cycle
    : ownDashboard

  const [cat, setCat] = useState<(typeof CATS)[number]['id']>('all')
  const [tips, setTips] = useState<ApiWellnessTip[]>([])
  const [saved, setSaved] = useState<Set<string>>(() => new Set())
  const [isLoading, setIsLoading] = useState(true)

  // Modal state — only 2 values: open flag + which tip is being edited
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTip, setEditingTip] = useState<ApiWellnessTip | null>(null)

  const fetchTips = useCallback(async () => {
    try {
      const dbTips = await tipsApi.getTips()
      setTips(dbTips)
      setSaved((prev) => {
        if (prev.size === 0 && dbTips.length > 0) {
          return new Set(dbTips.slice(0, 2).map((t) => t.id || t._id || ''))
        }
        return prev
      })
    } catch (err) {
      console.error('Failed to load wellness tips:', err)
      toast.error('Could not load wellness tips from server.')
    } finally {
      setIsLoading(false)
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
      ...tips,
    ],
    [fromDashboard, tips],
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

  const handleDeleteClick = async (tip: ApiWellnessTip) => {
    const tipId = tip.id || tip._id
    if (!tipId) return
    if (!window.confirm(`Are you sure you want to delete the tip "${tip.title}"?`)) return
    try {
      await tipsApi.deleteTip(tipId)
      toast.success('Tip deleted successfully.')
      fetchTips()
    } catch (err) {
      console.error('Failed to delete tip:', err)
      toast.error('Failed to delete tip.')
    }
  }

  if (isLoading) {
    return <TipsSkeleton />
  }

  return (
    <div className="tips-page">
      <div className="flex flex-wrap gap-4 justify-between items-center mb-6 bg-card p-4 rounded-2xl border border-border/50">
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

        {isAuthenticated && (
          <button
            type="button"
            onClick={() => { setEditingTip(null); setIsModalOpen(true) }}
            className="px-5 py-2 rounded-full text-sm font-medium bg-[var(--mf-accent)] text-white hover:bg-[var(--mf-accent-hover)] transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active-squish"
          >
            <Plus size={16} weight="bold" />
            <span>Add Tip</span>
          </button>
        )}
      </div>

      <ul className="tips-grid">
        {filtered.map((t) => {
          const keyId = t.id || t._id || ''
          return (
            <TipCard
              key={keyId}
              tip={t}
              isSaved={saved.has(keyId)}
              isAuthenticated={isAuthenticated}
              onToggleSave={toggleSave}
              onEdit={(tip) => { setEditingTip(tip); setIsModalOpen(true) }}
              onDelete={handleDeleteClick}
            />
          )
        })}
      </ul>

      <TipFormModal
        open={isModalOpen}
        editingTip={editingTip}
        onClose={() => setIsModalOpen(false)}
        onSaved={fetchTips}
      />
    </div>
  )
}
