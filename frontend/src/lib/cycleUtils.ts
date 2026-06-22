export function computeCycleDay(startIso: string, cycleLen: number): number {
  const safeCycleLen = Math.min(60, Math.max(15, Math.round(cycleLen || 28)))
  const start = new Date(`${startIso}T12:00:00`)
  if (Number.isNaN(+start)) return 1
  const days = Math.round((Date.now() - +start) / 86400000)
  const m = ((days % safeCycleLen) + safeCycleLen) % safeCycleLen
  return m + 1
}

export type CyclePhase = 'menstrual' | 'follicular' | 'fertile' | 'luteal'

/**
 * Returns the cycle phase for a given day, using cycle-length-aware thresholds.
 * - Ovulation is assumed at cycleLen - 14 (standard luteal phase length)
 * - Fertile window: 4 days before through 2 days after ovulation
 * - PMS / late luteal: last 5 days of the cycle
 * - Period: days 1-5, light trailing: days 6-7, then follicular until fertile window
 */
export function getPhaseFromDay(
  cycleDay: number,
  cycleLen = 28,
  lhPeakDay?: number | null,
  eggWhiteMucusDay?: number | null
): CyclePhase {
  const safeCycleLen = Math.min(60, Math.max(15, Math.round(cycleLen || 28)))
  const periodLength = safeCycleLen <= 24 ? 4 : safeCycleLen >= 36 ? 6 : 5
  
  // Calculate standard ovulation day
  let ovulationDay = Math.max(periodLength + 5, safeCycleLen - 14)

  // Shift ovulation based on biological evidence if within safe cycle boundaries
  if (lhPeakDay && lhPeakDay >= periodLength + 1 && lhPeakDay <= safeCycleLen) {
    ovulationDay = lhPeakDay + 1 // Ovulation is ~24-48 hours after LH surge
  } else if (eggWhiteMucusDay && eggWhiteMucusDay >= periodLength + 1 && eggWhiteMucusDay <= safeCycleLen) {
    ovulationDay = eggWhiteMucusDay // Cervical mucus peak indicates ovulation
  }

  const fertileStart = Math.max(periodLength + 1, ovulationDay - 4)
  const fertileEnd = Math.min(safeCycleLen, ovulationDay + 2)
  const lutealStart = fertileEnd + 1

  if (cycleDay <= periodLength) return 'menstrual'
  if (cycleDay >= fertileStart && cycleDay <= fertileEnd) return 'fertile'
  if (cycleDay >= lutealStart) return 'luteal'
  return 'follicular'
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export interface PhaseInfo {
  label: string
  color: string
  bgColor: string
  description: string
}

export function getPhaseInfo(phase: CyclePhase): PhaseInfo {
  switch (phase) {
    case 'menstrual':
      return {
        label: 'Menstrual',
        color: '#f43f5e',
        bgColor: 'rgba(244, 63, 94, 0.1)',
        description: 'Rest and restore. Your body is releasing and renewing.'
      }
    case 'follicular':
      return {
        label: 'Follicular',
        color: '#0d9488',
        bgColor: 'rgba(13, 148, 136, 0.1)',
        description: 'Energy is rising. Great time for new ideas and plans.'
      }
    case 'fertile':
      return {
        label: 'Ovulatory',
        color: '#26899e',
        bgColor: 'rgba(38, 137, 158, 0.1)',
        description: 'Peak social and physical energy. Highest fertility window.'
      }
    case 'luteal':
      return {
        label: 'Luteal',
        color: '#d97706',
        bgColor: 'rgba(217, 119, 6, 0.1)',
        description: 'Pre-period phase. Prioritise calm, comfort, and self-care.'
      }
    default:
      return {
        label: 'Unknown',
        color: '#999',
        bgColor: 'rgba(153, 153, 153, 0.1)',
        description: 'Tracking your cycle...'
      }
  }
}

export interface SupportTask {
  id: string
  label: string
}

export const getPhaseTasks = (phase: string): SupportTask[] => {
  const normalized = (phase || '').toLowerCase()
  if (normalized.includes('menstrual')) {
    return [
      { id: 'm-heating-pad', label: 'Prepare heating pad' },
      { id: 'm-ginger-tea', label: 'Offer warm ginger tea' },
      { id: 'm-physical-chores', label: 'Handle physical chores' }
    ]
  }
  if (normalized.includes('follicular')) {
    return [
      { id: 'f-outdoor', label: 'Plan outdoor activity' },
      { id: 'f-social', label: "Encourage a girl's night out / social space" },
      { id: 'f-surprise', label: 'Surprise with a small thoughtful gesture' }
    ]
  }
  if (normalized.includes('ovulatory') || normalized.includes('fertile') || normalized.includes('window')) {
    return [
      { id: 'o-date-night', label: 'Schedule special date night' },
      { id: 'o-post-it', label: 'Leave a handwritten post-it note' },
      { id: 'o-conversation', label: 'Initiate a creative connection' }
    ]
  }
  // Default to Luteal/PMS
  return [
    { id: 'l-comfort-snack', label: 'Pick up favorite comfort snack' },
    { id: 'l-heavy-discussions', label: 'Hold off on heavy/stressful debates' },
    { id: 'l-foot-massage', label: 'Run a soothing foot or back massage' }
  ]
}

export interface PeriodInfo {
  startDate: string;
  duration: number;
  cycleLength?: number;
}

export function calculatePeriodsFromLogs(
  logs: Array<{ date: string; symptoms: string[] }>
): PeriodInfo[] {
  const flowLogs = logs
    .filter(l => l.symptoms.some(s => s.startsWith('flow-')))
    .sort((a, b) => a.date.localeCompare(b.date));

  const periods: PeriodInfo[] = [];
  if (flowLogs.length === 0) return [];

  let currentStartStr = flowLogs[0].date;
  let prevDate = new Date(flowLogs[0].date + 'T12:00:00');
  let currentDuration = 1;

  for (let i = 1; i < flowLogs.length; i++) {
    const log = flowLogs[i];
    const d = new Date(log.date + 'T12:00:00');
    const diff = Math.round((d.getTime() - prevDate.getTime()) / (1000 * 3600 * 24));
    
    if (diff > 4) {
      // gap > 4 days starts a new period
      periods.push({
        startDate: currentStartStr,
        duration: currentDuration,
      });
      currentStartStr = log.date;
      currentDuration = 1;
    } else {
      currentDuration++;
    }
    prevDate = d;
  }
  periods.push({
    startDate: currentStartStr,
    duration: currentDuration,
  });

  // Calculate cycle lengths (days between consecutive period starts)
  for (let i = 0; i < periods.length - 1; i++) {
    const d1 = new Date(periods[i].startDate + 'T12:00:00');
    const d2 = new Date(periods[i + 1].startDate + 'T12:00:00');
    const len = Math.round((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24));
    periods[i].cycleLength = len;
  }

  // Reverse so the most recent is at the top
  return periods.reverse();
}
