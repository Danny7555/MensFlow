import { Response, NextFunction } from 'express';
import { AuthRequest, IDashboard, ISettings } from '../interfaces';
import * as userService from '../services/userService';
import {
  compact,
  objectRecord,
  optionalBoolean,
  optionalIsoDate,
  optionalNumber,
  optionalOneOf,
  optionalString,
  stringArray,
} from '../utils/validation';

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
    const body = objectRecord(req.body);
    const user = await userService.updateUserProfile(req.user!.id, compact({
      name: optionalString(body, 'name', { max: 80 }),
      avatar: optionalString(body, 'avatar', { max: 500, nullable: true }),
      accessLevel: optionalOneOf(body, 'accessLevel', ['full', 'educational'] as const),
      isOnboarded: optionalBoolean(body, 'isOnboarded'),
      role: optionalOneOf(body, 'role', ['lady', 'partner'] as const),
    }));
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function updateSettings(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = objectRecord(req.body);
    const patch: Partial<ISettings> = compact({
      themeMode: optionalOneOf(body, 'themeMode', ['light', 'dark', 'system'] as const),
      contrastMode: optionalOneOf(body, 'contrastMode', ['system', 'standard'] as const),
      accentPreset: optionalOneOf(body, 'accentPreset', ['default', 'orchid', 'ocean'] as const),
      languageUi: optionalOneOf(body, 'languageUi', ['auto', 'en'] as const),
      spokenLanguage: optionalOneOf(body, 'spokenLanguage', ['auto', 'en-US'] as const),
      enableDictation: optionalBoolean(body, 'enableDictation'),
      sidebarCollapsed: optionalBoolean(body, 'sidebarCollapsed'),
      notificationsEmail: optionalBoolean(body, 'notificationsEmail'),
      notificationsPush: optionalBoolean(body, 'notificationsPush'),
      notificationsCycleReminders: optionalBoolean(body, 'notificationsCycleReminders'),
      notificationsProduct: optionalBoolean(body, 'notificationsProduct'),
      privacyShareAnalytics: optionalBoolean(body, 'privacyShareAnalytics'),
      privacyDefaultTemporaryChat: optionalBoolean(body, 'privacyDefaultTemporaryChat'),
      privacyLockChats: optionalBoolean(body, 'privacyLockChats'),
      privacyLockChatsPassword: optionalString(body, 'privacyLockChatsPassword', { nullable: true }),
      privacyLockChatsSecurityQuestion: optionalString(body, 'privacyLockChatsSecurityQuestion', { nullable: true }),
      privacyLockChatsSecurityAnswer: optionalString(body, 'privacyLockChatsSecurityAnswer', { nullable: true }),
      chatPersistLocal: optionalBoolean(body, 'chatPersistLocal'),
      chatEnterToSend: optionalBoolean(body, 'chatEnterToSend'),
      chatShowTimestamps: optionalBoolean(body, 'chatShowTimestamps'),
      cycleAvgLengthDays: optionalNumber(body, 'cycleAvgLengthDays', { min: 15, max: 60, integer: true }),
      cycleShowFertileWindow: optionalBoolean(body, 'cycleShowFertileWindow'),
    });

    const settings = await userService.updateUserSettings(req.user!.id, patch);
    res.json(settings);
  } catch (err) {
    next(err);
  }
}

export async function updateDashboard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = objectRecord(req.body);
    const patch: Partial<IDashboard> = compact({
      lastPeriodStart: optionalIsoDate(body, 'lastPeriodStart'),
      typicalCycleDays: optionalNumber(body, 'typicalCycleDays', { min: 15, max: 60, integer: true }),
      phaseLabel: optionalString(body, 'phaseLabel', { max: 80 }),
      hormoneTrend: optionalString(body, 'hormoneTrend', { max: 160 }),
      bodySignals: optionalString(body, 'bodySignals', { max: 500 }),
      guidanceLines: 'guidanceLines' in body ? stringArray(body.guidanceLines, 'guidanceLines', { maxItems: 12, maxItemLength: 160 }) : undefined,
      cycleNotes: optionalString(body, 'cycleNotes', { max: 2_000, allowEmpty: true }),
      cycleVariationDays: optionalNumber(body, 'cycleVariationDays', { min: 0, max: 120, integer: true }),
      isAtypical: optionalBoolean(body, 'isAtypical'),
    });

    const dashboard = await userService.updateDashboard(req.user!.id, patch);
    res.json(dashboard);
  } catch (err) {
    next(err);
  }
}
