import { useReducer } from 'react'
import { cn } from '../../lib/utils'
import { toast } from 'sonner'
import { resolveAssetUrl } from '../../lib/apiClient'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Brain,
  Drop,
  Moon,
  Heartbeat,
  ShieldPlus,
  Sparkle,
  BookOpen,
} from '@phosphor-icons/react'
import { educationApi } from '../../services/educationService'
import type { ApiEducationArticle } from '../../services/educationService'
import { userApi } from '../../services/userService'

// ─── Icon map (same as parent view) ─────────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  Brain, Drop, Moon, Heartbeat, ShieldPlus, Sparkle, BookOpen,
}

// ─── Form state ──────────────────────────────────────────────────────────────
interface EduFormState {
  title: string
  description: string
  category: 'Hormones' | 'Phases' | 'Care'
  readTime: string
  iconName: string
  url: string
  image: string
  isSaving: boolean
}

type EduFormAction =
  | { type: 'SET_FIELD'; field: keyof Omit<EduFormState, 'isSaving'>; value: string }
  | { type: 'SET_SAVING'; value: boolean }
  | { type: 'RESET'; article?: ApiEducationArticle | null }

function eduFormReducer(state: EduFormState, action: EduFormAction): EduFormState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value }
    case 'SET_SAVING':
      return { ...state, isSaving: action.value }
    case 'RESET':
      return {
        title: action.article?.title ?? '',
        description: action.article?.description ?? '',
        category: action.article?.category ?? 'Hormones',
        readTime: action.article?.readTime ?? '5 min read',
        iconName: action.article?.iconName ?? 'Sparkle',
        url: action.article?.url ?? '',
        image: action.article?.image ?? '',
        isSaving: false,
      }
    default:
      return state
  }
}

