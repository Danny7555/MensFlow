import { Response, NextFunction } from 'express';
import { AuthRequest } from '../interfaces';
import * as chatService from '../services/chatService';
import { objectRecord, optionalString, requiredString } from '../utils/validation';

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
    const passcode = typeof req.query.passcode === 'string' ? requiredString(req.query.passcode, 'passcode', { max: 80 }) : undefined;

    const messages = await chatService.getMessages(req.user!.id, sessionId, passcode);
    res.json(messages);
  } catch (err: any) {
    if (err.locked) {
      res.status(err.status).json({
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
  } catch (err: any) {
    if (err.locked) {
      res.status(err.status).json({
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
    const passcode = requiredString(body.passcode, 'passcode', { min: 4, max: 80 });
    const securityQuestion = requiredString(body.securityQuestion, 'securityQuestion', { max: 200 });
    const securityAnswer = requiredString(body.securityAnswer, 'securityAnswer', { max: 200 });

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

export async function deleteSession(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const sessionId = requiredString(req.params.sessionId, 'sessionId', { max: 120 });
    await chatService.deleteSession(req.user!.id, sessionId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
