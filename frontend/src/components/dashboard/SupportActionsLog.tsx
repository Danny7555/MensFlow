import { useEffect } from 'react'
import { Check } from '@phosphor-icons/react'
import { useStore } from '../../store/useStore'
import { toast } from 'sonner'

import { getPhaseTasks } from '../../lib/cycleUtils'

interface PhaseStyle {
  accentColor: string
  accentBg: string
  borderColor: string
  badgeText: string
  progressBarColor: string
}

const getPhaseStyle = (phase: string): PhaseStyle => {
  const normalized = (phase || '').toLowerCase()
  if (normalized.includes('menstrual')) {
    return {
      accentColor: 'text-rose-500',
      accentBg: 'bg-rose-500/10',
      borderColor: 'border-rose-500/20',
      badgeText: 'Menstrual Care',
      progressBarColor: 'bg-rose-500'
    }
  }
  if (normalized.includes('follicular')) {
    return {
      accentColor: 'text-amber-500',
      accentBg: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      badgeText: 'Follicular Focus',
      progressBarColor: 'bg-amber-500'
    }
  }
  if (normalized.includes('ovulatory') || normalized.includes('fertile') || normalized.includes('window')) {
    return {
      accentColor: 'text-teal-500',
      accentBg: 'bg-teal-500/10',
      borderColor: 'border-teal-500/20',
      badgeText: 'Ovulatory Connection',
      progressBarColor: 'bg-teal-500'
    }
  }
  return {
    accentColor: 'text-pink-500',
    accentBg: 'bg-pink-500/10',
    borderColor: 'border-pink-500/20',
    badgeText: 'Luteal Empathy',
    progressBarColor: 'bg-pink-500'
  }
}

export function SupportActionsLog() {
  const { 
    dashboard: ownDashboard, 
    partnerStatus,
    user,
    completedActions, 
    supportStreak, 
    toggleSupportAction, 
    checkAndResetDailyActions 
  } = useStore()

  useEffect(() => {
    checkAndResetDailyActions()
  }, [checkAndResetDailyActions])

  const data = user?.role === 'partner' && partnerStatus?.paired && partnerStatus?.cycle
    ? partnerStatus.cycle
    : ownDashboard

  const phaseLabel = data?.phaseLabel || 'Menstrual Phase'
  const tasks = getPhaseTasks(phaseLabel)
  const completedCount = tasks.filter(t => completedActions.includes(t.id)).length
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0
  const theme = getPhaseStyle(phaseLabel)

  const handleToggle = (id: string, label: string) => {
    const wasCompleted = completedActions.includes(id)
    toggleSupportAction(id)
    
    if (!wasCompleted) {
      toast.success(`Completed: "${label}"!`, {
        icon: <img src="/images/heart.png" alt="" className="size-4 object-contain" />,
        duration: 3000
      })
    }
  }

  return (
    <div className="flo-card flo-card--prominent relative overflow-hidden group transition-all duration-500 mb-8 border border-[var(--mf-border)] !shadow-none">
      
      <div className="relative z-10 flex items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`w-fit text-[9px] font-normal uppercase tracking-[0.12em] ${theme.accentBg} ${theme.accentColor} px-3 py-1 rounded-full border ${theme.borderColor}`}>
              {theme.badgeText}
            </span>
            <div className={`flex items-center gap-1.5 text-[10px] ${theme.accentColor} font-normal`}>
              <img src="/images/star.png" alt="Star" className="size-3.5 object-contain" />
              <span>Empathy Tracker</span>
            </div>
          </div>
          <h3 className="text-lg font-normal text-[var(--mf-text-strong)] tracking-tight">
            Daily Support Checklist
          </h3>
          <p className="text-[11px] text-[var(--mf-muted)] mt-1.5 max-w-md leading-relaxed">
            Tailored supportive gestures to strengthen your bond during her {phaseLabel} Phase.
          </p>
        </div>

        {/* Streak Badge */}
        <div className="flex flex-col items-center justify-center bg-[var(--mf-card)] border border-[var(--mf-border)] rounded-2xl px-3.5 py-2.5 !shadow-none transition-all duration-300">
          <div className="flex items-center gap-1.5 text-amber-500">
            <img src="/images/star.png" alt="Streak" className={`size-5 object-contain ${supportStreak > 0 ? "animate-pulse" : ""}`} />
            <span className="text-lg font-normal font-mono">{supportStreak}</span>
          </div>
          <span className="text-[9px] uppercase tracking-wider text-[var(--mf-muted)] mt-0.5 font-normal">
            Streak Days
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative z-10 mb-6 bg-[var(--mf-hover)]/30 border border-[var(--mf-border)]/40 p-4 rounded-2xl">
        <div className="flex justify-between items-center mb-2 text-xs">
          <span className="text-[var(--mf-muted)] font-normal">Today's Support Goal</span>
          <span className="text-[var(--mf-text-strong)] font-normal font-mono">{progressPercent}%</span>
        </div>
        <div className="w-full h-2 bg-[var(--mf-border)]/40 rounded-full overflow-hidden">
          <div 
            className={`h-full ${theme.progressBarColor} rounded-full transition-all duration-500 ease-out`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Task list */}
      <div className="relative z-10 space-y-2.5">
        {tasks.map((task) => {
          const isDone = completedActions.includes(task.id)
          return (
            <button
              key={task.id}
              onClick={() => handleToggle(task.id, task.label)}
              type="button"
              className={`w-full text-left flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-300 !shadow-none ${
                isDone 
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-[var(--mf-text)]' 
                  : 'bg-[var(--mf-card)] border-[var(--mf-border)] hover:border-[var(--mf-accent)]/40 text-[var(--mf-text-strong)]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div 
                  className={`size-5 rounded-full border flex items-center justify-center transition-all ${
                    isDone 
                      ? 'bg-emerald-500 border-emerald-500 text-white scale-105' 
                      : 'border-[var(--mf-muted)]/50 text-transparent hover:border-[var(--mf-accent)]'
                  }`}
                >
                  <Check size={10} weight="bold" />
                </div>
                <span className={`text-[12.5px] font-normal leading-tight transition-all duration-300 ${
                  isDone ? 'line-through opacity-65 text-[var(--mf-muted)]' : ''
                }`}>
                  {task.label}
                </span>
              </div>

              {isDone && (
                <img src="/images/heart.png" alt="" className="size-3.5 object-contain animate-pulse shrink-0 ml-2" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
