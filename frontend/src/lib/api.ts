/**
 * API client — every backend call lives here.
 *
 * All functions throw an Error with a human-readable message on failure,
 * so callers only need a try/catch — no status-code checks outside this file.
 */

import { getToken } from './auth-token'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5001/api'

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  auth = true
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (auth) {
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.error ?? `Request failed (${res.status})`)
  }

  return data as T
}

const get  = <T>(path: string)              => request<T>('GET',    path)
const post = <T>(path: string, body: unknown) => request<T>('POST',   path, body)
const put  = <T>(path: string, body: unknown) => request<T>('PUT',    path, body)
const del  = <T>(path: string)              => request<T>('DELETE', path)

// ─── Types ────────────────────────────────────────────────────────────────────

export type ApiUser = {
  id: string
  username: string
  name: string
  avatar: string | null
  accessLevel: 'full' | 'educational'
  isOnboarded: boolean
  partnerCode: string
  partnerId: string | null
}

export type ApiSettings = {
  themeMode: 'light' | 'dark' | 'system'
  contrastMode: 'system' | 'standard'
  accentPreset: 'default' | 'orchid' | 'ocean'
  languageUi: 'auto' | 'en'
  spokenLanguage: 'auto' | 'en-US'
  enableDictation: boolean
  sidebarCollapsed: boolean
  notificationsEmail: boolean
  notificationsPush: boolean
  notificationsCycleReminders: boolean
  notificationsProduct: boolean
  privacyShareAnalytics: boolean
  privacyDefaultTemporaryChat: boolean
  chatPersistLocal: boolean
  chatEnterToSend: boolean
  chatShowTimestamps: boolean
  cycleAvgLengthDays: number
  cycleShowFertileWindow: boolean
}

export type ApiDashboard = {
  lastPeriodStart: string
  typicalCycleDays: number
  phaseLabel: string
  hormoneTrend: string
  bodySignals: string
  guidanceLines: string[]
  cycleNotes: string
}

export type ApiSymptomLog = {
  date: string
  symptoms: string[]
}

export type ApiCustomSymptom = {
  id: string
  label: string
  category: string
}

export type ApiPing = {
  pingId: string
  label: string
  message: string
  timestamp: number
}

export type ApiChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  createdAt: number
}

export type ApiChatSession = {
  sessionId: string
  isLocked: boolean
  securityQuestion: string | null
  createdAt: number
  messageCount: number
  title: string
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (username: string, password: string, name: string) =>
    request<{ token: string; user: ApiUser }>('POST', '/auth/register', { username, password, name }, false),

  login: (username: string, password: string) =>
    request<{ token: string; user: ApiUser }>('POST', '/auth/login', { username, password }, false),
}

// ─── User / Settings / Dashboard ─────────────────────────────────────────────

export const userApi = {
  getProfile: () =>
    get<{ user: ApiUser; settings: ApiSettings; dashboard: ApiDashboard }>('/user/profile'),

  updateProfile: (patch: Partial<Pick<ApiUser, 'name' | 'avatar' | 'accessLevel' | 'isOnboarded'>>) =>
    put<{ user: ApiUser }>('/user/profile', patch),

  updateSettings: (patch: Partial<ApiSettings>) =>
    put<ApiSettings>('/user/settings', patch),

  updateDashboard: (patch: Partial<ApiDashboard>) =>
    put<ApiDashboard>('/user/dashboard', patch),
}

// ─── Cycle Logs ───────────────────────────────────────────────────────────────

export const logsApi = {
  getAll: () =>
    get<ApiSymptomLog[]>('/logs'),

  upsert: (date: string, symptoms: string[]) =>
    post<ApiSymptomLog>('/logs', { date, symptoms }),

  clearAll: () =>
    del<{ success: boolean }>('/logs'),

  getCustom: () =>
    get<ApiCustomSymptom[]>('/logs/custom'),

  addCustom: (label: string, category: string) =>
    post<ApiCustomSymptom>('/logs/custom', { label, category }),

  removeCustom: (id: string) =>
    del<{ success: boolean }>(`/logs/custom/${id}`),
}

// ─── Partner ──────────────────────────────────────────────────────────────────

export const partnerApi = {
  getStatus: () =>
    get<object>('/partner/status'),

  pair: (partnerCode: string) =>
    post<{ success: boolean; partner: { id: string; name: string } }>('/partner/pair', { partnerCode }),

  disconnect: () =>
    post<{ success: boolean }>('/partner/disconnect', {}),

  sendPing: (pingId: string, label: string, message: string) =>
    post<{ success: boolean; ping: ApiPing }>('/partner/ping', { pingId, label, message }),

  getLatestPing: () =>
    get<ApiPing | null>('/partner/ping'),

  toggleAction: (actionId: string) =>
    post<{ completedActions: string[]; supportStreak: number; lastActionDate: string }>(
      '/partner/action',
      { actionId }
    ),
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export const chatApi = {
  getSessions: () =>
    get<ApiChatSession[]>('/chat/sessions'),

  getMessages: (sessionId: string, passcode?: string) =>
    get<ApiChatMessage[]>(`/chat/sessions/${sessionId}${passcode ? `?passcode=${passcode}` : ''}`),

  send: (sessionId: string, text: string, passcode?: string) =>
    post<{ userMessage: ApiChatMessage; assistantMessage: ApiChatMessage }>(
      '/chat/message',
      { sessionId, text, ...(passcode ? { passcode } : {}) }
    ),

  lock: (sessionId: string, passcode: string, securityQuestion: string, securityAnswer: string) =>
    put<{ success: boolean }>(`/chat/sessions/${sessionId}/lock`, {
      passcode,
      securityQuestion,
      securityAnswer,
    }),

  unlock: (sessionId: string, passcode?: string, securityAnswer?: string) =>
    post<{ success: boolean; passcode?: string }>(`/chat/sessions/${sessionId}/unlock`, {
      ...(passcode ? { passcode } : {}),
      ...(securityAnswer ? { securityAnswer } : {}),
    }),

  deleteSession: (sessionId: string) =>
    del<{ success: boolean }>(`/chat/sessions/${sessionId}`),
}
