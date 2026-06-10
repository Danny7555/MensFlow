import { Request, Response, NextFunction } from 'express';
import { WellnessTip } from '../models/WellnessTip';

export async function getTips(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tips = await WellnessTip.find().sort({ createdAt: -1 });
    res.json(tips);
  } catch (err) {
    next(err);
  }
}
