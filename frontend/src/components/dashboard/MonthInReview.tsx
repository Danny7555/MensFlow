import { m } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { Calendar, Lightning, Pulse, Heart, Sparkle, Info } from '@phosphor-icons/react'
import { useStore } from '../../store/useStore'
import { useMonthInReviewStats } from '../../hooks/useMonthInReviewStats'

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}

// ─── Shared card header ───────────────────────────────────────────────────────
function CardHeader() {
  return (
    <div>
      <span className="text-[9px] font-regular text-[var(--mf-accent)] uppercase tracking-[0.2em] block mb-0.5">
        Cycle Story
      </span>
      <h3 className="text-base font-regular text-[var(--mf-text-strong)] flex items-center gap-1.5 font-semibold">
        Your Month in Review
        <Sparkle size={14} className="text-[var(--mf-accent)]" weight="fill" />
      </h3>
    </div>
  )
}

// ─── Stat row ─────────────────────────────────────────────────────────────────
interface StatRowProps {
  icon: React.ReactNode
  label: string
  text: string
}

function StatRow({ icon, label, text }: StatRowProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="size-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5">{icon}</div>
      <div className="space-y-0.5">
        <span className="text-[10px] uppercase tracking-wider text-[var(--mf-muted)] block">{label}</span>
        <p className="text-xs text-[var(--mf-text-strong)] leading-relaxed font-normal">{text}</p>
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <m.div
      variants={cardVariants}
      className="flo-card flo-card--prominent p-6 border-[var(--mf-border-strong)] bg-white dark:bg-[var(--mf-card)] text-left flex flex-col justify-between min-h-[320px]"
    >
      <div className="flex items-center justify-between mb-4">
        <CardHeader />
      </div>
      <div className="flex flex-col items-center justify-center text-center my-auto py-4 space-y-4">
        <div className="size-12 rounded-2xl bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] flex items-center justify-center">
          <Calendar size={24} weight="duotone" />
        </div>
        <div className="space-y-1.5 max-w-xs">
          <h4 className="text-sm font-semibold text-[var(--mf-text-strong)]">No Cycle Data Logged Yet</h4>
          <p className="text-xs text-[var(--mf-muted)] leading-relaxed">
            Once you start logging symptoms and flow details, your personalized cycle insights, hormonal exertion peaks,
            and symptom trends will appear here.
          </p>
        </div>
      </div>
    </m.div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function MonthInReview() {
  const { logs } = useStore()
  const stats = useMonthInReviewStats()

  if (!logs || logs.length === 0) {
    return <EmptyState />
  }

  return (
    <m.div
      variants={cardVariants}
      className="flo-card flo-card--prominent p-6 border-[var(--mf-border-strong)] bg-white dark:bg-[var(--mf-card)] text-left"
    >
      <div className="flex items-center justify-between mb-5">
        <CardHeader />
        <div className="size-8 rounded-full flex items-center justify-center text-[var(--mf-accent)]">
          <Info size={14} weight="bold" />
        </div>
      </div>

      <div className="space-y-4">
        <StatRow
          icon={<Calendar size={18} weight="fill" className="text-rose-500" />}
          label="Cycle Length"
          text={stats.cycleLengthText}
        />
        <StatRow
          icon={<Lightning size={18} weight="fill" className="text-amber-500" />}
          label="Hormonal Exertion"
          text={stats.energyText}
        />
        <StatRow
          icon={<Pulse size={18} weight="fill" className="text-purple-500" />}
          label="Symptom Trends"
          text={stats.crampText}
        />
        <StatRow
          icon={<Heart size={18} weight="fill" className="text-teal-500" />}
          label="Partner Care Resonance"
          text={stats.partnerText}
        />
      </div>
    </m.div>
  )
}
