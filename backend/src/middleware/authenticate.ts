import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JwtPayload } from '../interfaces';
import { getJwtSecret } from '../config/env';

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    res.status(401).json({ error: 'No token — authorization denied' });
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({ error: 'Token format must be: Bearer <token>' });
    return;
  }

  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(parts[1], secret) as JwtPayload;
    if (!decoded.id || !decoded.username) {
      res.status(401).json({ error: 'Token payload is invalid' });
      return;
    }
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Token is invalid or expired' });
  }
}
