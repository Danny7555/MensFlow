import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../interfaces';
import * as chatService from '../services/chatService';
import { objectRecord, optionalString, requiredString } from '../utils/validation';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/env';
import { type HttpError } from '../utils/http';

function isLockedError(err: unknown): err is HttpError & { locked: true } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'locked' in err &&
    (err as HttpError).locked === true
  );
}

export async function getSessions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const sessions = await chatService.getSessions(req.user!.id);
    res.json(sessions);
  } catch (err) {
    next(err);
  }
}

export async function getMessages(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const sessionId = requiredString(req.params.sessionId, 'sessionId', { max: 120 });
    const passcode = typeof req.query.passcode === 'string'
      ? requiredString(req.query.passcode, 'passcode', { max: 80 })
      : undefined;

    const messages = await chatService.getMessages(req.user!.id, sessionId, passcode);
    res.json(messages);
  } catch (err) {
    if (isLockedError(err)) {
      res.status(err.status ?? 403).json({
        locked: true,
        securityQuestion: err.securityQuestion,
        error: err.message,
      });
      return;
    }
    next(err);
  }
}

export async function sendMessage(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = objectRecord(req.body);
    const sessionId = requiredString(body.sessionId, 'sessionId', { max: 120 });
    const text = requiredString(body.text, 'text', { max: 4_000 });
    const passcode = optionalString(body, 'passcode', { max: 80 });

    const result = await chatService.sendMessage(req.user!.id, sessionId, text, passcode);
    res.json(result);
  } catch (err) {
    if (isLockedError(err)) {
      res.status(err.status ?? 403).json({
        locked: true,
        securityQuestion: err.securityQuestion,
        error: err.message,
      });
      return;
    }
    next(err);
  }
}

export async function lockSession(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const sessionId = requiredString(req.params.sessionId, 'sessionId', { max: 120 });
    const body = objectRecord(req.body);
    const passcode = optionalString(body, 'passcode', { min: 4, max: 80 });
    const securityQuestion = optionalString(body, 'securityQuestion', { max: 200 });
    const securityAnswer = optionalString(body, 'securityAnswer', { max: 200 });

    await chatService.lockSession(req.user!.id, sessionId, passcode, securityQuestion, securityAnswer);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function unlockSession(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const sessionId = requiredString(req.params.sessionId, 'sessionId', { max: 120 });
    const body = objectRecord(req.body);
    const passcode = optionalString(body, 'passcode', { max: 80 });
    const securityAnswer = optionalString(body, 'securityAnswer', { max: 200 });

    const result = await chatService.unlockSession(req.user!.id, sessionId, passcode, securityAnswer);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function unlockSessionPermanent(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const sessionId = requiredString(req.params.sessionId, 'sessionId', { max: 120 });
    const body = objectRecord(req.body);
    const passcode = optionalString(body, 'passcode', { max: 80 });

    await chatService.unlockSessionPermanent(req.user!.id, sessionId, passcode);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function deleteSession(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const sessionId = requiredString(req.params.sessionId, 'sessionId', { max: 120 });
    await chatService.deleteSession(req.user!.id, sessionId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function sendGuestMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = objectRecord(req.body);
    const text = requiredString(body.text, 'text', { max: 4_000 });
    const historyVal = 'history' in body ? (Array.isArray(body.history) ? body.history : []) : [];
    
    const history = historyVal.map((item: any) => {
      const rec = objectRecord(item);
      return {
        role: requiredString(rec.role, 'role', { max: 20 }) as 'user' | 'assistant',
        text: requiredString(rec.text, 'text', { max: 4_000 }),
      };
    });

    const result = await chatService.sendGuestMessage(text, history);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getSuggestions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let userId: string | undefined;
    const authHeader = req.header('Authorization');
    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        try {
          const secret = getJwtSecret();
          const decoded = jwt.verify(parts[1], secret) as { id: string };
          userId = decoded.id;
        } catch {
          // Token is invalid/expired, run in guest mode
        }
      }
    }

    const suggestions = await chatService.getSuggestions(userId);
    res.json(suggestions);
  } catch (err) {
    next(err);
  }
}

export async function getDailyGuidance(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const guidance = await chatService.getDailyGuidance(req.user!.id);
    res.json(guidance);
  } catch (err) {
    next(err);
  }
}
