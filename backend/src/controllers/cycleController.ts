import { Response, NextFunction } from 'express';
import { AuthRequest } from '../interfaces';
import * as cycleService from '../services/cycleService';

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
    const { date, symptoms } = req.body;

    if (!date || !Array.isArray(symptoms)) {
      res.status(400).json({ error: 'date (string) and symptoms (array) are required' });
      return;
    }

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
    const { label, category } = req.body;

    if (!label || !category) {
      res.status(400).json({ error: 'label and category are required' });
      return;
    }

    const item = await cycleService.addCustomSymptom(req.user!.id, label, category);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

export async function removeCustomSymptom(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
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
