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
      onboardingData: 'onboardingData' in body ? (body.onboardingData as Record<string, unknown> | undefined) : undefined,
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
      contrastMode: optionalOneOf(body, 'contrastMode', ['system', 'standard', 'high'] as const),
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
      cyclePeriodLengthDays: optionalNumber(body, 'cyclePeriodLengthDays', { min: 1, max: 14, integer: true }),
      cycleShowFertileWindow: optionalBoolean(body, 'cycleShowFertileWindow'),
      privacyShareCycleDetails: optionalBoolean(body, 'privacyShareCycleDetails'),
      privacyShareSymptomLogs: optionalBoolean(body, 'privacyShareSymptomLogs'),
      privacyShareHealthCharts: optionalBoolean(body, 'privacyShareHealthCharts'),
      privacyPendingAccessRequest: optionalBoolean(body, 'privacyPendingAccessRequest'),
      privacyRequestedFields: Array.isArray(body.privacyRequestedFields)
        ? (body.privacyRequestedFields as string[]).filter((f) => typeof f === 'string')
        : undefined,
      privacyStrictLocalOnly: optionalBoolean(body, 'privacyStrictLocalOnly'),
      conditionOptimization: optionalOneOf(body, 'conditionOptimization', ['none', 'pcos', 'endometriosis', 'perimenopause'] as const),
      trackingMode: optionalOneOf(body, 'trackingMode', ['period', 'conception', 'pregnancy', 'perimenopause'] as const),
      disableAIPopups: optionalBoolean(body, 'disableAIPopups'),
      hideDailyStoriesAndTips: optionalBoolean(body, 'hideDailyStoriesAndTips'),
      parentalControlsEnabled: optionalBoolean(body, 'parentalControlsEnabled'),
      parentalGuardianEmail: optionalString(body, 'parentalGuardianEmail', { max: 254, nullable: true, allowEmpty: true }),
      parentalContentFilter: optionalOneOf(body, 'parentalContentFilter', ['standard', 'restricted'] as const),
      parentalQuietHoursEnabled: optionalBoolean(body, 'parentalQuietHoursEnabled'),
      parentalQuietHoursStart: optionalString(body, 'parentalQuietHoursStart', { max: 5 }),
      parentalQuietHoursEnd: optionalString(body, 'parentalQuietHoursEnd', { max: 5 }),
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

export async function addUserXp(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = objectRecord(req.body);
    const date = optionalIsoDate(body, 'date');
    if (date === undefined) {
      throw Object.assign(new Error('date is required'), { status: 400 });
    }
    const correct = optionalBoolean(body, 'correct');
    if (correct === undefined) {
      throw Object.assign(new Error('correct is required'), { status: 400 });
    }

    const user = await userService.submitQuizAttempt(req.user!.id, date, correct);
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

export async function getLoginHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const history = await userService.getUserLoginHistory(req.user!.id);
    res.json(history);
  } catch (err) {
    next(err);
  }
}
