import { Response, NextFunction } from 'express';
import { AuthRequest } from '../interfaces';
import * as cycleService from '../services/cycleService';
import { assertObjectId, isoDate, objectRecord, requiredString, stringArray } from '../utils/validation';

export async function getLogs(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const logs = await cycleService.getSymptomLogs(req.user!.id);
    res.json(logs);
  } catch (err) {
    next(err);
  }
}

export async function addLog(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = objectRecord(req.body);
    const date = isoDate(body.date);
    const symptoms = stringArray(body.symptoms, 'symptoms', { maxItems: 40, maxItemLength: 80 });

    const log = await cycleService.upsertSymptomLog(req.user!.id, date, symptoms);
    res.json(log);
  } catch (err) {
    next(err);
  }
}

export async function clearLogs(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await cycleService.clearAllLogs(req.user!.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function getCustomSymptoms(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const items = await cycleService.getCustomSymptoms(req.user!.id);
    res.json(items);
  } catch (err) {
    next(err);
  }
}

export async function addCustomSymptom(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = objectRecord(req.body);
    const label = requiredString(body.label, 'label', { max: 80 });
    const category = requiredString(body.category, 'category', { max: 80 });

    const item = await cycleService.addCustomSymptom(req.user!.id, label, category);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

export async function removeCustomSymptom(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    assertObjectId(req.params.id, 'id');
    const removed = await cycleService.removeCustomSymptom(req.user!.id, req.params.id);

    if (!removed) {
      res.status(404).json({ error: 'Custom symptom not found' });
      return;
    }

    res.json({ success: true, id: req.params.id });
  } catch (err) {
    next(err);
  }
}
