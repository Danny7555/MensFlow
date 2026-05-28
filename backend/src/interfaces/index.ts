import { Request } from 'express';

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface JwtPayload {
  id: string;
  username: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// ─── User ────────────────────────────────────────────────────────────────────

export interface IUser {
  id: string;
  username: string;
  passwordHash: string;
  name: string;
  avatar: string | null;
  accessLevel: 'full' | 'educational';
  isOnboarded: boolean;
  partnerCode: string;
  partnerId: string | null;
  role: 'lady' | 'partner';
  createdAt: Date;
}

// ─── Settings ────────────────────────────────────────────────────────────────

export interface ISettings {
  userId: string;
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

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface IDashboard {
  userId: string;
  lastPeriodStart: string;   // YYYY-MM-DD
  typicalCycleDays: number;
  phaseLabel: string;
  hormoneTrend: string;
  bodySignals: string;
  guidanceLines: string[];
  cycleNotes: string;
  cycleVariationDays: number;
  isAtypical: boolean;
}

// ─── Symptom Log ─────────────────────────────────────────────────────────────

export interface ISymptomLog {
  userId: string;
  date: string;              // YYYY-MM-DD
  symptoms: string[];
}

// ─── Custom Symptom ──────────────────────────────────────────────────────────

export interface ICustomSymptom {
  id: string;
  userId: string;
  label: string;
  category: string;
}

// ─── Partner Ping ────────────────────────────────────────────────────────────

export interface IPartnerPing {
  senderId: string;
  receiverId: string;
  pingId: string;
  label: string;
  message: string;
  timestamp: number;
}

// ─── Support ─────────────────────────────────────────────────────────────────

export interface ISupportAction {
  userId: string;
  actionId: string;
  completedAt: string;       // YYYY-MM-DD
}

export interface ISupportStreak {
  userId: string;
  streak: number;
  lastActionDate: string;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export type ChatRole = 'user' | 'assistant';

export interface IChatMessage {
  id: string;
  userId: string;
  sessionId: string;
  role: ChatRole;
  text: string;
  isLocked: boolean;
  passcode: string | null;
  securityQuestion: string | null;
  securityAnswerHash: string | null;
  createdAt: number;
}

export interface ISessionSummary {
  sessionId: string;
  isLocked: boolean;
  securityQuestion: string | null;
  createdAt: number;
  messageCount: number;
  title?: string;
}
