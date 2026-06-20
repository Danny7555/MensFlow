import { memo } from 'react'
import { m } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { Calendar, Lightning, Pulse, Heart, Sparkle, Info, ChartLineUp } from '@phosphor-icons/react'
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

  delay?: number
}

const rowVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.08, duration: 0.35, ease: 'easeOut' },
  }),
}

function StatRow({ icon, label, text, delay = 0 }: StatRowProps) {
  return (
    <m.div
      custom={delay}
      variants={rowVariants}
      initial="hidden"
      animate="visible"
      className="group flex items-start gap-3 p-3 -mx-3 rounded-xl hover:bg-[var(--mf-hover)] transition-all duration-200 cursor-default"
    >
      <div className="size-9 rounded-xl bg-gradient-to-br from-[var(--mf-accent-soft)]/80 to-[var(--mf-card)] flex items-center justify-center shrink-0 mt-0.5 ring-1 ring-[var(--mf-border)]/30 group-hover:ring-[var(--mf-accent-border)]/50 transition-all">
        {icon}
      </div>
      <div className="space-y-0.5 min-w-0 flex-1">
        <span className="text-[10px] uppercase tracking-wider text-[var(--mf-muted)] block">{label}</span>
        <p className="text-xs text-[var(--mf-text-strong)] leading-relaxed font-normal">{text}</p>
      </div>
    </m.div>
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
      <div className="flex flex-col items-center justify-center text-center my-auto py-4 gap-4">
        <m.div
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.7, 1, 0.7],
            transition: { repeat: Infinity, duration: 3, ease: 'easeInOut' as const },
          }}
          className="size-14 rounded-2xl bg-gradient-to-br from-[var(--mf-accent-soft)] to-[var(--mf-accent)]/10 text-[var(--mf-accent)] flex items-center justify-center"
        >
          <ChartLineUp size={28} weight="duotone" />
        </m.div>
        <div className="space-y-2 max-w-xs">
          <h4 className="text-sm font-semibold text-[var(--mf-text-strong)]">No Cycle Data Logged Yet</h4>
          <p className="text-xs text-[var(--mf-muted)] leading-relaxed">
            Once you start logging symptoms and flow details, your personalized cycle insights, hormonal exertion peaks,
            and symptom trends will appear here.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-2 w-full max-w-[260px]">
          {['Cycle Length', 'Symptoms', 'Resonance'].map(label => (
            <div key={label} className="flex flex-col items-center gap-1.5 opacity-40">
              <div className="size-6 rounded-lg bg-[var(--mf-border)]" />
              <span className="text-[8px] uppercase tracking-wider text-[var(--mf-muted)]">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </m.div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export const MonthInReview = memo(function MonthInReview() {
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

      <div className="space-y-1">
        <StatRow
          icon={<Calendar size={18} weight="fill" className="text-rose-500" />}
          label="Cycle Length"
          text={stats.cycleLengthText}
          delay={0}
        />
        <StatRow
          icon={<Lightning size={18} weight="fill" className="text-amber-500" />}
          label="Hormonal Exertion"
          text={stats.energyText}
          delay={1}
        />
        <StatRow
          icon={<Pulse size={18} weight="fill" className="text-purple-500" />}
          label="Symptom Trends"
          text={stats.crampText}
          delay={2}
        />
        <StatRow
          icon={<Heart size={18} weight="fill" className="text-teal-500" />}
          label="Partner Care Resonance"
          text={stats.partnerText}
          delay={3}
        />
      </div>
    </m.div>
  )
})
