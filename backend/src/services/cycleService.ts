import { SymptomLog, CustomSymptom } from '../models/Symptom';
import { ISymptomLog, ICustomSymptom } from '../interfaces';

export async function getSymptomLogs(userId: string): Promise<ISymptomLog[]> {
  const logs = await SymptomLog.find({ userId }).sort({ date: -1 }).lean();
  return logs.map((l) => ({
    userId: String(l.userId),
    date: l.date,
    symptoms: l.symptoms,
  }));
}

export async function upsertSymptomLog(
  userId: string,
  date: string,
  symptoms: string[]
): Promise<ISymptomLog> {
  const log = await SymptomLog.findOneAndUpdate(
    { userId, date },
    { symptoms },
    { upsert: true, new: true, lean: true }
  );
  // findOneAndUpdate with upsert:true and new:true always returns a document
  const saved = log!;
  return {
    userId: String(saved.userId),
    date: saved.date,
    symptoms: saved.symptoms,
  };
}

export async function clearAllLogs(userId: string): Promise<void> {
  await SymptomLog.deleteMany({ userId });
}

export async function getCustomSymptoms(userId: string): Promise<ICustomSymptom[]> {
  const items = await CustomSymptom.find({ userId }).lean();
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
  const item = await CustomSymptom.create({ userId, label, category });
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
  const result = await CustomSymptom.findOneAndDelete({ _id: symptomId, userId });
  return result !== null;
}
