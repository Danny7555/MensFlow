import { useReducer } from 'react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import type { ApiWellnessTip } from '../../services/tipsService'
import { tipsApi } from '../../services/tipsService'

// ─── Form state shape ───────────────────────────────────────────────────────
interface TipFormState {
  title: string
  summary: string
  category: ApiWellnessTip['category']
  phaseTag: string
  isSaving: boolean
}

type TipFormAction =
  | { type: 'SET_FIELD'; field: keyof Omit<TipFormState, 'isSaving'>; value: string }
  | { type: 'SET_SAVING'; value: boolean }
  | { type: 'RESET'; tip?: ApiWellnessTip | null }

function tipFormReducer(state: TipFormState, action: TipFormAction): TipFormState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value }
    case 'SET_SAVING':
      return { ...state, isSaving: action.value }
    case 'RESET':
      return {
        title: action.tip?.title ?? '',
        summary: action.tip?.summary ?? '',
        category: action.tip?.category ?? 'nutrition',
        phaseTag: action.tip?.phaseTag ?? 'Any phase',
        isSaving: false,
      }
    default:
      return state
  }
}

const initialFormState: TipFormState = {
  title: '',
  summary: '',
  category: 'nutrition',
  phaseTag: 'Any phase',
  isSaving: false,
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface TipFormModalProps {
  open: boolean
  editingTip: ApiWellnessTip | null
  onClose: () => void
  onSaved: () => void
}

// ─── Component ───────────────────────────────────────────────────────────────
export function TipFormModal({ open, editingTip, onClose, onSaved }: TipFormModalProps) {
  const [form, dispatch] = useReducer(tipFormReducer, {
    ...initialFormState,
    title: editingTip?.title ?? '',
    summary: editingTip?.summary ?? '',
    category: editingTip?.category ?? 'nutrition',
    phaseTag: editingTip?.phaseTag ?? 'Any phase',
  })

  // Sync form when editingTip changes (open transitions)
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      dispatch({ type: 'RESET', tip: editingTip })
    } else {
      onClose()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.summary.trim() || !form.phaseTag.trim()) {
      toast.warning('Please fill in all required fields.')
      return
    }

    dispatch({ type: 'SET_SAVING', value: true })
    try {
      const payload = {
        title: form.title.trim(),
        summary: form.summary.trim(),
        category: form.category,
        phaseTag: form.phaseTag.trim(),
      }

      if (editingTip) {
        const tipId = editingTip.id || editingTip._id
        if (!tipId) throw new Error('Tip ID is missing.')
        await tipsApi.updateTip(tipId, payload)
        toast.success('Tip updated successfully.')
      } else {
        await tipsApi.createTip(payload)
        toast.success('New tip created successfully.')
      }
      onSaved()
      onClose()
    } catch (err) {
      console.error('Failed to save tip:', err)
      toast.error('Failed to save tip.')
    } finally {
      dispatch({ type: 'SET_SAVING', value: false })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[450px] rounded-[32px] p-6 border-none max-h-[90vh] overflow-y-auto scrollbar-hide">
        <DialogHeader>
          <DialogTitle className="text-2xl font-normal text-[var(--mf-text-strong)]">
            {editingTip ? 'Edit Wellness Tip' : 'Create Wellness Tip'}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {editingTip
              ? 'Update the details for this wellness tip.'
              : 'Add a new dynamic tip to the health and lifestyle library.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-3">
          {/* Title */}
          <div className="space-y-1.5 text-left">
            <label htmlFor="tip-title" className="text-xs font-medium text-[var(--mf-text-strong)]">
              Title *
            </label>
            <input
              id="tip-title"
              type="text"
              value={form.title}
              onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'title', value: e.target.value })}
              placeholder="e.g. Iron + vitamin C pairings"
              className="w-full bg-white dark:bg-white/5 border border-[var(--mf-border)] rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--mf-accent)]/50 focus:border-[var(--mf-accent)] text-[var(--mf-text-strong)] transition-all"
              required
            />
          </div>

          {/* Summary */}
          <div className="space-y-1.5 text-left">
            <label htmlFor="tip-summary" className="text-xs font-medium text-[var(--mf-text-strong)]">
              Summary *
            </label>
            <textarea
              id="tip-summary"
              value={form.summary}
              onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'summary', value: e.target.value })}
              placeholder="Describe this wellness tip recommendation..."
              className="w-full bg-white dark:bg-white/5 border border-[var(--mf-border)] rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--mf-accent)]/50 focus:border-[var(--mf-accent)] text-[var(--mf-text-strong)] transition-all min-h-[90px] resize-y"
              required
            />
          </div>

          {/* Category selection */}
          <fieldset className="space-y-1.5 text-left border-none p-0 m-0">
            <legend className="text-xs font-medium text-[var(--mf-text-strong)] mb-1.5">Category *</legend>
            <div className="grid grid-cols-2 gap-2">
              {(['nutrition', 'movement', 'rest', 'mind'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => dispatch({ type: 'SET_FIELD', field: 'category', value: c })}
                  aria-pressed={form.category === c}
                  className={cn(
                    'py-2 px-3 text-xs rounded-xl border transition-all cursor-pointer font-normal text-center active-squish capitalize',
                    form.category === c
                      ? 'bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] border-[var(--mf-accent-border)] font-medium'
                      : 'bg-white dark:bg-white/5 text-muted-foreground border-[var(--mf-border)] hover:border-foreground',
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Phase Tag */}
          <div className="space-y-1.5 text-left">
            <label htmlFor="tip-phase" className="text-xs font-medium text-[var(--mf-text-strong)]">
              Phase Tag *
            </label>
            <input
              id="tip-phase"
              type="text"
              value={form.phaseTag}
              onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'phaseTag', value: e.target.value })}
              placeholder="e.g. Luteal, Menstrual, Any phase"
              className="w-full bg-white dark:bg-white/5 border border-[var(--mf-border)] rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--mf-accent)]/50 focus:border-[var(--mf-accent)] text-[var(--mf-text-strong)] transition-all"
              required
            />
          </div>

          <DialogFooter className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-medium rounded-xl bg-[var(--mf-hover)] hover:bg-[var(--mf-active)] text-[var(--mf-text-strong)] transition-all cursor-pointer active-squish"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={form.isSaving}
              className="px-5 py-2.5 text-xs font-medium rounded-xl bg-[var(--mf-accent)] hover:bg-[var(--mf-accent-hover)] text-white shadow-lg shadow-[var(--mf-accent)]/20 hover:shadow-[var(--mf-accent)]/35 transition-all cursor-pointer disabled:opacity-50 active-squish flex items-center gap-1.5"
            >
              {form.isSaving && (
                <div className="size-3 border border-white/30 border-t-white rounded-full animate-spin" />
              )}
              <span>{editingTip ? 'Save Changes' : 'Create Tip'}</span>
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
