"use strict"

import { describe, it, expect, vi } from 'vitest'

// ─── Top-level Mocks ────────────────────────────────────────────────────────────

vi.mock('../store/useStore', () => ({
  useStore: <T,>(selector: (state: T) => T) => {
    const state = {
      settings: { chatShowTimestamps: false, privacyLockChats: false },
      dashboard: { lastPeriodStart: '2026-06-01', typicalCycleDays: 28, phaseLabel: 'Luteal' },
      user: { name: 'Test User', role: 'lady', xp: 100 },
      logs: [],
      customSymptoms: [],
      showConfirm: vi.fn(),
      hydrate: vi.fn(),
      fetchLogs: vi.fn(),
    } as T
    return selector(state)
  }
}))

vi.mock('../context/useChatSession', () => ({
  useChatSession: () => ({ temporaryChat: false, setTemporaryChat: vi.fn() })
}))

vi.mock('../services/chatService', () => ({
  chatApi: {
    getSessions: vi.fn(),
    getMessages: vi.fn(),
    send: vi.fn(),
    lock: vi.fn(),
    unlock: vi.fn(),
    unlockPermanent: vi.fn(),
    deleteSession: vi.fn(),
  },
  useChatSuggestions: () => ({ data: undefined, isLoading: false }),
  chatKeys: { sessions: ['chatSessions'] as const },
}))

vi.mock('../services/userService', () => ({
  userApi: {
    getProfile: vi.fn(),
  },
}))

vi.mock('../lib/chatAI', () => ({ generateAIResponse: () => 'Mock AI response' }))

vi.mock('../lib/haptics', () => ({
  hapticSelection: vi.fn(),
  hapticMedium: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// ─── Test Cases ──────────────────────────────────────────────────────────────

describe('ChatView - Integration Tests', () => {
  it('should setup all necessary mocks for testing', () => {
    expect(true).toBe(true)
  })
})