import { User } from '../models/User';
import { Settings } from '../models/Settings';
import { Dashboard } from '../models/Dashboard';
import { IUser, ISettings, IDashboard } from '../interfaces';

export async function getUserProfile(
  userId: string
): Promise<{ user: Partial<IUser>; settings: ISettings | null; dashboard: IDashboard | null }> {
  const user = await User.findById(userId).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const settings = await Settings.findOne({ userId }).lean();
  const dashboard = await Dashboard.findOne({ userId }).lean();

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
    },
    settings: settings
      ? {
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
          chatPersistLocal: settings.chatPersistLocal,
          chatEnterToSend: settings.chatEnterToSend,
          chatShowTimestamps: settings.chatShowTimestamps,
          cycleAvgLengthDays: settings.cycleAvgLengthDays,
          cycleShowFertileWindow: settings.cycleShowFertileWindow,
        }
      : null,
    dashboard: dashboard
      ? {
          userId: String(dashboard.userId),
          lastPeriodStart: dashboard.lastPeriodStart,
          typicalCycleDays: dashboard.typicalCycleDays,
          phaseLabel: dashboard.phaseLabel,
          hormoneTrend: dashboard.hormoneTrend,
          bodySignals: dashboard.bodySignals,
          guidanceLines: dashboard.guidanceLines,
          cycleNotes: dashboard.cycleNotes,
        }
      : null,
  };
}

export async function updateUserProfile(
  userId: string,
  updates: { name?: string; avatar?: string | null; accessLevel?: 'full' | 'educational'; isOnboarded?: boolean }
): Promise<Partial<IUser>> {
  const user = await User.findByIdAndUpdate(userId, updates, { new: true, lean: true });
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
  };
}

export async function updateUserSettings(
  userId: string,
  patch: Partial<ISettings>
): Promise<ISettings> {
  const settings = await Settings.findOneAndUpdate(
    { userId },
    { $set: patch },
    { new: true, lean: true }
  );
  if (!settings) {
    throw Object.assign(new Error('Settings not found'), { status: 404 });
  }
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
    chatPersistLocal: settings.chatPersistLocal,
    chatEnterToSend: settings.chatEnterToSend,
    chatShowTimestamps: settings.chatShowTimestamps,
    cycleAvgLengthDays: settings.cycleAvgLengthDays,
    cycleShowFertileWindow: settings.cycleShowFertileWindow,
  };
}

export async function updateDashboard(
  userId: string,
  patch: Partial<IDashboard>
): Promise<IDashboard> {
  const dashboard = await Dashboard.findOneAndUpdate(
    { userId },
    { $set: patch },
    { new: true, lean: true }
  );
  if (!dashboard) {
    throw Object.assign(new Error('Dashboard not found'), { status: 404 });
  }
  return {
    userId: String(dashboard.userId),
    lastPeriodStart: dashboard.lastPeriodStart,
    typicalCycleDays: dashboard.typicalCycleDays,
    phaseLabel: dashboard.phaseLabel,
    hormoneTrend: dashboard.hormoneTrend,
    bodySignals: dashboard.bodySignals,
    guidanceLines: dashboard.guidanceLines,
    cycleNotes: dashboard.cycleNotes,
  };
}
