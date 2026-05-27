import { Response, NextFunction } from 'express';
import { AuthRequest } from '../interfaces';
import * as partnerService from '../services/partnerService';

export async function pairPartner(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { partnerCode } = req.body;

    if (!partnerCode) {
      res.status(400).json({ error: 'partnerCode is required' });
      return;
    }

    const partner = await partnerService.pairWithPartner(req.user!.id, partnerCode);
    res.json({ success: true, partner });
  } catch (err) {
    next(err);
  }
}

export async function getPartnerStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const status = await partnerService.getPartnerStatus(req.user!.id);
    res.json(status);
  } catch (err) {
    next(err);
  }
}

export async function disconnectPartner(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await partnerService.disconnectPartner(req.user!.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function sendPing(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { pingId, label, message } = req.body;

    if (!pingId || !label || !message) {
      res.status(400).json({ error: 'pingId, label, and message are required' });
      return;
    }

    const ping = await partnerService.sendPing(req.user!.id, pingId, label, message);
    res.json({ success: true, ping });
  } catch (err) {
    next(err);
  }
}

export async function getLatestPing(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const ping = await partnerService.getLatestPing(req.user!.id);
    res.json(ping);
  } catch (err) {
    next(err);
  }
}

export async function toggleAction(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { actionId } = req.body;

    if (!actionId) {
      res.status(400).json({ error: 'actionId is required' });
      return;
    }

    const result = await partnerService.toggleSupportAction(req.user!.id, actionId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
