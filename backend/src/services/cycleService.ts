import { SymptomLog, CustomSymptom } from '../models/Symptom';
import { ISymptomLog, ICustomSymptom } from '../interfaces';
import { User } from '../models/User';

export async function getSymptomLogs(userId: string): Promise<ISymptomLog[]> {
  const user = await User.findById(userId).lean();
  const targetId = (user?.role === 'partner' && user.partnerId) ? user.partnerId : userId;
  const logs = await SymptomLog.find({ userId: targetId }).sort({ date: -1 }).lean();
  return logs.map((l) => ({
    userId: String(l.userId),
    date: l.date,
    symptoms: l.symptoms,
    water: l.water !== undefined ? l.water : 1000,
    weight: l.weight !== undefined ? l.weight : 62.5,
  }));
}

export async function upsertSymptomLog(
  userId: string,
  date: string,
  symptoms?: string[],
  water?: number,
  weight?: number
): Promise<ISymptomLog> {
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

  const log = await SymptomLog.findOneAndUpdate(
    { userId, date },
    { $set: updateFields },
    { upsert: true, new: true, lean: true, runValidators: true, setDefaultsOnInsert: true }
  );
  // findOneAndUpdate with upsert:true and new:true always returns a document
  const saved = log!;
  return {
    userId: String(saved.userId),
    date: saved.date,
    symptoms: saved.symptoms,
    water: saved.water !== undefined ? saved.water : 1000,
    weight: saved.weight !== undefined ? saved.weight : 62.5,
  };
}

export async function clearAllLogs(userId: string): Promise<void> {
  await SymptomLog.deleteMany({ userId });
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
