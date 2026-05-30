import { User } from '../models/User';
import { Settings, SettingsDocument } from '../models/Settings';
import { Dashboard, DashboardDocument } from '../models/Dashboard';
import { IUser, ISettings, IDashboard } from '../interfaces';

export async function getUserProfile(
  userId: string
): Promise<{ user: Partial<IUser>; settings: ISettings; dashboard: IDashboard }> {
  const user = await User.findById(userId).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const settings = await Settings.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  const dashboard = await Dashboard.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId, lastPeriodStart: defaultLastPeriodStart() } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  if (!settings || !dashboard) {
    throw Object.assign(new Error('Unable to prepare profile data'), { status: 500 });
  }

  return {
    user: {
      id: String(user._id),
      username: user.username,
      name: user.name,
      avatar: user.avatar,
      accessLevel: user.accessLevel,
      isOnboarded: !!user.isOnboarded,
      partnerCode: user.partnerCode,
      partnerId: user.partnerId ? String(user.partnerId) : null,
      role: user.role,
    },
    settings: toSettings(settings),
    dashboard: toDashboard(dashboard),
  };
}

export async function updateUserProfile(
  userId: string,
  updates: { name?: string; avatar?: string | null; accessLevel?: 'full' | 'educational'; isOnboarded?: boolean; role?: 'lady' | 'partner' }
): Promise<Partial<IUser>> {
  const user = await User.findByIdAndUpdate(userId, updates, {
    new: true,
    lean: true,
    runValidators: true,
  });
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  return {
    id: String(user._id),
    username: user.username,
    name: user.name,
    avatar: user.avatar,
    accessLevel: user.accessLevel,
    isOnboarded: !!user.isOnboarded,
    partnerCode: user.partnerCode,
    partnerId: user.partnerId ? String(user.partnerId) : null,
    role: user.role,
  };
}

export async function updateUserSettings(
  userId: string,
  patch: Partial<ISettings>
): Promise<ISettings> {
  const settings = await Settings.findOneAndUpdate(
    { userId },
    { $set: patch, $setOnInsert: { userId } },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );
  if (!settings) {
    throw Object.assign(new Error('Unable to update settings'), { status: 500 });
  }
  return toSettings(settings);
}

export async function updateDashboard(
  userId: string,
  patch: Partial<IDashboard>
): Promise<IDashboard> {
  const dashboard = await Dashboard.findOneAndUpdate(
    { userId },
    { $set: patch, $setOnInsert: { userId, lastPeriodStart: defaultLastPeriodStart() } },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );
  if (!dashboard) {
    throw Object.assign(new Error('Unable to update dashboard'), { status: 500 });
  }
  return toDashboard(dashboard);
}

function toSettings(settings: SettingsDocument): ISettings {
  return {
    userId: String(settings.userId),
    themeMode: settings.themeMode,
    contrastMode: settings.contrastMode,
    accentPreset: settings.accentPreset,
    languageUi: settings.languageUi,
    spokenLanguage: settings.spokenLanguage,
    enableDictation: settings.enableDictation,
    sidebarCollapsed: settings.sidebarCollapsed,
    notificationsEmail: settings.notificationsEmail,
    notificationsPush: settings.notificationsPush,
    notificationsCycleReminders: settings.notificationsCycleReminders,
    notificationsProduct: settings.notificationsProduct,
    privacyShareAnalytics: settings.privacyShareAnalytics,
    privacyDefaultTemporaryChat: settings.privacyDefaultTemporaryChat,
    privacyLockChats: settings.privacyLockChats,
    privacyLockChatsPassword: settings.privacyLockChatsPassword,
    privacyLockChatsSecurityQuestion: settings.privacyLockChatsSecurityQuestion,
    privacyLockChatsSecurityAnswer: settings.privacyLockChatsSecurityAnswer,
    chatPersistLocal: settings.chatPersistLocal,
    chatEnterToSend: settings.chatEnterToSend,
    chatShowTimestamps: settings.chatShowTimestamps,
    cycleAvgLengthDays: settings.cycleAvgLengthDays,
    cycleShowFertileWindow: settings.cycleShowFertileWindow,
    privacyShareCycleDetails: settings.privacyShareCycleDetails,
    privacyPendingAccessRequest: settings.privacyPendingAccessRequest,
    privacyStrictLocalOnly: settings.privacyStrictLocalOnly,
    conditionOptimization: settings.conditionOptimization,
    disableAIPopups: settings.disableAIPopups,
    hideDailyStoriesAndTips: settings.hideDailyStoriesAndTips,
  };
}

function toDashboard(dashboard: DashboardDocument): IDashboard {
  return {
    userId: String(dashboard.userId),
    lastPeriodStart: dashboard.lastPeriodStart,
    typicalCycleDays: dashboard.typicalCycleDays,
    phaseLabel: dashboard.phaseLabel,
    hormoneTrend: dashboard.hormoneTrend,
    bodySignals: dashboard.bodySignals,
    guidanceLines: dashboard.guidanceLines,
    cycleNotes: dashboard.cycleNotes,
    cycleVariationDays: dashboard.cycleVariationDays,
    isAtypical: dashboard.isAtypical,
    scientificInsight: dashboard.scientificInsight ?? '',
    dailyTip: dashboard.dailyTip ?? { title: '', desc: '' },
  };
}

function defaultLastPeriodStart(): string {
  return new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
