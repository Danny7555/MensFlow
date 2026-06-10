import { SymptomLog, CustomSymptom } from '../models/Symptom';
import { ISymptomLog, ICustomSymptom } from '../interfaces';
import { User } from '../models/User';
import { Dashboard } from '../models/Dashboard';
import { SupportAction } from '../models/Partner';
import { Settings } from '../models/Settings';

export async function getSymptomLogs(userId: string): Promise<ISymptomLog[]> {
  const user = await User.findById(userId).lean();
  if (user?.role === 'partner' && user.partnerId) {
    const partnerSettings = await Settings.findOne({ userId: user.partnerId }).lean();
    if (partnerSettings && !partnerSettings.privacyShareSymptomLogs) {
      return [];
    }
  }
  const targetId = (user?.role === 'partner' && user.partnerId) ? user.partnerId : userId;
  const logs = await SymptomLog.find({ userId: targetId }).sort({ date: -1 }).lean();
  return logs.map((l) => ({
    userId: String(l.userId),
    date: l.date,
    symptoms: l.symptoms,
    water: l.water !== undefined ? l.water : 1000,
    weight: l.weight !== undefined ? l.weight : 62.5,
    lhLevel: l.lhLevel !== undefined ? l.lhLevel : null,
    mucus: l.mucus !== undefined ? l.mucus : null,
  }));
}

export async function upsertSymptomLog(
  userId: string,
  date: string,
  symptoms?: string[],
  water?: number,
  weight?: number,
  lhLevel?: string | null,
  mucus?: string | null
): Promise<ISymptomLog> {
  const user = await User.findById(userId).lean();
  const targetId = (user?.role === 'partner' && user.partnerId) ? user.partnerId : userId;

  const updateFields: any = {};
  if (symptoms !== undefined) {
    updateFields.symptoms = symptoms;
  }
  if (water !== undefined) {
    // Round to prevent floating point issues in JS/MongoDB
    updateFields.water = water;
  }
  if (weight !== undefined) {
    // Keep 1 decimal place for weight
    updateFields.weight = Math.round(weight * 10) / 10;
  }
  if (lhLevel !== undefined) {
    updateFields.lhLevel = lhLevel;
  }
  if (mucus !== undefined) {
    updateFields.mucus = mucus;
  }

  const log = await SymptomLog.findOneAndUpdate(
    { userId: targetId, date },
    { $set: updateFields },
    { upsert: true, new: true, lean: true, runValidators: true, setDefaultsOnInsert: true }
  );

  // Recalculate cycle metrics
  await recalculateCycleMetrics(String(targetId));

  // findOneAndUpdate with upsert:true and new:true always returns a document
  const saved = log!;
  return {
    userId: String(saved.userId),
    date: saved.date,
    symptoms: saved.symptoms,
    water: saved.water !== undefined ? saved.water : 1000,
    weight: saved.weight !== undefined ? saved.weight : 62.5,
    lhLevel: saved.lhLevel !== undefined ? saved.lhLevel : null,
    mucus: saved.mucus !== undefined ? saved.mucus : null,
  };
}

export async function clearAllLogs(userId: string): Promise<void> {
  const user = await User.findById(userId).lean();
  const targetId = (user?.role === 'partner' && user.partnerId) ? user.partnerId : userId;
  await SymptomLog.deleteMany({ userId: targetId });

  // Reset dashboard cycle variation to defaults when clearing all logs
  await Dashboard.updateOne(
    { userId: targetId },
    { $set: { cycleVariationDays: 8, isAtypical: false } }
  );
}

export async function getCustomSymptoms(userId: string): Promise<ICustomSymptom[]> {
  const user = await User.findById(userId).lean();
  const targetId = (user?.role === 'partner' && user.partnerId) ? user.partnerId : userId;
  const items = await CustomSymptom.find({ userId: targetId }).lean();
  return items.map((c) => ({
    id: String(c._id),
    userId: String(c.userId),
    label: c.label,
    category: c.category,
  }));
}

export async function addCustomSymptom(
  userId: string,
  label: string,
  category: string
): Promise<ICustomSymptom> {
  const user = await User.findById(userId).lean();
  const targetId = (user?.role === 'partner' && user.partnerId) ? user.partnerId : userId;
  const item = await CustomSymptom.create({ userId: targetId, label, category });
  return {
    id: String(item._id),
    userId: String(item.userId),
    label: item.label,
    category: item.category,
  };
}

export async function removeCustomSymptom(
  userId: string,
  symptomId: string
): Promise<boolean> {
  const user = await User.findById(userId).lean();
  const targetId = (user?.role === 'partner' && user.partnerId) ? user.partnerId : userId;
  const result = await CustomSymptom.findOneAndDelete({ _id: symptomId, userId: targetId });
  return result !== null;
}

