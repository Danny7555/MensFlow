export type CyclePhase = 'Menstrual' | 'Follicular' | 'Ovulatory' | 'Luteal';

export type CycleModelInput = {
  lastPeriodStart?: string;
  typicalCycleDays?: number;
  symptoms?: string[];
  flowIntensity?: string;
  cycleVariationDays?: number;
};

export type CycleModel = {
  cycleDay: number;
  phaseLabel: CyclePhase;
  hormoneTrend: string;
  bodySignals: string;
  guidanceLines: string[];
  isAtypical: boolean;
  cycleVariationDays: number;
};

export function buildCycleModel(input: CycleModelInput): CycleModel {
  const typicalCycleDays = clampNumber(input.typicalCycleDays, 15, 60, 28);
  const cycleDay = computeCycleDay(input.lastPeriodStart, typicalCycleDays);
  const phaseLabel = getPhaseFromDay(cycleDay, typicalCycleDays);
  const symptoms = input.symptoms ?? [];
  const flowIntensity = normalizeFlow(input.flowIntensity, symptoms);
  const cycleVariationDays = clampNumber(input.cycleVariationDays, 0, 120, typicalCycleDays > 35 || typicalCycleDays < 24 ? 18 : 8);
  const isAtypical = typicalCycleDays < 24 || typicalCycleDays > 35 || cycleVariationDays > 14;

  return {
    cycleDay,
    phaseLabel,
    hormoneTrend: hormoneTrendForPhase(phaseLabel),
    bodySignals: buildBodySignals(symptoms, flowIntensity, phaseLabel),
    guidanceLines: buildGuidanceLines(phaseLabel, flowIntensity, isAtypical),
    isAtypical,
    cycleVariationDays,
  };
}

export function computeCycleDay(startIso?: string, cycleLen = 28): number {
  const safeCycleLen = clampNumber(cycleLen, 15, 60, 28);
  const start = startIso ? new Date(`${startIso}T12:00:00`) : null;
  if (!start || Number.isNaN(start.getTime())) return 1;
  const days = Math.floor((Date.now() - start.getTime()) / 86_400_000);
  const normalized = ((days % safeCycleLen) + safeCycleLen) % safeCycleLen;
  return normalized + 1;
}

export function getPhaseFromDay(cycleDay: number, cycleLen = 28): CyclePhase {
  const safeCycleLen = clampNumber(cycleLen, 15, 60, 28);
  const periodLength = safeCycleLen <= 24 ? 4 : safeCycleLen >= 36 ? 6 : 5;
  const ovulationDay = Math.max(periodLength + 5, safeCycleLen - 14);
  const fertileStart = Math.max(periodLength + 1, ovulationDay - 4);
  const fertileEnd = Math.min(safeCycleLen, ovulationDay + 2);
  const lateLutealStart = fertileEnd + 1;

  if (cycleDay <= periodLength) return 'Menstrual';
  if (cycleDay >= fertileStart && cycleDay <= fertileEnd) return 'Ovulatory';
  if (cycleDay >= lateLutealStart) return 'Luteal';
  return 'Follicular';
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function normalizeFlow(flowIntensity: unknown, symptoms: string[]): string {
  if (flowIntensity === 'heavy' || symptoms.includes('flow-heavy')) return 'heavy';
  if (flowIntensity === 'light' || symptoms.includes('flow-light')) return 'light';
  if (flowIntensity === 'moderate' || symptoms.includes('flow-medium')) return 'moderate';
  if (flowIntensity === 'variable') return 'variable';
  return 'unknown';
}

function hormoneTrendForPhase(phase: CyclePhase): string {
  if (phase === 'Menstrual') return 'Estrogen and progesterone are low';
  if (phase === 'Follicular') return 'Estrogen is rising';
  if (phase === 'Ovulatory') return 'Estrogen peaks with LH surge window';
  return 'Progesterone is elevated';
}

function buildBodySignals(symptoms: string[], flowIntensity: string, phase: CyclePhase): string {
  const labels = symptoms.map((symptom) => symptom.replace(/^(phys|mood|flow|life|pcos|endo|peri)-/, '').replace(/-/g, ' '));
  const signals = labels.slice(0, 4);
  if (flowIntensity !== 'unknown' && !signals.some((signal) => signal.includes('flow'))) {
    signals.unshift(`${flowIntensity} flow`);
  }
  if (signals.length > 0) return signals.join(', ');
  if (phase === 'Menstrual') return 'Flow, cramps, energy, and comfort need monitoring';
  if (phase === 'Ovulatory') return 'Mucus, LH, libido, and energy signals matter today';
  if (phase === 'Luteal') return 'Sleep, cravings, mood, and tenderness may shift';
  return 'Energy, mood, and recovery are building';
}

function buildGuidanceLines(phase: CyclePhase, flowIntensity: string, isAtypical: boolean): string[] {
  const lines: string[] = [];

  if (phase === 'Menstrual') {
    lines.push('Confirm flow level and symptoms today so predictions are based on real cycle evidence.');
  } else if (phase === 'Ovulatory') {
    lines.push('Use LH or cervical mucus logs when available because ovulation timing shifts by cycle length.');
  } else if (phase === 'Luteal') {
    lines.push('Watch sleep, cravings, tenderness, and mood changes as progesterone stays elevated.');
  } else {
    lines.push('Track energy and mood as estrogen rises through the follicular phase.');
  }

  if (flowIntensity === 'heavy') {
    lines.push('Heavy-flow support should include hydration, iron-rich food, warmth, and pain-aware planning.');
  } else if (flowIntensity === 'variable') {
    lines.push('Variable flow needs consistent daily logs before the app treats predictions as high confidence.');
  }

  if (isAtypical) {
    lines.push('Cycle timing is outside the common 24-35 day range or varies widely, so trend confidence improves over several logged cycles.');
  }

  return lines;
}
