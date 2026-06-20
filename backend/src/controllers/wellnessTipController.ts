import { Request, Response, NextFunction } from 'express';
import { WellnessTip } from '../models/WellnessTip';
import { cacheGet, cacheSet } from '../utils/cache';

export async function getTips(req: Request, res: Response, next: NextFunction): Promise<void> {
  const CACHE_KEY = 'wellness:tips';
  const cached = cacheGet<unknown>(CACHE_KEY);
  if (cached) { res.json(cached); return; }

  try {
    const tips = await WellnessTip.find().sort({ createdAt: -1 }).lean();
    cacheSet(CACHE_KEY, tips, 5 * 60 * 1000);
    res.json(tips);
  } catch (err) {
    next(err);
  }
}
