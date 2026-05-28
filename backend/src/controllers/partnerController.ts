import { Response, NextFunction } from 'express';
import { AuthRequest } from '../interfaces';
import * as partnerService from '../services/partnerService';
import { objectRecord, requiredString } from '../utils/validation';

export async function pairPartner(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = objectRecord(req.body);
    const partnerCode = requiredString(body.partnerCode, 'partnerCode', { min: 6, max: 12 }).toUpperCase();

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
    const body = objectRecord(req.body);
    const pingId = requiredString(body.pingId, 'pingId', { max: 80 });
    const label = requiredString(body.label, 'label', { max: 80 });
    const message = requiredString(body.message, 'message', { max: 500 });

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
    const body = objectRecord(req.body);
    const actionId = requiredString(body.actionId, 'actionId', { max: 120 });

    const result = await partnerService.toggleSupportAction(req.user!.id, actionId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
