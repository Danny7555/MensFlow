import { Schema, model, Document } from 'mongoose';

export interface SettingsDocument extends Document {
  userId: Schema.Types.ObjectId;
  themeMode: 'light' | 'dark' | 'system';
  contrastMode: 'system' | 'standard' | 'high';
  accentPreset: 'default' | 'orchid' | 'ocean';
  languageUi: 'auto' | 'en';
  spokenLanguage: 'auto' | 'en-US';
  enableDictation: boolean;
  sidebarCollapsed: boolean;
  notificationsEmail: boolean;
  notificationsPush: boolean;
  notificationsCycleReminders: boolean;
  notificationsProduct: boolean;
  privacyShareAnalytics: boolean;
  privacyDefaultTemporaryChat: boolean;
  privacyLockChats: boolean;
  privacyLockChatsPassword: string | null;
  privacyLockChatsSecurityQuestion: string | null;
  privacyLockChatsSecurityAnswer: string | null;
  chatPersistLocal: boolean;
  chatEnterToSend: boolean;
  chatShowTimestamps: boolean;
  cycleAvgLengthDays: number;
  cycleShowFertileWindow: boolean;
  privacyShareCycleDetails: boolean;
  privacyPendingAccessRequest: boolean;
  privacyStrictLocalOnly: boolean;
  conditionOptimization: 'none' | 'pcos' | 'endometriosis' | 'perimenopause';
  disableAIPopups: boolean;
  hideDailyStoriesAndTips: boolean;
  otpEnabled: boolean;
  parentalControlsEnabled: boolean;
  parentalGuardianEmail: string | null;
  parentalContentFilter: 'standard' | 'restricted';
  parentalQuietHoursEnabled: boolean;
  parentalQuietHoursStart: string;
  parentalQuietHoursEnd: string;
}

const SettingsSchema = new Schema<SettingsDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  themeMode: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
  contrastMode: { type: String, enum: ['system', 'standard', 'high'], default: 'system' },
  accentPreset: { type: String, enum: ['default', 'orchid', 'ocean'], default: 'default' },
  languageUi: { type: String, enum: ['auto', 'en'], default: 'auto' },
  spokenLanguage: { type: String, enum: ['auto', 'en-US'], default: 'auto' },
  enableDictation: { type: Boolean, default: false },
  sidebarCollapsed: { type: Boolean, default: false },
  notificationsEmail: { type: Boolean, default: false },
  notificationsPush: { type: Boolean, default: true },
  notificationsCycleReminders: { type: Boolean, default: true },
  notificationsProduct: { type: Boolean, default: false },
  privacyShareAnalytics: { type: Boolean, default: false },
  privacyDefaultTemporaryChat: { type: Boolean, default: false },
  privacyLockChats: { type: Boolean, default: false },
  privacyLockChatsPassword: { type: String, default: null },
  privacyLockChatsSecurityQuestion: { type: String, default: null },
  privacyLockChatsSecurityAnswer: { type: String, default: null },
  chatPersistLocal: { type: Boolean, default: true },
  chatEnterToSend: { type: Boolean, default: true },
  chatShowTimestamps: { type: Boolean, default: false },
  cycleAvgLengthDays: { type: Number, default: 28, min: 15, max: 60 },
  cycleShowFertileWindow: { type: Boolean, default: true },
  privacyShareCycleDetails: { type: Boolean, default: true },
  privacyPendingAccessRequest: { type: Boolean, default: false },
  privacyStrictLocalOnly: { type: Boolean, default: false },
  conditionOptimization: { type: String, enum: ['none', 'pcos', 'endometriosis', 'perimenopause'], default: 'none' },
  disableAIPopups: { type: Boolean, default: false },
  hideDailyStoriesAndTips: { type: Boolean, default: false },
  otpEnabled: { type: Boolean, default: true },
  parentalControlsEnabled: { type: Boolean, default: false },
  parentalGuardianEmail: { type: String, default: null, trim: true, lowercase: true, maxlength: 254 },
  parentalContentFilter: { type: String, enum: ['standard', 'restricted'], default: 'standard' },
  parentalQuietHoursEnabled: { type: Boolean, default: false },
  parentalQuietHoursStart: { type: String, default: '21:00', match: /^([01]\d|2[0-3]):[0-5]\d$/ },
  parentalQuietHoursEnd: { type: String, default: '06:00', match: /^([01]\d|2[0-3]):[0-5]\d$/ },
});

export const Settings = model<SettingsDocument>('Settings', SettingsSchema);