const initialEduForm: EduFormState = {
  title: '',
  description: '',
  category: 'Hormones',
  readTime: '5 min read',
  iconName: 'Sparkle',
  url: '',
  image: '',
  isSaving: false,
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface EducationFormModalProps {
  open: boolean
  editingArticle: ApiEducationArticle | null
  onClose: () => void
  onSaved: () => void
}

// ─── Component ───────────────────────────────────────────────────────────────
export function EducationFormModal({ open, editingArticle, onClose, onSaved }: EducationFormModalProps) {
  const [form, dispatch] = useReducer(eduFormReducer, {
    ...initialEduForm,
    title: editingArticle?.title ?? '',
    description: editingArticle?.description ?? '',
    category: editingArticle?.category ?? 'Hormones',
    readTime: editingArticle?.readTime ?? '5 min read',
    iconName: editingArticle?.iconName ?? 'Sparkle',
    url: editingArticle?.url ?? '',
    image: editingArticle?.image ?? '',
  })

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      dispatch({ type: 'RESET', article: editingArticle })
    } else {
      onClose()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.description.trim() || !form.url.trim() || !form.readTime.trim()) {
      toast.warning('Please fill in all required fields.')
      return
    }
    try {
      new URL(form.url)
    } catch (_) {
      toast.warning('Please enter a valid URL (e.g. https://example.com).')
      return
    }

    dispatch({ type: 'SET_SAVING', value: true })
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        readTime: form.readTime.trim(),
        iconName: form.iconName,
        image: form.image.trim() || undefined,
        url: form.url.trim(),
      }

      if (editingArticle) {
        const articleId = editingArticle.id || editingArticle._id
        if (!articleId) throw new Error('Article ID is missing.')
        await educationApi.updateArticle(articleId, payload)
        toast.success('Guide updated successfully.')
      } else {
        await educationApi.createArticle(payload)
        toast.success('New guide created successfully.')
      }
      onSaved()
      onClose()
    } catch (err) {
      console.error('Failed to save article:', err)
      toast.error('Failed to save guide.')
    } finally {
      dispatch({ type: 'SET_SAVING', value: false })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-[32px] p-6 border-none max-h-[90vh] overflow-y-auto scrollbar-hide">
        <DialogHeader>
          <DialogTitle className="text-2xl font-normal text-[var(--mf-text-strong)]">
            {editingArticle ? 'Edit Educational Guide' : 'Create Educational Guide'}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {editingArticle
              ? 'Update the details for this educational guide.'
              : 'Add a new expert-reviewed guide to the health library.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-3">
          {/* Title */}
          <div className="space-y-1.5 text-left">
            <label htmlFor="edu-title" className="text-xs font-medium text-[var(--mf-text-strong)]">
              Title *
            </label>
            <input
              id="edu-title"
              type="text"
              value={form.title}
              onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'title', value: e.target.value })}
              placeholder="e.g. Understanding Estrogen"
              className="w-full bg-white dark:bg-white/5 border border-[var(--mf-border)] rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--mf-accent)]/50 focus:border-[var(--mf-accent)] text-[var(--mf-text-strong)] transition-all"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5 text-left">
            <label htmlFor="edu-description" className="text-xs font-medium text-[var(--mf-text-strong)]">
              Description *
            </label>
            <textarea
              id="edu-description"
              value={form.description}
              onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'description', value: e.target.value })}
              placeholder="Write a brief summary of the article..."
              className="w-full bg-white dark:bg-white/5 border border-[var(--mf-border)] rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--mf-accent)]/50 focus:border-[var(--mf-accent)] text-[var(--mf-text-strong)] transition-all min-h-[80px] resize-y"
              required
            />
          </div>

          {/* Category selection */}
          <fieldset className="space-y-1.5 text-left border-none p-0 m-0">
            <legend className="text-xs font-medium text-[var(--mf-text-strong)] mb-1.5">Category *</legend>
            <div className="flex gap-2">
              {(['Hormones', 'Phases', 'Care'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => dispatch({ type: 'SET_FIELD', field: 'category', value: cat })}
                  aria-pressed={form.category === cat}
                  className={cn(
                    'flex-1 py-2 px-3 text-xs rounded-xl border transition-all cursor-pointer font-normal text-center active-squish',
                    form.category === cat
                      ? 'bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] border-[var(--mf-accent-border)] font-medium'
                      : 'bg-white dark:bg-white/5 text-muted-foreground border-[var(--mf-border)] hover:border-foreground',
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Read Time & Image Path */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 text-left">
              <label htmlFor="edu-read-time" className="text-xs font-medium text-[var(--mf-text-strong)]">
                Read Time *
              </label>
              <input
                id="edu-read-time"
                type="text"
                value={form.readTime}
                onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'readTime', value: e.target.value })}
                placeholder="e.g. 5 min read"
                className="w-full bg-white dark:bg-white/5 border border-[var(--mf-border)] rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--mf-accent)]/50 focus:border-[var(--mf-accent)] text-[var(--mf-text-strong)] transition-all"
                required
              />
            </div>

            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <label htmlFor="edu-image" className="text-xs font-medium text-[var(--mf-text-strong)]">
                  Optional Image Path or Upload
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => document.getElementById('cover-upload')?.click()}
                    className="text-[10px] font-semibold text-[var(--mf-accent)] hover:underline cursor-pointer"
                  >
                    Upload Cover
                  </button>
                  {form.image && (
                    <button
                      type="button"
                      onClick={() => dispatch({ type: 'SET_FIELD', field: 'image', value: '' })}
                      className="text-[10px] font-semibold text-rose-500 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              <input 
                id="cover-upload" 
                type="file" 
                accept="image/*" 
                aria-label="Upload cover image"
                className="hidden" 
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    const toastId = toast.loading('Uploading cover image...')
                    try {
                      const res = await userApi.uploadImage(file, 'cover')
                      dispatch({ type: 'SET_FIELD', field: 'image', value: res.url })
                      toast.success('Cover image uploaded!', { id: toastId })
                    } catch (err) {
                      console.error('Failed to upload cover:', err)
                      toast.error('Failed to upload cover. Please try again.', { id: toastId })
                    }
                  }
                }} 
              />
              <div className="flex gap-3 items-center">
                {form.image && (
                  <div className="size-10 rounded-xl overflow-hidden border border-border shrink-0 bg-muted">
                    <img loading="lazy" src={resolveAssetUrl(form.image)} alt="" className="size-full object-cover" />
                  </div>
                )}
                <input
                  id="edu-image"
                  type="text"
                  value={form.image}
                  onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'image', value: e.target.value })}
                  placeholder="e.g. /images/star.png or upload a file"
                  className="w-full bg-white dark:bg-white/5 border border-[var(--mf-border)] rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--mf-accent)]/50 focus:border-[var(--mf-accent)] text-[var(--mf-text-strong)] transition-all"
                />
              </div>
            </div>
          </div>

          {/* Article URL */}
          <div className="space-y-1.5 text-left">
            <label htmlFor="edu-url" className="text-xs font-medium text-[var(--mf-text-strong)]">
              Article Link URL *
            </label>
            <input
              id="edu-url"
              type="url"
              value={form.url}
              onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'url', value: e.target.value })}
              placeholder="https://helloclue.com/articles/..."
              className="w-full bg-white dark:bg-white/5 border border-[var(--mf-border)] rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--mf-accent)]/50 focus:border-[var(--mf-accent)] text-[var(--mf-text-strong)] transition-all"
              required
            />
          </div>

          {/* Icon Design Grid */}
          <fieldset className="space-y-1.5 text-left border-none p-0 m-0">
            <legend className="text-xs font-medium text-[var(--mf-text-strong)] mb-1.5">Icon Design *</legend>
            <div className="grid grid-cols-7 gap-2">
              {Object.keys(ICON_MAP).map((iconKey) => {
                const IconComp = ICON_MAP[iconKey]
                return (
                  <button
                    key={iconKey}
                    type="button"
                    onClick={() => dispatch({ type: 'SET_FIELD', field: 'iconName', value: iconKey })}
                    aria-pressed={form.iconName === iconKey}
                    aria-label={iconKey}
                    className={cn(
                      'p-2.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer active-squish',
                      form.iconName === iconKey
                        ? 'bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] border-[var(--mf-accent-border)]'
                        : 'bg-white dark:bg-white/5 text-muted-foreground border-[var(--mf-border)] hover:border-foreground',
                    )}
                  >
                    <IconComp size={18} weight="duotone" />
                  </button>
                )
              })}
            </div>
          </fieldset>

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
              className="px-5 py-2.5 text-xs font-medium rounded-xl bg-[var(--mf-accent)] hover:bg-[var(--mf-accent-hover)] text-white/20/35 transition-all cursor-pointer disabled:opacity-50 active-squish flex items-center gap-1.5"
            >
              {form.isSaving && (
                <div className="size-3 border border-white/30 border-t-white rounded-full animate-spin" />
              )}
              <span>{editingArticle ? 'Save Changes' : 'Create Guide'}</span>
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
