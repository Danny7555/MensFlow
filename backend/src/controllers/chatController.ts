import { Response, NextFunction } from 'express';
import { AuthRequest } from '../interfaces';
import * as chatService from '../services/chatService';

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
    const { sessionId } = req.params;
    const passcode = req.query.passcode as string | undefined;

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
    const { sessionId, text, passcode } = req.body;

    if (!sessionId || !text) {
      res.status(400).json({ error: 'sessionId and text are required' });
      return;
    }

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
    const { sessionId } = req.params;
    const { passcode, securityQuestion, securityAnswer } = req.body;

    if (!passcode || !securityQuestion || !securityAnswer) {
      res.status(400).json({ error: 'passcode, securityQuestion, and securityAnswer are required' });
      return;
    }

    await chatService.lockSession(req.user!.id, sessionId, passcode, securityQuestion, securityAnswer);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function unlockSession(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { sessionId } = req.params;
    const { passcode, securityAnswer } = req.body;

    const result = await chatService.unlockSession(req.user!.id, sessionId, passcode, securityAnswer);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}
