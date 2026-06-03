import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';
import { verifyOtpCode, createOtpSession } from '../services/otpService';
import { User } from '../models/User';
import { LoginHistory } from '../models/LoginHistory';
import { objectRecord, requiredString } from '../utils/validation';

function signFullToken(userId: string, username: string): string {
  const jwt = require('jsonwebtoken');
  const { getJwtSecret } = require('../config/env');
  const secret = getJwtSecret();
  const expiresIn = process.env.JWT_EXPIRES_IN || '30d';
  return jwt.sign({ id: userId, username }, secret, { expiresIn });
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = objectRecord(req.body);
    const username = requiredString(body.username, 'username', { max: 120 }).toLowerCase();
    const email = requiredString(body.email, 'email', { max: 254 }).toLowerCase();
    const password = requiredString(body.password, 'password', { min: 8, max: 128 });
    const name = requiredString(body.name, 'name', { max: 80 });
    const role = body.role === 'partner' ? 'partner' : 'lady';

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Please enter a valid email address' });
      return;
    }

    const result = await authService.registerUser(username, email, password, name, role);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = objectRecord(req.body);
    const username = requiredString(body.username, 'username', { max: 120 }).toLowerCase();
    const password = requiredString(body.password, 'password', { max: 128 });

    const result = await authService.loginUser(username, password);
    if (result.token && result.user.id) {
      await LoginHistory.create({
        userId: result.user.id,
        ip: req.ip || String(req.headers['x-forwarded-for'] || 'Unknown'),
        userAgent: req.headers['user-agent'] || 'Unknown',
      });
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = objectRecord(req.body);
    const otpToken = requiredString(body.otpToken, 'otpToken');
    const code = requiredString(body.code, 'code', { min: 6, max: 6 });

    const user = await verifyOtpCode(otpToken, code);
    const token = signFullToken(String(user._id), user.username);

    await LoginHistory.create({
      userId: user._id,
      ip: req.ip || String(req.headers['x-forwarded-for'] || 'Unknown'),
      userAgent: req.headers['user-agent'] || 'Unknown',
    });

    res.json({
      token,
      user: {
        id: String(user._id),
        username: user.username,
        name: user.name,
        avatar: user.avatar,
        accessLevel: user.accessLevel,
        isOnboarded: user.isOnboarded,
        partnerCode: user.partnerCode,
        partnerId: user.partnerId ? String(user.partnerId) : null,
        role: user.role,
        xp: user.xp || 0,
        quizLastCompletedAt: user.quizLastCompletedAt || '',
        quizCountToday: user.quizCountToday || 0,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function resendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = objectRecord(req.body);
    const otpToken = requiredString(body.otpToken, 'otpToken');

    // Decode the temp token to find the user (without strict expiry check for resend)
    const jwt = require('jsonwebtoken');
    const { getJwtSecret } = require('../config/env');
    let userId: string;
    try {
      const payload = jwt.verify(otpToken, getJwtSecret()) as { id: string };
      userId = payload.id;
    } catch {
      res.status(401).json({ error: 'Session expired. Please sign in again.' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const newOtpToken = await createOtpSession(userId);
    res.json({ otpToken: newOtpToken, message: 'A new verification code has been sent.' });
  } catch (err) {
    next(err);
  }
}
