import { Schema, model, Document } from 'mongoose';

export interface SettingsDocument extends Document {
  userId: Schema.Types.ObjectId;
  themeMode: 'light' | 'dark' | 'system';
  contrastMode: 'system' | 'standard';
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
  chatPersistLocal: boolean;
  chatEnterToSend: boolean;
  chatShowTimestamps: boolean;
  cycleAvgLengthDays: number;
  cycleShowFertileWindow: boolean;
}

const SettingsSchema = new Schema<SettingsDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  themeMode: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
  contrastMode: { type: String, enum: ['system', 'standard'], default: 'system' },
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
  chatPersistLocal: { type: Boolean, default: true },
  chatEnterToSend: { type: Boolean, default: true },
  chatShowTimestamps: { type: Boolean, default: false },
  cycleAvgLengthDays: { type: Number, default: 28 },
  cycleShowFertileWindow: { type: Boolean, default: true },
});

export const Settings = model<SettingsDocument>('Settings', SettingsSchema);
