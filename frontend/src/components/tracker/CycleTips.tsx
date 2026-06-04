import { useMemo } from 'react'
import { Lightbulb, Info, Heart } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { useStore } from '../../store/useStore'

interface CycleTipsProps {
  activeDay: number
}

interface PhaseTip {
  title: string
  desc: string
  icon: React.ElementType
  colorClass: string
  bgClass: string
  borderClass: string
}

export function CycleTips({ activeDay }: CycleTipsProps) {
  const { dashboard } = useStore()
  const cycleLen = dashboard.typicalCycleDays || 28
  const periodLength = cycleLen <= 24 ? 4 : cycleLen >= 36 ? 6 : 5
  const ovulationDay = Math.max(periodLength + 5, cycleLen - 14)
  const fertileStart = Math.max(periodLength + 1, ovulationDay - 4)
  const fertileEnd = Math.min(cycleLen, ovulationDay + 2)

  const isMenstrual = activeDay <= periodLength
  const isFertile = activeDay >= fertileStart && activeDay <= fertileEnd
  const isLuteal = activeDay > fertileEnd
  const isFollicular = !isMenstrual && !isFertile && !isLuteal

  // Determine current phase based on activeDay
  const phaseInfo = useMemo(() => {
    if (isMenstrual) {
      return {
        name: 'Menstrual Phase',
        badge: 'SHEDDING',
        accentColor: 'text-rose-500',
        borderColor: 'border-rose-500/20',
        bgColor: 'from-rose-500/10 to-transparent',
        tips: [
          {
            title: 'Hormones at baseline',
            desc: 'Estrogen and progesterone are at their lowest. Uterine muscles actively contract to shed the lining, consuming intense physical energy and causing cramps.',
            icon: Info,
            colorClass: 'text-rose-500',
            bgClass: 'bg-rose-500/10',
            borderClass: 'border-rose-500/20',
          },
          {
            title: 'Support: Prioritize deep rest',
            desc: 'Offer a heating pad without being asked, handle meals and chores silently, and give her absolute decision relief.',
            icon: Heart,
            colorClass: 'text-rose-400',
            bgClass: 'bg-rose-500/10',
            borderClass: 'border-rose-500/20',
          },
          {
            title: 'Diet: High Iron & Hydration',
            desc: 'Eat iron-rich foods (spinach, dark chocolate, red meat) to replace losses. Sip warm raspberry leaf or chamomile tea.',
            icon: Lightbulb,
            colorClass: 'text-amber-500',
            bgClass: 'bg-amber-500/10',
            borderClass: 'border-amber-500/20',
          },
        ] as PhaseTip[],
      }
    }

    if (isFollicular) {
      return {
        name: 'Follicular Phase',
        badge: 'RISING ENERGY',
        accentColor: 'text-amber-500',
        borderColor: 'border-amber-500/20',
        bgColor: 'from-amber-500/10 to-transparent',
        tips: [
          {
            title: 'Estrogen is rebuilding',
            desc: 'Estrogen begins to climb steadily. This stimulates physical stamina, cognitive sharpness, and boosts optimistic brain states.',
            icon: Info,
            colorClass: 'text-amber-500',
            bgClass: 'bg-amber-500/10',
            borderClass: 'border-amber-500/20',
          },
          {
            title: 'Support: Share fresh ideas',
            desc: 'Her social energy is building! Suggest light outdoor walks, cook a brand-new recipe together, or plan a fun creative project.',
            icon: Heart,
            colorClass: 'text-amber-600',
            bgClass: 'bg-amber-500/10',
            borderClass: 'border-amber-500/20',
          },
          {
            title: 'Diet: Probiotics & Fiber',
            desc: 'Help the liver metabolize rising estrogen efficiently with fermented foods (kimchi, yogurt) and raw colorful vegetables.',
            icon: Lightbulb,
            colorClass: 'text-teal-500',
            bgClass: 'bg-teal-500/10',
            borderClass: 'border-teal-500/20',
          },
        ] as PhaseTip[],
      }
    }

    if (isFertile) {
      return {
        name: 'Ovulatory Phase',
        badge: 'PEAK VITALITY',
        accentColor: 'text-teal-500',
        borderColor: 'border-teal-500/20',
        bgColor: 'from-teal-500/10 to-transparent',
        tips: [
          {
            title: 'Hormonal peaks',
            desc: 'Estrogen peaks and testosterone spikes. This triggers high verbal confidence, social charisma, and peak physical strength.',
            icon: Info,
            colorClass: 'text-teal-500',
            bgClass: 'bg-teal-500/10',
            borderClass: 'border-teal-500/20',
          },
          {
            title: 'Support: High effort connection',
            desc: 'Plan a special date night at a beautiful restaurant. Match her radiant vibe by dressing up and engaging in high-level conversation.',
            icon: Heart,
            colorClass: 'text-teal-600',
            bgClass: 'bg-teal-500/10',
            borderClass: 'border-teal-500/20',
          },
          {
            title: 'Diet: Anti-inflammatory support',
            desc: 'Ovulation expends high cellular energy. Support it with antioxidant fruits (blueberries, oranges) and green leafy vegetables.',
            icon: Lightbulb,
            colorClass: 'text-amber-500',
            bgClass: 'bg-amber-500/10',
            borderClass: 'border-amber-500/20',
          },
        ] as PhaseTip[],
      }
    }

    // Default to Luteal / Premenstrual
    return {
      name: 'Luteal Phase',
      badge: 'NESTING & PMS',
      accentColor: 'text-pink-500',
      borderColor: 'border-pink-500/20',
      bgColor: 'from-pink-500/10 to-transparent',
      tips: [
        {
          title: 'Progesterone takeover',
          desc: 'Progesterone slows digestion and increases core body temperature. Serotonin sensitivity changes, which may trigger fatigue or cravings.',
          icon: Info,
          colorClass: 'text-pink-500',
          bgClass: 'bg-pink-500/10',
          borderClass: 'border-pink-500/20',
        },
        {
          title: 'Support: Cozy quiet spaces',
          desc: 'Keep the bedroom cool, dim household lights, and handle high-stimulation chores. Validate her moods and avoid open debates.',
          icon: Heart,
          colorClass: 'text-pink-600',
          bgClass: 'bg-pink-500/10',
          borderClass: 'border-pink-500/20',
        },
        {
          title: 'Diet: Magnesium & B6',
          desc: 'Curb fatigue and pre-period discomfort. Munch on avocados, seeds, raw almonds, dark chocolate, and bananas.',
          icon: Lightbulb,
          colorClass: 'text-amber-500',
          bgClass: 'bg-amber-500/10',
          borderClass: 'border-amber-500/20',
        },
      ] as PhaseTip[],
    }
  }, [isMenstrual, isFollicular, isFertile])

  return (
    <div className="cycle-tips-container space-y-6">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-lg font-medium text-[var(--mf-text-strong)] tracking-tight">
          Cycle Insights
        </h2>
        <span className={cn(
          "text-[9px] font-medium uppercase tracking-[0.15em] border px-2.5 py-0.5 rounded-full transition-all duration-500",
          phaseInfo.accentColor,
          phaseInfo.borderColor
        )}>
          {phaseInfo.badge} (Day {activeDay})
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {phaseInfo.tips.map((tip, idx) => {
          const TipIcon = tip.icon
          return (
            <div 
              key={tip.title} 
              className={cn(
                "flo-card relative overflow-hidden group transition-all duration-500 border border-[var(--mf-border)] !shadow-none p-5 flex flex-col justify-between",
                idx === 0 && "bg-gradient-to-br"
              )}
              style={idx === 0 ? { backgroundImage: `linear-gradient(135deg, var(--mf-card), rgba(${isMenstrual ? '239, 68, 68' : isFollicular ? '245, 158, 11' : isFertile ? '20, 184, 166' : '236, 72, 153'}, 0.04))` } : undefined}
            >
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className={cn("p-1.5 rounded-xl border border-transparent", tip.bgClass, tip.borderClass)}>
                    {TipIcon === Heart ? (
                      <img src="/images/heart.png" alt="" className="size-4 object-contain" />
                    ) : (
                      <TipIcon size={16} className={tip.colorClass} weight="fill" />
                    )}
                  </div>
                  <h3 className="text-xs font-normal uppercase tracking-wider text-[var(--mf-text-strong)] opacity-90">
                    {tip.title}
                  </h3>
                </div>
                <p className="text-xs text-[var(--mf-text)] leading-relaxed font-normal">
                  {tip.desc}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
