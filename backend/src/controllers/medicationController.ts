import { Response, NextFunction } from 'express';
import { AuthRequest } from '../interfaces';
import { Medication } from '../models/Medication';
import { objectRecord, requiredString, optionalString } from '../utils/validation';

export async function listMedications(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const meds = await Medication.find({ userId: req.user!.id }).sort({ createdAt: -1 }).lean();
    res.json(meds);
  } catch (err) {
    next(err);
  }
}

export async function createMedication(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = objectRecord(req.body);
    const name = requiredString(body.name, 'name', { min: 1, max: 100 });
    const dosage = optionalString(body, 'dosage', { max: 50 }) || '';
    const frequency = ['daily', 'weekly', 'as-needed'].includes(body.frequency as string) ? body.frequency as string : 'daily';
    const timeOfDay = optionalString(body, 'timeOfDay', { max: 5 }) || '08:00';
    const notes = optionalString(body, 'notes', { max: 500 }) || '';

    const med = await Medication.create({ userId: req.user!.id, name, dosage, frequency, timeOfDay, notes });
    res.status(201).json(med.toObject());
  } catch (err) {
    next(err);
  }
}

export async function updateMedication(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const medId = requiredString(req.params.medId, 'medId');
    const body = objectRecord(req.body);

    const update: Record<string, unknown> = {};
    if (body.name !== undefined) update.name = requiredString(body.name, 'name', { min: 1, max: 100 });
    if (body.dosage !== undefined) update.dosage = optionalString(body, 'dosage', { max: 50 }) || '';
    if (body.frequency !== undefined) update.frequency = body.frequency;
    if (body.timeOfDay !== undefined) update.timeOfDay = optionalString(body, 'timeOfDay', { max: 5 }) || '08:00';
    if (body.notes !== undefined) update.notes = optionalString(body, 'notes', { max: 500 }) || '';
    if (body.active !== undefined) update.active = body.active === true;
    update.updatedAt = new Date();

    const med = await Medication.findOneAndUpdate(
      { _id: medId, userId: req.user!.id },
      { $set: update },
      { new: true, lean: true }
    );
    if (!med) {
      res.status(404).json({ error: 'Medication not found' });
      return;
    }
    res.json(med);
  } catch (err) {
    next(err);
  }
}

export async function deleteMedication(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const medId = requiredString(req.params.medId, 'medId');
    const med = await Medication.findOneAndDelete({ _id: medId, userId: req.user!.id });
    if (!med) {
      res.status(404).json({ error: 'Medication not found' });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
