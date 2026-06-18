export type CycleTrend = 'lengthening' | 'shortening' | 'stable';

export type MLPrediction = {
  predictedCycleDays: number;
  trend: CycleTrend;
  trendStrength: number;
  nextPeriodEarliest: string | null;
  nextPeriodLatest: string | null;
  predictionWindowDays: number;
  nextPeriodConfidence: number;
};

export function predictWithML(
  historicalCycleLengths: number[],
  lastPeriodStart?: string,
): MLPrediction | null {
  if (historicalCycleLengths.length < 2 || !lastPeriodStart) return null;

  const sorted = [...historicalCycleLengths].sort((a, b) => a - b);
  const validLengths = sorted.filter(l => l >= 15 && l <= 60);
  if (validLengths.length < 2) return null;

  const n = validLengths.length;

  // ── Exponential Weighted Moving Average ──────────────────────────────
  // Recent cycles get more weight. Alpha = 0.4 means ~60% weight on recent.
  const alpha = 0.4;
  let ewma = validLengths[0];
  for (let i = 1; i < n; i++) {
    ewma = alpha * validLengths[i] + (1 - alpha) * ewma;
  }
  const predictedCycleDays = Math.round(clamp(ewma, 15, 60));

  // ── Linear Regression Trend ──────────────────────────────────────────
  // Detect if cycles are trending longer or shorter over time.
  const indices = validLengths.map((_, i) => i);
  const meanX = (n - 1) / 2;
  const meanY = validLengths.reduce((a, b) => a + b, 0) / n;

  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    const dx = i - meanX;
    num += dx * (validLengths[i] - meanY);
    den += dx * dx;
  }

  const slope = den !== 0 ? num / den : 0;
  const trendStrength = Math.abs(slope);
  const trend: CycleTrend = slope > 0.5 ? 'lengthening' : slope < -0.5 ? 'shortening' : 'stable';

  // ── Prediction Interval ──────────────────────────────────────────────
  // Based on observed variance. More cycles = tighter window.
  const variance = validLengths.reduce((sum, l) => sum + (l - meanY) ** 2, 0) / n;
  const stdDev = Math.sqrt(variance);

  // Window shrinks as we have more data. At 2 cycles: ±5 days, at 10+: ±2 days
  const windowDays = Math.max(2, Math.round(5 - (n - 2) * 0.375));
  const predictionWindowDays = windowDays;

  const start = new Date(`${lastPeriodStart}T12:00:00`);
  if (isNaN(start.getTime())) return null;

  const earliest = new Date(start.getTime() + (predictedCycleDays - windowDays) * 86_400_000);
  const latest = new Date(start.getTime() + (predictedCycleDays + windowDays) * 86_400_000);

  // ── Confidence Score ─────────────────────────────────────────────────
  // Based on CV (coefficient of variation) and number of cycles
  const cv = meanY > 0 ? stdDev / meanY : 1;
  const dataConfidence = Math.min(1, (n - 1) / 5);
  const stabilityConfidence = Math.max(0, 1 - cv * 2);
  const nextPeriodConfidence = Math.round(Math.min(0.95, Math.max(0.1, dataConfidence * stabilityConfidence)) * 100);

  return {
    predictedCycleDays,
    trend,
    trendStrength,
    nextPeriodEarliest: earliest.toISOString().split('T')[0],
    nextPeriodLatest: latest.toISOString().split('T')[0],
    predictionWindowDays,
    nextPeriodConfidence,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