export async function getMonthInReview(userId: string): Promise<object> {
  const user = await User.findById(userId).lean();
  if (!user) throw new Error('User not found');
  
  // If caller is partner, analyze their lady partner's data
  const ladyId = (user.role === 'partner' && user.partnerId) ? String(user.partnerId) : userId;
  const partnerId = (user.role === 'lady' && user.partnerId) ? String(user.partnerId) : (user.role === 'partner' ? userId : null);

  if (user.role === 'partner' && user.partnerId) {
    const partnerSettings = await Settings.findOne({ userId: user.partnerId }).lean();
    if (partnerSettings && !partnerSettings.privacyShareHealthCharts) {
      return {
        cycleLength: partnerSettings.cycleAvgLengthDays || 28,
        periodLength: 5,
        energyPeakStart: 0,
        energyPeakEnd: 0,
        crampingChange: 0,
        partnerActions: 0,
        redacted: true
      };
    }
  }

  // Fetch Lady's dashboard & logs
  const [ladyDash, logs] = await Promise.all([
    Dashboard.findOne({ userId: ladyId }).lean(),
    SymptomLog.find({ userId: ladyId }).sort({ date: 1 }).lean(),
  ]);

  const typicalCycleDays = ladyDash?.typicalCycleDays || 28;

  // Identify periods and cycle durations from logs
  const flowLogs = logs.filter(l => l.symptoms.some(s => s.startsWith('flow-')));
  const periodStarts: Date[] = [];
  const periodDurations: Record<string, number> = {};
  
  let currentStartStr: string | null = null;
  let prevDate: Date | null = null;
  let currentDuration = 0;

  for (const log of flowLogs) {
    const d = new Date(log.date + 'T12:00:00');
    if (!currentStartStr || !prevDate) {
      currentStartStr = log.date;
      currentDuration = 1;
    } else {
      const diff = Math.round((d.getTime() - prevDate.getTime()) / (1000 * 3600 * 24));
      if (diff > 4) { // gap > 4 days starts a new period
        periodStarts.push(new Date(currentStartStr + 'T12:00:00'));
        periodDurations[currentStartStr] = currentDuration;
        currentStartStr = log.date;
        currentDuration = 1;
      } else {
        currentDuration++;
      }
    }
    prevDate = d;
  }
  if (currentStartStr) {
    periodStarts.push(new Date(currentStartStr + 'T12:00:00'));
    periodDurations[currentStartStr] = currentDuration;
  }

  // Calculate actual cycle lengths
  const cycleLengths: number[] = [];
  for (let i = 0; i < periodStarts.length - 1; i++) {
    const len = Math.round((periodStarts[i + 1].getTime() - periodStarts[i].getTime()) / (1000 * 3600 * 24));
    cycleLengths.push(len);
  }

  const lastCycleLength = cycleLengths.length > 0 ? cycleLengths[cycleLengths.length - 1] : typicalCycleDays;
  const lastPeriodStartStr = currentStartStr;
  const lastPeriodDuration = lastPeriodStartStr ? (periodDurations[lastPeriodStartStr] || 5) : 5;

  // Compute energy peak window
  let activeCycleStart = ladyDash?.lastPeriodStart ? new Date(ladyDash.lastPeriodStart + 'T12:00:00') : null;
  if (periodStarts.length > 0) {
    activeCycleStart = periodStarts[periodStarts.length - 1];
  }

  const dayScores: Record<number, number> = {};
  if (activeCycleStart) {
    const logsInCycle = logs.filter(log => {
      if (!activeCycleStart) return false;
      const logDate = new Date(log.date + 'T12:00:00');
      const diff = Math.round((logDate.getTime() - activeCycleStart.getTime()) / (1000 * 3600 * 24));
      return diff >= 0 && diff < typicalCycleDays;
    });

    logsInCycle.forEach(log => {
      if (!activeCycleStart) return;
      const logDate = new Date(log.date + 'T12:00:00');
      const day = Math.round((logDate.getTime() - activeCycleStart.getTime()) / (1000 * 3600 * 24)) + 1;
      
      let score = 3;
      if (log.symptoms.includes('mood-happy')) score += 2;
      if (log.symptoms.includes('mood-calm')) score += 1;
      if (log.symptoms.includes('phys-fatigue')) score -= 2;
      if (log.symptoms.includes('phys-cramps') || log.symptoms.includes('endo-pelvicpain') || log.symptoms.includes('endo-backache')) score -= 1;
      
      dayScores[day] = score;
    });
  }

  // Find 5-day window with highest average energy score
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

  if (!foundWindow && logs.length > 0) {
    bestStart = 10;
    bestEnd = 15;
  }

  // Compute cramping trend
  let currentCrampingDays = 0;
  let prevCrampingDays = 0;
  let crampingPctChange = 100;
  let calculatedCramps = false;

  if (periodStarts.length >= 1) {
    const curStart = periodStarts[periodStarts.length - 1];
    const prevStart = periodStarts.length >= 2 ? periodStarts[periodStarts.length - 2] : null;

    logs.forEach(log => {
      const logDate = new Date(log.date + 'T12:00:00');
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
        crampingPctChange = Math.round(((currentCrampingDays - prevCrampingDays) / prevCrampingDays) * 100);
      } else {
        crampingPctChange = currentCrampingDays > 0 ? 100 : 0;
      }
    } else {
      const prevMonthStart = new Date(curStart.getTime() - 30 * 24 * 3600 * 1000);
      logs.forEach(log => {
        const logDate = new Date(log.date + 'T12:00:00');
        const hasCramps = log.symptoms.some(s => s === 'phys-cramps' || s === 'endo-pelvicpain' || s === 'endo-backache');
        if (logDate >= prevMonthStart && logDate < curStart) {
          if (hasCramps) prevCrampingDays++;
        }
      });
      if (prevCrampingDays > 0) {
        calculatedCramps = true;
        crampingPctChange = Math.round(((currentCrampingDays - prevCrampingDays) / prevCrampingDays) * 100);
      }
    }
  }

  // Count partner support actions completed since active cycle start
  let partnerActions = 2;
  if (partnerId && activeCycleStart) {
    const startStr = activeCycleStart.toISOString().split('T')[0];
    const actualCount = await SupportAction.countDocuments({
      userId: partnerId,
      completedAt: { $gte: startStr }
    });
    partnerActions = actualCount;
  }

  return {
    cycleLength: lastCycleLength,
    periodLength: lastPeriodDuration,
    energyPeakStart: bestStart,
    energyPeakEnd: bestEnd,
    crampingChange: crampingPctChange,
    partnerActions
  };
}

