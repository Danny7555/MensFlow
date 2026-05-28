import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';
import { objectRecord, requiredString } from '../utils/validation';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = objectRecord(req.body);
    const username = requiredString(body.username, 'username', { max: 120 }).toLowerCase();
    const password = requiredString(body.password, 'password', { min: 8, max: 128 });
    const name = requiredString(body.name, 'name', { max: 80 });

    const result = await authService.registerUser(username, password, name);
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
    res.json(result);
  } catch (err) {
    next(err);
  }
}
