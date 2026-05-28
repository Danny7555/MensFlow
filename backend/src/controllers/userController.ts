import { Response, NextFunction } from 'express';
import { AuthRequest } from '../interfaces';
import * as userService from '../services/userService';

export async function getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await userService.getUserProfile(req.user!.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, avatar, accessLevel, isOnboarded, role } = req.body;
    const user = await userService.updateUserProfile(req.user!.id, { name, avatar, accessLevel, isOnboarded, role });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function updateSettings(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const settings = await userService.updateUserSettings(req.user!.id, req.body);
    res.json(settings);
  } catch (err) {
    next(err);
  }
}

export async function updateDashboard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const dashboard = await userService.updateDashboard(req.user!.id, req.body);
    res.json(dashboard);
  } catch (err) {
    next(err);
  }
}
