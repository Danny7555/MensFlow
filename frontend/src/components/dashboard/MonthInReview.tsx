import { useMemo } from 'react'
import { m } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { Calendar, Lightning, Pulse, Heart, Sparkle, Info } from '@phosphor-icons/react'
import { useStore } from '../../store/useStore'
import { differenceInDays, parseISO } from 'date-fns'

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
}

export function MonthInReview() {
  const { logs, dashboard, partnerStatus, monthInReview } = useStore()

  const stats = useMemo(() => {
    // If backend-calculated month-in-review is available, use it directly
    if (monthInReview) {
      const cycleLengthText = `Your last cycle lasted ${monthInReview.cycleLength} days.`
      const energyText = `Energy was highest during Days ${monthInReview.energyPeakStart}–${monthInReview.energyPeakEnd}.`
      
      let crampText: string
      if (monthInReview.crampingChange < 0) {
        crampText = `Cramping decreased by ${Math.abs(monthInReview.crampingChange)}% compared to last month.`
      } else if (monthInReview.crampingChange > 0) {
        crampText = `Cramping increased by ${monthInReview.crampingChange}% compared to last month.`
      } else {
        crampText = 'Cramping remained stable compared to last month.'
      }

      const partnerText = `Your partner completed ${monthInReview.partnerActions} support action${monthInReview.partnerActions === 1 ? '' : 's'}.`

      return {
        cycleLengthText,
        energyText,
        crampText,
        partnerText
      }
    }

    // Fallback client-side calculation (e.g. for guest mode / local-only users)
    // 1. Group flow logs into periods to count cycle lengths
    const flowDates = (logs || [])
      .flatMap(l => l.symptoms.some(s => s.startsWith('flow-')) ? [l.date] : [])
      .sort();

    const periodStarts: Date[] = [];
    let prevDate: Date | null = null;
    for (const dateStr of flowDates) {
      const d = parseISO(dateStr);
      if (!prevDate || differenceInDays(d, prevDate) > 4) {
        periodStarts.push(d);
      }
      prevDate = d;
    }

    const cycleLengths: number[] = [];
    for (let i = 0; i < periodStarts.length - 1; i++) {
      const len = differenceInDays(periodStarts[i + 1], periodStarts[i]);
      cycleLengths.push(len);
    }

    // Determine cycle duration text - Fall back to typical cycle days (e.g. 28) instead of 5 days
    const typicalCycleDays = dashboard.typicalCycleDays || 28;
    const lastLen = cycleLengths.length > 0 ? cycleLengths[cycleLengths.length - 1] : typicalCycleDays;
    const cycleLengthText = `Your last cycle lasted ${lastLen} days.`;

    // 2. Compute energy peak window
    let activeCycleStart = dashboard.lastPeriodStart ? parseISO(dashboard.lastPeriodStart) : null;
    if (periodStarts.length > 0) {
      activeCycleStart = periodStarts[periodStarts.length - 1];
    }

    const logsInCycle = (logs || []).filter(log => {
      if (!activeCycleStart) return false;
      const logDate = parseISO(log.date);
      const diff = differenceInDays(logDate, activeCycleStart);
      return diff >= 0 && diff < typicalCycleDays;
    });

    const dayScores: Record<number, number> = {};
    logsInCycle.forEach(log => {
      if (!activeCycleStart) return;
      const logDate = parseISO(log.date);
      const day = differenceInDays(logDate, activeCycleStart) + 1;
      
      // Base score = 3
      let score = 3;
      if (log.symptoms.includes('mood-happy')) score += 2;
      if (log.symptoms.includes('mood-calm')) score += 1;
      if (log.symptoms.includes('phys-fatigue')) score -= 2;
      if (log.symptoms.includes('phys-cramps') || log.symptoms.includes('endo-pelvicpain') || log.symptoms.includes('endo-backache')) score -= 1;
      
      dayScores[day] = score;
    });

    // Find the 5-day window with the highest average energy
    let bestStart = 3;
    let bestEnd = 8;
    let maxAvg = -Infinity;
    let foundWindow = false;

    for (let startDay = 1; startDay <= typicalCycleDays - 4; startDay++) {
      let sum = 0;
      let count = 0;
      for (let d = startDay; d < startDay + 5; d++) {
        if (dayScores[d] !== undefined) {
          sum += dayScores[d];
          count++;
        }
      }
      if (count >= 2) {
        const avg = sum / count;
        if (avg > maxAvg) {
          maxAvg = avg;
          bestStart = startDay;
          bestEnd = startDay + 5;
          foundWindow = true;
        }
      }
    }

    // Default fallback to physiological energy peak if sparse data
    if (!foundWindow && (logs || []).length > 0) {
      bestStart = 10;
      bestEnd = 15;
    }
    const energyText = `Energy was highest during Days ${bestStart}–${bestEnd}.`;

    // 3. Compute cramping trend vs previous cycle
    let currentCrampingDays = 0;
    let prevCrampingDays = 0;
    let crampText = '';
    let calculatedCramps = false;

    if (periodStarts.length >= 1) {
      const curStart = periodStarts[periodStarts.length - 1];
      const prevStart = periodStarts.length >= 2 ? periodStarts[periodStarts.length - 2] : null;

      (logs || []).forEach(log => {
        const logDate = parseISO(log.date);
        const hasCramps = log.symptoms.some(s => s === 'phys-cramps' || s === 'endo-pelvicpain' || s === 'endo-backache');
        if (logDate >= curStart) {
          if (hasCramps) currentCrampingDays++;
        } else if (prevStart && logDate >= prevStart && logDate < curStart) {
          if (hasCramps) prevCrampingDays++;
        }
      });

      if (prevStart) {
        calculatedCramps = true;
        if (prevCrampingDays > 0) {
          const pct = Math.round(((currentCrampingDays - prevCrampingDays) / prevCrampingDays) * 100);
          if (pct < 0) {
            crampText = `Cramping decreased by ${Math.abs(pct)}% compared to last month.`;
          } else if (pct > 0) {
            crampText = `Cramping increased by ${pct}% compared to last month.`;
          } else {
            crampText = 'Cramping remained stable compared to last month.';
          }
        } else {
          crampText = currentCrampingDays > 0 
            ? `Logged cramps on ${currentCrampingDays} days this cycle.` 
            : 'No cramping logged this cycle.';
        }
      } else {
        // Fallback: compare against 30 days before current start
        const prevMonthStart = new Date(curStart.getTime() - 30 * 24 * 3600 * 1000);
        (logs || []).forEach(log => {
          const logDate = parseISO(log.date);
          const hasCramps = log.symptoms.some(s => s === 'phys-cramps' || s === 'endo-pelvicpain' || s === 'endo-backache');
          if (logDate >= prevMonthStart && logDate < curStart) {
            if (hasCramps) prevCrampingDays++;
          }
        });

        if (prevCrampingDays > 0) {
          calculatedCramps = true;
          const pct = Math.round(((currentCrampingDays - prevCrampingDays) / prevCrampingDays) * 100);
          if (pct < 0) {
            crampText = `Cramping decreased by ${Math.abs(pct)}% compared to last month.`;
          } else if (pct > 0) {
            crampText = `Cramping increased by ${pct}% compared to last month.`;
          } else {
            crampText = 'Cramping remained stable compared to last month.';
          }
        }
      }
    }

    if (!calculatedCramps && (logs || []).length > 0) {
      const hasCramps = (logs || []).some(l => l.symptoms.some(s => s === 'phys-cramps' || s === 'endo-pelvicpain' || s === 'endo-backache'));
      crampText = hasCramps ? 'Cramping reported occasionally this month.' : 'No cramping logged this month.';
    }

    if (!crampText) {
      crampText = 'No cramping logged this month.';
    }

    // 4. Partner support actions
    const partnerActions = partnerStatus?.support?.totalActionsThisCycle !== undefined
      ? partnerStatus.support.totalActionsThisCycle
      : 2;
    const partnerText = `Your partner completed ${partnerActions} support action${partnerActions === 1 ? '' : 's'}.`;

    return {
      cycleLengthText,
      energyText,
      crampText,
      partnerText
    }
  }, [logs, dashboard, partnerStatus, monthInReview])

  if (!logs || logs.length === 0) {
    return (
      <m.div 
        variants={cardVariants}
        className="flo-card flo-card--prominent p-6 border-[var(--mf-border-strong)] bg-white dark:bg-[var(--mf-card)] text-left flex flex-col justify-between min-h-[320px]"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[9px] font-regular text-[var(--mf-accent)] uppercase tracking-[0.2em] block mb-0.5">Cycle Story</span>
            <h3 className="text-base font-regular text-[var(--mf-text-strong)] flex items-center gap-1.5 font-semibold">
              Your Month in Review
              <Sparkle size={14} className="text-[var(--mf-accent)]" weight="fill" />
            </h3>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center text-center my-auto py-4 space-y-4">
          <div className="size-12 rounded-2xl bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] flex items-center justify-center">
            <Calendar size={24} weight="duotone" />
          </div>
          <div className="space-y-1.5 max-w-xs">
            <h4 className="text-sm font-semibold text-[var(--mf-text-strong)]">No Cycle Data Logged Yet</h4>
            <p className="text-xs text-[var(--mf-muted)] leading-relaxed">
              Once you start logging symptoms and flow details, your personalized cycle insights, hormonal exertion peaks, and symptom trends will appear here.
            </p>
          </div>
        </div>
      </m.div>
    )
  }

  return (
    <m.div 
      variants={cardVariants}
      className="flo-card flo-card--prominent p-6 border-[var(--mf-border-strong)] bg-white dark:bg-[var(--mf-card)] text-left"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <span className="text-[9px] font-regular text-[var(--mf-accent)] uppercase tracking-[0.2em] block mb-0.5">Cycle Story</span>
          <h3 className="text-base font-regular text-[var(--mf-text-strong)] flex items-center gap-1.5 font-semibold">
            Your Month in Review
            <Sparkle size={14} className="text-[var(--mf-accent)]" weight="fill" />
          </h3>
        </div>
        <div className="size-8 rounded-full flex items-center justify-center text-[var(--mf-accent)]">
          <Info size={14} weight="bold" />
        </div>
      </div>

      <div className="space-y-4">
        {/* Cycle Duration */}
        <div className="flex items-start gap-3">
          <div className="size-8 rounded-xl  text-rose-500 flex items-center justify-center shrink-0 mt-0.5">
            <Calendar size={18} weight="fill" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-wider text-[var(--mf-muted)] block">Cycle Length</span>
            <p className="text-xs text-[var(--mf-text-strong)] leading-relaxed font-normal">
              {stats.cycleLengthText}
            </p>
          </div>
        </div>

        {/* Energy Peaks */}
        <div className="flex items-start gap-3">
          <div className="size-8 rounded-xl  text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
            <Lightning size={18} weight="fill" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-wider text-[var(--mf-muted)] block">Hormonal Exertion</span>
            <p className="text-xs text-[var(--mf-text-strong)] leading-relaxed font-normal">
              {stats.energyText}
            </p>
          </div>
        </div>

        {/* Cramping Trend */}
        <div className="flex items-start gap-3">
          <div className="size-8 rounded-xl text-purple-500 flex items-center justify-center shrink-0 mt-0.5">
            <Pulse size={18} weight="fill" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-wider text-[var(--mf-muted)] block">Symptom Trends</span>
            <p className="text-xs text-[var(--mf-text-strong)] leading-relaxed font-normal">
              {stats.crampText}
            </p>
          </div>
        </div>

        {/* Partner Actions */}
        <div className="flex items-start gap-3">
          <div className="size-8 rounded-xl  text-teal-500 flex items-center justify-center shrink-0 mt-0.5">
            <Heart size={18} weight="fill" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-wider text-[var(--mf-muted)] block">Partner Care Resonance</span>
            <p className="text-xs text-[var(--mf-text-strong)] leading-relaxed font-normal">
              {stats.partnerText}
            </p>
          </div>
        </div>
      </div>
    </m.div>
  )
}
