import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import {
  ClipboardText,
  FileArrowUp,
  ImageSquare,
  Microphone,
  PaperPlaneRight,
  Plus,
  X,
} from '@phosphor-icons/react'
import { useSettings } from '../context/useSettings'
import { cn } from '../lib/utils'

const MAX_FILES = 12
const MAX_BYTES = 15 * 1024 * 1024

export type AttachedMeta = { id: string; file: File }

type ChatComposerProps = {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  placeholder?: string
  minimal?: boolean
  /** When true, shows Enter / newline hints under the composer */
  showKeyboardHint?: boolean
  attachments?: AttachedMeta[]
  onAttachmentsChange?: (files: AttachedMeta[]) => void
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

export function ChatComposer({
  value,
  onChange,
  onSubmit,
  placeholder = 'Ask MensFlow',
  minimal,
  showKeyboardHint = false,
  attachments: controlledAttachments,
  onAttachmentsChange,
}: ChatComposerProps) {
  const {
    settings: { chatEnterToSend },
  } = useSettings()

  const menuId = useId()
  const [menuOpen, setMenuOpen] = useState(false)
  const [internalFiles, setInternalFiles] = useState<AttachedMeta[]>([])
  const attachments = controlledAttachments ?? internalFiles

  const replaceAttachments = (next: AttachedMeta[]) => {
    if (onAttachmentsChange) onAttachmentsChange(next)
    else setInternalFiles(next)
  }

  const rootRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const close = (e: MouseEvent) => {
      const t = e.target as Node
      if (!rootRef.current?.contains(t)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menuOpen])

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  const addFiles = (list: FileList | File[]) => {
    const arr = Array.from(list)
    const next = [...attachments]
    for (const file of arr) {
      if (next.length >= MAX_FILES) break
      if (file.size > MAX_BYTES) continue
      next.push({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
      })
    }
    replaceAttachments(next)
    setMenuOpen(false)
  }

  const removeFile = (id: string) => {
    replaceAttachments(attachments.filter((a) => a.id !== id))
  }

  const openPicker = (kind: 'any' | 'image') => {
    const input = kind === 'image' ? imageInputRef.current : fileInputRef.current
    input?.click()
  }

  const tryPaste = async () => {
    setMenuOpen(false)
    try {
      const items = await navigator.clipboard.read()
      const results = await Promise.all(items.map(async (item) => {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type)
            const rawExt = type.split('/')[1] ?? 'png'
            const ext = rawExt.replace(/\W+/g, '').slice(0, 8) || 'png'
            return new File([blob], `clipboard-${Date.now()}.${ext}`, { type })
          }
        }
        return null
      }))
      
      const files = results.filter((f): f is File => f !== null)
      if (files.length) addFiles(files)
      else window.alert('No image on the clipboard.')
    } catch {
      window.alert('Clipboard access was blocked. Try Upload files instead.')
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!value.trim()) return
    onSubmit()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (chatEnterToSend) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        if (value.trim()) onSubmit()
      }
    } else {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        if (value.trim()) onSubmit()
      }
    }
  }

  const hint = chatEnterToSend
    ? 'Enter to send · Shift+Enter for newline'
    : '⌘/Ctrl+Enter to send · Enter for newline'

  return (
    <div className={cn("composer-stack", minimal && "composer-stack--minimal")} ref={rootRef}>
      <input
        ref={fileInputRef}
        type="file"
        className="composer-hidden-input"
        multiple
        onChange={(e) => {
          if (e.target.files?.length) addFiles(e.target.files)
          e.target.value = ''
        }}
      />
      <input
        ref={imageInputRef}
        type="file"
        className="composer-hidden-input"
        accept="image/*"
        multiple
        onChange={(e) => {
          if (e.target.files?.length) addFiles(e.target.files)
          e.target.value = ''
        }}
      />

      {attachments.length > 0 && (
        <ul className="composer-file-list animate-in fade-in slide-in-from-bottom-2 duration-300" aria-label="Attachments ready to send">
          {attachments.map((a) => (
            <li key={a.id} className="composer-file-chip glass-morphism">
              <span className="composer-file-name" title={a.file.name}>
                {a.file.name}
              </span>
              <span className="composer-file-meta">{formatBytes(a.file.size)}</span>
              <button
                type="button"
                className="composer-file-remove"
                aria-label={`Remove ${a.file.name}`}
                onClick={() => removeFile(a.id)}
              >
                <X size={14} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        className={cn(
          "composer glass-morphism transition-all duration-300 focus-within:ring-2 focus-within:ring-[var(--mf-accent)]",
          "border-2 border-dotted border-[#d1d5db] dark:border-muted-foreground/30 bg-muted/20",
          minimal && "composer--minimal"
        )}
        onSubmit={handleSubmit}
      >
        <div className="composer-attach-wrap">
          <button
            type="button"
            className={cn("composer-icon-btn transition-colors", menuOpen && "composer-icon-btn--active")}
            aria-label="Add attachments"
            aria-expanded={menuOpen}
            aria-haspopup="true"
            aria-controls={menuOpen ? menuId : undefined}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <Plus size={21} aria-hidden />
          </button>
          {menuOpen && (
            <div className="composer-dropdown glass-morphism animate-in fade-in zoom-in-95 duration-200 origin-bottom-left" id={menuId} role="menu">
              <button
                type="button"
                className="composer-dropdown-item"
                role="menuitem"
                onClick={() => openPicker('any')}
              >
                <FileArrowUp size={18} aria-hidden />
                <span>
                  <strong>Upload files</strong>
                  <small>Documents, exports, labs (local preview)</small>
                </span>
              </button>
              <button
                type="button"
                className="composer-dropdown-item"
                role="menuitem"
                onClick={() => openPicker('image')}
              >
                <ImageSquare size={18} aria-hidden />
                <span>
                  <strong>Photos &amp; media</strong>
                  <small>PNG, JPG, HEIC…</small>
                </span>
              </button>
              <button
                type="button"
                className="composer-dropdown-item"
                role="menuitem"
                onClick={() => void tryPaste()}
              >
                <ClipboardText size={18} aria-hidden />
                <span>
                  <strong>Paste from clipboard</strong>
                  <small>Images you copied elsewhere</small>
                </span>
              </button>
            </div>
          )}
        </div>

        <textarea
          ref={textareaRef}
          className="composer-input"
          rows={1}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Message"
        />

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="composer-icon-btn hidden sm:flex"
            aria-label="Voice input"
            title="Voice (coming soon)"
          >
            <Microphone size={21} aria-hidden />
          </button>
          <button
            type="submit"
            className="composer-send transition-all active:scale-95"
            aria-label="Send"
            disabled={!value.trim()}
          >
            <PaperPlaneRight size={20} weight="fill" aria-hidden />
          </button>
        </div>
      </form>
      {showKeyboardHint && <p className="composer-hint animate-in fade-in duration-700 delay-300">{hint}</p>}
    </div>
  )
}
