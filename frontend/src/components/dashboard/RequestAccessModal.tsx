import { useState } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { X, ShieldCheck, ChartLineUp, Drop, Pulse, CalendarBlank } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface AccessOption {
  id: string
  icon: React.ReactNode
  title: string
  description: string
  color: string
}

const ACCESS_OPTIONS: AccessOption[] = [
  {
    id: 'symptoms',
    icon: <Drop size={20} weight="fill" />,
    title: 'Symptoms',
    description: "Request access to logged symptoms, flow, mucus, LH tests, water, and weight.",
    color: '#14b8a6',
  },
  {
    id: 'insights',
    icon: <ChartLineUp size={20} weight="fill" />,
    title: 'Health Insights',
    description: 'Request access to cycle trends, analytics, charts, and monthly insights.',
    color: '#8b5cf6',
  },
  {
    id: 'tracker',
    icon: <Pulse size={20} weight="fill" />,
    title: 'Tracker',
    description: 'Request access to the tracker wheel, current phase, cycle day, and predictions.',
    color: 'var(--mf-accent)',
  },
  {
    id: 'calendar',
    icon: <CalendarBlank size={20} weight="fill" />,
    title: 'Calendar',
    description: 'Request access to calendar forecasts, period windows, and timeline context.',
    color: '#f59e0b',
  },
]

interface RequestAccessModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (selectedFields: string[]) => void
  isLoading?: boolean
}

export function RequestAccessModal({ open, onClose, onConfirm, isLoading }: RequestAccessModalProps) {
  const [selected] = useState<Set<string>>(new Set(ACCESS_OPTIONS.map((option) => option.id)))

  const handleConfirm = () => {
    if (selected.size === 0) return
    onConfirm(Array.from(selected))
  }

  return (
    <AnimatePresence>
      {open && (
        <m.div
          key="access-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
          <m.div
            key="access-modal-panel"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="relative w-full max-w-md bg-[var(--mf-card)] border border-[var(--mf-border)] rounded-[2rem] overflow-hidden"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 size-9 rounded-full bg-[var(--mf-hover)] hover:bg-[var(--mf-active)] flex items-center justify-center text-[var(--mf-muted)] hover:text-[var(--mf-text-strong)] transition-all cursor-pointer z-10"
            >
              <X size={18} weight="bold" />
            </button>

            {/* Header */}
            <div className="px-7 pt-7 pb-4">
              <div className="size-14 rounded-2xl bg-[var(--mf-accent)]/10 flex items-center justify-center mb-5 border border-[var(--mf-accent)]/15">
                <ShieldCheck size={28} weight="fill" className="text-[var(--mf-accent)]" />
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-[var(--mf-text-strong)] mb-1.5">
                Request Detailed Access
              </h2>
              <p className="text-xs text-[var(--mf-muted)] leading-relaxed">
                This request includes the private areas partners need approved: symptoms, health insights, tracker, and calendar.
              </p>
            </div>

            {/* Options */}
            <div className="px-7 pb-5 space-y-2.5">
              {ACCESS_OPTIONS.map((opt) => {
                const isChecked = selected.has(opt.id)
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => undefined}
                    className={cn(
                      'w-full text-left p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 group',
                      isChecked
                        ? 'border-[var(--mf-accent)]/40 bg-[var(--mf-accent)]/5'
                        : 'border-[var(--mf-border)] bg-[var(--mf-hover)] hover:border-[var(--mf-accent)]/25 hover:bg-[var(--mf-accent)]/3'
                    )}
                  >
                    {/* Icon */}
                    <div
                      className="size-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-all"
                      style={{
                        backgroundColor: isChecked ? `${opt.color}18` : 'transparent',
                        color: isChecked ? opt.color : 'var(--mf-muted)',
                        border: `1px solid ${isChecked ? opt.color + '35' : 'var(--mf-border)'}`,
                      }}
                    >
                      {opt.icon}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <span
                        className="text-sm font-medium block leading-snug"
                        style={{ color: isChecked ? 'var(--mf-text-strong)' : 'var(--mf-text)' }}
                      >
                        {opt.title}
                      </span>
                      <span className="text-[11px] text-[var(--mf-muted)] leading-relaxed block mt-0.5">
                        {opt.description}
                      </span>
                    </div>

                    {/* Included marker */}
                    <div
                      className={cn(
                        'size-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all',
                        isChecked ? 'border-[var(--mf-accent)] bg-[var(--mf-accent)]' : 'border-[var(--mf-border-strong)]'
                      )}
                    >
                      {isChecked && (
                        <m.svg
                          initial={{ scale: 0.95, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                          viewBox="0 0 12 10"
                          fill="none"
                          className="w-3 h-3"
                        >
                          <path d="M1.5 5L4.5 8L10.5 2" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </m.svg>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Privacy note */}
            <div className="px-7 py-3 border-t border-[var(--mf-border)]/50 bg-[var(--mf-hover)]/40">
              <p className="text-[11px] text-[var(--mf-muted)] leading-relaxed">
                🔒 Your partner stays in control. She will decide exactly what to share — your selection is just a request.
              </p>
            </div>

            {/* Footer buttons */}
            <div className="px-7 py-5 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 text-sm font-medium rounded-xl border border-[var(--mf-border)] bg-transparent hover:bg-[var(--mf-hover)] text-[var(--mf-text-strong)] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={selected.size === 0 || isLoading}
                className={cn(
                  'flex-1 py-2.5 text-sm font-semibold rounded-xl text-white transition-all cursor-pointer border-0 outline-none',
                  selected.size === 0 || isLoading
                    ? 'bg-[var(--mf-accent)]/40 cursor-not-allowed'
                    : 'bg-[var(--mf-accent)] hover:brightness-110 active:scale-[0.98]'
                )}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                    Sending…
                  </span>
                ) : (
                  `Send Request${selected.size > 0 ? ` (${selected.size})` : ''}`
                )}
              </button>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  )
}
