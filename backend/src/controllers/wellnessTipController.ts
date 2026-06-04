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

export async function createTip(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { category, title, summary, phaseTag } = req.body;
    if (!category || !title || !summary || !phaseTag) {
      throw Object.assign(new Error('Missing required fields: category, title, summary, phaseTag are required.'), { status: 400 });
    }

    const tip = new WellnessTip({
      category,
      title,
      summary,
      phaseTag,
    });

    await tip.save();
    res.status(201).json(tip);
  } catch (err) {
    next(err);
  }
}

export async function updateTip(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { category, title, summary, phaseTag } = req.body;

    const tip = await WellnessTip.findById(id);
    if (!tip) {
      throw Object.assign(new Error('Wellness tip not found'), { status: 404 });
    }

    if (category !== undefined) tip.category = category;
    if (title !== undefined) tip.title = title;
    if (summary !== undefined) tip.summary = summary;
    if (phaseTag !== undefined) tip.phaseTag = phaseTag;

    await tip.save();
    res.json(tip);
  } catch (err) {
    next(err);
  }
}

export async function deleteTip(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const tip = await WellnessTip.findById(id);
    if (!tip) {
      throw Object.assign(new Error('Wellness tip not found'), { status: 404 });
    }

    await tip.deleteOne();
    res.json({ success: true, message: 'Wellness tip deleted successfully' });
  } catch (err) {
    next(err);
  }
}