export async function recalculateCycleMetrics(userId: string): Promise<void> {
  const user = await User.findById(userId).lean();
  if (!user) return;

  const targetId = (user.role === 'partner' && user.partnerId) ? String(user.partnerId) : userId;

  // 1. Fetch all symptom logs for target user, sorted by date ascending
  const logs = await SymptomLog.find({ userId: targetId }).sort({ date: 1 }).lean();

  // 2. Find period start dates
  const flowLogs = logs.filter(l => l.symptoms.some(s => s.startsWith('flow-')));
  const periodStarts: Date[] = [];
  const periodDurations: Record<string, number> = {};

  let currentStartStr: string | null = null;
  let prevDate: Date | null = null;
  let currentDuration = 0;

  for (const log of flowLogs) {
    const d = new Date(log.date + 'T12:00:00');
    if (!currentStartStr || !prevDate) {
      currentStartStr = log.date;
      currentDuration = 1;
    } else {
      const diff = Math.round((d.getTime() - prevDate.getTime()) / (1000 * 3600 * 24));
      if (diff > 4) { // gap > 4 days starts a new period
        periodStarts.push(new Date(currentStartStr + 'T12:00:00'));
        periodDurations[currentStartStr] = currentDuration;
        currentStartStr = log.date;
        currentDuration = 1;
      } else {
        currentDuration++;
      }
    }
    prevDate = d;
  }
  if (currentStartStr) {
    periodStarts.push(new Date(currentStartStr + 'T12:00:00'));
    periodDurations[currentStartStr] = currentDuration;
  }

  // Calculate actual cycle lengths
  const cycleLengths: number[] = [];
  for (let i = 0; i < periodStarts.length - 1; i++) {
    const len = Math.round((periodStarts[i + 1].getTime() - periodStarts[i].getTime()) / (1000 * 3600 * 24));
    if (len >= 15 && len <= 60) {
      cycleLengths.push(len);
    }
  }

  // Get current dashboard
  const dashboard = await Dashboard.findOne({ userId: targetId });
  if (!dashboard) return;

  const updates: any = {};

  // Auto-detect lastPeriodStart if there are any period starts logged
  const targetLastPeriodStart = currentStartStr || '';
  if (dashboard.lastPeriodStart !== targetLastPeriodStart) {
    updates.lastPeriodStart = targetLastPeriodStart;
  }

  // Auto-calculate typicalCycleDays and cycleVariationDays
  if (cycleLengths.length > 0) {
    const sum = cycleLengths.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / cycleLengths.length);
    const clampedAvg = Math.min(60, Math.max(15, avg));

    updates.typicalCycleDays = clampedAvg;

    if (cycleLengths.length >= 2) {
      const max = Math.max(...cycleLengths);
      const min = Math.min(...cycleLengths);
      updates.cycleVariationDays = max - min;
    } else {
      updates.cycleVariationDays = clampedAvg > 35 || clampedAvg < 24 ? 18 : 8;
    }
  }

  if (Object.keys(updates).length > 0) {
    const finalTypical = updates.typicalCycleDays ?? dashboard.typicalCycleDays;
    const finalVariation = updates.cycleVariationDays ?? dashboard.cycleVariationDays;
    updates.isAtypical = finalTypical < 24 || finalTypical > 35 || finalVariation > 14;

    await Dashboard.updateOne({ userId: targetId }, { $set: updates });

    if (updates.typicalCycleDays !== undefined) {
      await Settings.updateOne(
        { userId: targetId },
        { $set: { cycleAvgLengthDays: updates.typicalCycleDays } }
      );
    }
  }
}
