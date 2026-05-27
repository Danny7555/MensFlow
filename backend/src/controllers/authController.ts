import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { username, password, name } = req.body;

    if (!username || !password || !name) {
      res.status(400).json({ error: 'username, password, and name are required' });
      return;
    }

    const result = await authService.registerUser(username, password, name);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'username and password are required' });
      return;
    }

    const result = await authService.loginUser(username, password);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
