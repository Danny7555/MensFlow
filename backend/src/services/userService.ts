import { User } from '../models/User';
import { Settings, SettingsDocument } from '../models/Settings';
import { Dashboard, DashboardDocument } from '../models/Dashboard';
import { PartnerPing } from '../models/Partner';
import { IUser, ISettings, IDashboard } from '../interfaces';
import { sendReminderEmail } from './emailService';

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
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      accessLevel: user.accessLevel,
      isOnboarded: !!user.isOnboarded,
      partnerCode: user.partnerCode,
      partnerId: user.partnerId ? String(user.partnerId) : null,
      role: user.role,
      xp: user.xp || 0,
      quizLastCompletedAt: user.quizLastCompletedAt || '',
      quizCountToday: user.quizCountToday || 0,
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
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    accessLevel: user.accessLevel,
    isOnboarded: !!user.isOnboarded,
    partnerCode: user.partnerCode,
    partnerId: user.partnerId ? String(user.partnerId) : null,
    role: user.role,
    xp: user.xp || 0,
    quizLastCompletedAt: user.quizLastCompletedAt || '',
    quizCountToday: user.quizCountToday || 0,
  };
}

export async function submitQuizAttempt(
  userId: string,
  date: string,
  correct: boolean
): Promise<Partial<IUser>> {
  const user = await User.findById(userId);
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  // Check and reset daily quiz count if it's a new day
  let quizCountToday = user.quizCountToday || 0;
  if (user.quizLastCompletedAt !== date) {
    quizCountToday = 0;
  }

  if (quizCountToday >= 2) {
    throw Object.assign(new Error('You have already taken your 2 daily quizzes today. Please try again tomorrow!'), { status: 400 });
  }

  const xpToAdd = correct ? 50 : 0;
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $inc: { xp: xpToAdd },
      $set: {
        quizLastCompletedAt: date,
        quizCountToday: quizCountToday + 1,
      }
    },
    { new: true, lean: true }
  );

  if (!updatedUser) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  return {
    id: String(updatedUser._id),
    username: updatedUser.username,
    name: updatedUser.name,
    avatar: updatedUser.avatar,
    accessLevel: updatedUser.accessLevel,
    isOnboarded: !!updatedUser.isOnboarded,
    partnerCode: updatedUser.partnerCode,
    partnerId: updatedUser.partnerId ? String(updatedUser.partnerId) : null,
    role: updatedUser.role,
    xp: updatedUser.xp || 0,
    quizLastCompletedAt: updatedUser.quizLastCompletedAt || '',
    quizCountToday: updatedUser.quizCountToday || 0,
  };
}

export async function updateUserSettings(
  userId: string,
  patch: Partial<ISettings>
): Promise<ISettings> {
  const previousSettings = await Settings.findOne({ userId }).lean();
  const settings = await Settings.findOneAndUpdate(
    { userId },
    { $set: patch, $setOnInsert: { userId } },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );
  if (!settings) {
    throw Object.assign(new Error('Unable to update settings'), { status: 500 });
  }

  if (
    previousSettings?.privacyPendingAccessRequest &&
    patch.privacyPendingAccessRequest === false
  ) {
    const decision = patch.privacyShareCycleDetails === true ? 'granted' : 'declined';
    void notifyAccessDecision(userId, decision).catch((err) => {
      console.error('[updateUserSettings] Failed to notify partner access decision:', err);
    });
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
    otpEnabled: settings.otpEnabled ?? true,
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

async function notifyAccessDecision(userId: string, decision: 'granted' | 'declined'): Promise<void> {
  const user = await User.findById(userId).lean();
  if (!user?.partnerId) return;

  const [partner, partnerSettings] = await Promise.all([
    User.findById(user.partnerId).lean(),
    Settings.findOne({ userId: user.partnerId }).lean(),
  ]);
  if (!partner) return;

  const granted = decision === 'granted';
  const label = granted ? 'Access Granted' : 'Access Declined';
  const message = granted
    ? `${user.name} approved detailed cycle sharing.`
    : `${user.name} declined detailed cycle sharing for now.`;

  await PartnerPing.create({
    senderId: userId,
    receiverId: user.partnerId,
    pingId: granted ? 'access-granted-ping' : 'access-declined-ping',
    label,
    message,
    timestamp: Date.now(),
  });

  if (partner.email && partnerSettings?.notificationsEmail) {
    await sendReminderEmail({
      toEmail: partner.email,
      toName: partner.name,
      reminderTitle: label,
      reminderMessage: message,
    });
  }
}
