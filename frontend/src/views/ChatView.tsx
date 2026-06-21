import { useCallback, useEffect, useRef, useState, useReducer } from 'react'
import { useChatSession } from '../context/useChatSession'
import { useStore } from '../store/useStore'
import { CLEAR_LOCAL_CHATS_EVENT, SECURITY_QUESTIONS } from '../lib/constants'
import { ChatSkeleton } from '../components/skeletons/ChatSkeleton'
import { SYMPTOM_DEFS } from '../data/symptomsData'
import { chatApi, type ApiChatSession, useChatSuggestions } from '../services/chatService'
import { userApi } from '../services/userService'
import { toast } from 'sonner'
import { computeCycleDay } from '../lib/cycleUtils'
import { generateAIResponse } from '../lib/chatAI'
import { ChatSidebar } from '../components/chat/ChatSidebar'
import { ChatLockScreen } from '../components/chat/ChatLockScreen'
import { PermanentUnlockModal } from '../components/chat/PermanentUnlockModal'
import { LockSetupModal } from '../components/chat/LockSetupModal'
import { hapticSelection, hapticMedium } from '../lib/haptics'
import { ChatHeader } from '../components/chat/ChatHeader'
import { ChatEmptyState } from '../components/chat/ChatEmptyState'
import { ChatLanding } from '../components/chat/ChatLanding'
import { ChatThread, type Msg } from '../components/chat/ChatThread'

const generateNewSessionId = () => `chat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

// ── ChatSessionState reducer ──────────────────────────────────────────────────

interface ChatSessionState {
  activeSessionId: string | null
  messages: Msg[]
  isLoading: boolean
  lockedSessionToUnlock: {
    sessionId: string
    securityQuestion: string | null
    error?: string
  } | null
}

type ChatSessionAction =
  | { type: 'INIT_LOADED'; sessions: ApiChatSession[]; showOnlyLocked: boolean }
  | { type: 'TEMP_CHAT_INIT'; messages: Msg[] }
  | { type: 'LOAD_MESSAGES_START' }
  | { type: 'LOAD_MESSAGES_SUCCESS'; messages: Msg[] }
  | { type: 'LOAD_MESSAGES_LOCKED'; sessionId: string; securityQuestion: string | null }
  | { type: 'LOAD_MESSAGES_ERROR' }
  | { type: 'ADD_USER_MESSAGE'; message: Msg }
  | { type: 'ADD_ASSISTANT_MESSAGE'; message: Msg }
  | { type: 'SET_ACTIVE_SESSION'; sessionId: string | null }
  | { type: 'CLEAR_SESSION'; messages: Msg[] }
  | { type: 'NEW_CHAT'; sessionId: string; messages: Msg[] }
  | { type: 'UNLOCKED' }

function chatSessionReducer(state: ChatSessionState, action: ChatSessionAction): ChatSessionState {
  switch (action.type) {
    case 'INIT_LOADED': {
      const isLocked = action.showOnlyLocked
      const filtered = isLocked ? action.sessions?.filter(s => s.isLocked) : action.sessions
      const activeId = filtered && filtered.length > 0 ? filtered[0].sessionId : (isLocked ? null : generateNewSessionId())
      return { activeSessionId: activeId, messages: [], isLoading: false, lockedSessionToUnlock: null }
    }
    case 'TEMP_CHAT_INIT':
      return { activeSessionId: null, messages: action.messages, isLoading: false, lockedSessionToUnlock: null }
    case 'LOAD_MESSAGES_START':
      return { ...state, isLoading: true }
    case 'LOAD_MESSAGES_SUCCESS':
      return { ...state, messages: action.messages, isLoading: false, lockedSessionToUnlock: null }
    case 'LOAD_MESSAGES_LOCKED':
      return { ...state, isLoading: false, lockedSessionToUnlock: { sessionId: action.sessionId, securityQuestion: action.securityQuestion } }
    case 'LOAD_MESSAGES_ERROR':
      return { ...state, isLoading: false }
    case 'ADD_USER_MESSAGE':
      return { ...state, messages: [...state.messages, action.message] }
    case 'ADD_ASSISTANT_MESSAGE':
      return { ...state, messages: [...state.messages, action.message] }
    case 'SET_ACTIVE_SESSION':
      return { ...state, activeSessionId: action.sessionId }
    case 'CLEAR_SESSION':
      return { ...state, activeSessionId: null, messages: action.messages, lockedSessionToUnlock: null }
    case 'NEW_CHAT':
      return { ...state, activeSessionId: action.sessionId, messages: action.messages, lockedSessionToUnlock: null }
    case 'UNLOCKED':
      return { ...state, lockedSessionToUnlock: null }
    default:
      return state
  }
}

const initialChatSession: ChatSessionState = {
  activeSessionId: null,
  messages: [],
  isLoading: true,
  lockedSessionToUnlock: null,
}

// ── LockFormState reducer ─────────────────────────────────────────────────────

interface LockFormState {
  lockSetupSessionId: string | null
  lockSetupPasscode: string
  lockSetupQuestionId: string
  lockSetupAnswer: string
  isSettingUpLock: boolean
  permanentUnlockSessionId: string | null
  permanentUnlockPasscode: string
  isLockingSession: boolean
}

type LockFormAction =
  | { type: 'OPEN_LOCK_SETUP'; sessionId: string }
  | { type: 'SET_PASSCODE'; passcode: string }
  | { type: 'SET_QUESTION'; questionId: string }
  | { type: 'SET_ANSWER'; answer: string }
  | { type: 'START_SETTING_UP' }
  | { type: 'DONE_SETTING_UP' }
  | { type: 'OPEN_PERMANENT_UNLOCK'; sessionId: string }
  | { type: 'SET_PERMANENT_PASSCODE'; passcode: string }
  | { type: 'START_LOCKING' }
  | { type: 'DONE_LOCKING' }
  | { type: 'CLOSE_ALL' }

function lockFormReducer(state: LockFormState, action: LockFormAction): LockFormState {
  switch (action.type) {
    case 'OPEN_LOCK_SETUP':
      return { ...state, lockSetupSessionId: action.sessionId, lockSetupPasscode: '', lockSetupQuestionId: SECURITY_QUESTIONS[0].id, lockSetupAnswer: '' }
    case 'SET_PASSCODE':
      return { ...state, lockSetupPasscode: action.passcode }
    case 'SET_QUESTION':
      return { ...state, lockSetupQuestionId: action.questionId }
    case 'SET_ANSWER':
      return { ...state, lockSetupAnswer: action.answer }
    case 'START_SETTING_UP':
      return { ...state, isSettingUpLock: true }
    case 'DONE_SETTING_UP':
      return { ...state, lockSetupSessionId: null, lockSetupPasscode: '', lockSetupAnswer: '', isSettingUpLock: false }
    case 'OPEN_PERMANENT_UNLOCK':
      return { ...state, permanentUnlockSessionId: action.sessionId, permanentUnlockPasscode: '' }
    case 'SET_PERMANENT_PASSCODE':
      return { ...state, permanentUnlockPasscode: action.passcode }
    case 'START_LOCKING':
      return { ...state, isLockingSession: true }
    case 'DONE_LOCKING':
      return { ...state, isLockingSession: false }
    case 'CLOSE_ALL':
      return { ...initialLockForm }
    default:
      return state
  }
}

const initialLockForm: LockFormState = {
  lockSetupSessionId: null,
  lockSetupPasscode: '',
  lockSetupQuestionId: SECURITY_QUESTIONS[0].id,
  lockSetupAnswer: '',
  isSettingUpLock: false,
  permanentUnlockSessionId: null,
  permanentUnlockPasscode: '',
  isLockingSession: false,
}

function useChatLockForm({
  rawPrivacyLockChats,
  setSessions,
  session,
  welcomeText,
  dispatch,
}: {
  rawPrivacyLockChats: boolean
  setSessions: React.Dispatch<React.SetStateAction<ApiChatSession[]>>
  session: ChatSessionState
  welcomeText: string
  dispatch: React.Dispatch<ChatSessionAction>
}) {
  const [lockForm, lockDispatch] = useReducer(lockFormReducer, initialLockForm)
  const unlockedPasscodesRef = useRef<Record<string, string>>({})

  const openLockModal = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (lockForm.isLockingSession || lockForm.isSettingUpLock) return

    if (rawPrivacyLockChats) {
      lockDispatch({ type: 'START_LOCKING' })
      try {
        await chatApi.lock(sessionId)
        toast.success('Chat locked!')
        setSessions((prev) => prev.map((s) => s.sessionId === sessionId ? { ...s, isLocked: true } : s))
        if (session.activeSessionId === sessionId) {
          dispatch({ type: 'NEW_CHAT', sessionId: generateNewSessionId(), messages: [{ id: 'welcome', role: 'assistant', text: welcomeText, createdAt: Date.now() }] })
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Failed to lock session')
      } finally {
        lockDispatch({ type: 'DONE_LOCKING' })
      }
      return
    }

    lockDispatch({ type: 'OPEN_LOCK_SETUP', sessionId })
  }

  const handleLockSetupSubmit = async () => {
    if (!lockForm.lockSetupSessionId || !lockForm.lockSetupPasscode.trim()) return
    lockDispatch({ type: 'START_SETTING_UP' })
    try {
      const activeQuestion = SECURITY_QUESTIONS.find(q => q.id === lockForm.lockSetupQuestionId)!
      await chatApi.lock(lockForm.lockSetupSessionId, lockForm.lockSetupPasscode, activeQuestion.label, lockForm.lockSetupAnswer)
      toast.success('Chat locked!')
      setSessions((prev) => prev.map((s) => s.sessionId === lockForm.lockSetupSessionId ? { ...s, isLocked: true } : s))
      if (session.activeSessionId === lockForm.lockSetupSessionId) {
        dispatch({ type: 'NEW_CHAT', sessionId: generateNewSessionId(), messages: [{ id: 'welcome', role: 'assistant', text: welcomeText, createdAt: Date.now() }] })
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to lock session')
    } finally {
      lockDispatch({ type: 'DONE_SETTING_UP' })
    }
  }

  const handlePermanentUnlock = async () => {
    if (!lockForm.permanentUnlockSessionId) return
    try {
      await chatApi.unlockPermanent(lockForm.permanentUnlockSessionId, lockForm.permanentUnlockPasscode || undefined)
      toast.success('Chat is now public again!')
      setSessions((prev) => prev.map((s) => s.sessionId === lockForm.permanentUnlockSessionId ? { ...s, isLocked: false } : s))
      const next = { ...unlockedPasscodesRef.current }; delete next[lockForm.permanentUnlockSessionId]; unlockedPasscodesRef.current = next
      lockDispatch({ type: 'CLOSE_ALL' })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Incorrect passcode, try again.')
    }
  }

  return {
    lockForm,
    lockDispatch,
    unlockedPasscodesRef,
    openLockModal,
    handleLockSetupSubmit,
    handlePermanentUnlock,
  }
}

// Helper components removed (now imported from components/chat/)

// ── Main component ────────────────────────────────────────────────────────────

import { useSEO } from '../hooks/useSEO'

export function ChatView({ showOnlyLocked = false, privacyPassword }: { showOnlyLocked?: boolean; privacyPassword?: string }) {
  useSEO({
    title: 'Ask AI',
    description: "Chat with MensFlow's AI support companion to learn about your cycle, log symptoms, and retrieve personalized wellness answers.",
    keywords: 'AI assistant, cycle advice, locked chats, private tracking, secret chat'
  })
  const { temporaryChat, setTemporaryChat } = useChatSession()
  const { chatShowTimestamps, privacyLockChats: rawPrivacyLockChats } = useStore((state) => state.settings)
  const { dashboard: data, user, logs, customSymptoms, showConfirm, hydrate, fetchLogs } = useStore()

  const threadEndRef = useRef<HTMLDivElement>(null)
  const showOnlyLockedRef = useRef(showOnlyLocked)

  const currentDay = computeCycleDay(data.lastPeriodStart, data.typicalCycleDays)

  const welcomeText = user.role === 'partner'
    ? `Hi - I'm MensFlow, your partner support companion. Currently, ${user.name || 'your partner'} is on Day ${currentDay} of her cycle (${data.phaseLabel}). Ask me about her active phase, logged symptoms, supportive gestures, or care ideas for today. `
    : `Hi - I'm MensFlow, your cycle support companion. You are on Day ${currentDay} of your cycle (${data.phaseLabel}). Ask me about your active phase, symptoms, food, rest, what to log, or how to care for yourself today. `

  const [sessions, setSessions] = useState<ApiChatSession[]>([])
  const filteredSessions = showOnlyLocked
    ? sessions.filter((s) => s.isLocked)
    : sessions.filter((s) => !s.isLocked)
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') return window.innerWidth > 768
    return true
  })
  const [session, dispatch] = useReducer(chatSessionReducer, initialChatSession)

  const [draft, setDraft] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const { data: suggestions, isLoading: suggestionsLoading } = useChatSuggestions()

  const {
    lockForm,
    lockDispatch,
    unlockedPasscodesRef,
    openLockModal,
    handleLockSetupSubmit,
    handlePermanentUnlock,
  } = useChatLockForm({
    rawPrivacyLockChats,
    setSessions,
    session,
    welcomeText,
    dispatch,
  })

  const fetchSessions = useCallback(async () => {
    if (temporaryChat) return
    try {
      const data = await chatApi.getSessions()
      setSessions(data)
      return data
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to load chat history list')
    }
  }, [temporaryChat])

  useEffect(() => {
    if (temporaryChat) {
      const timer = setTimeout(() => {
        dispatch({ type: 'TEMP_CHAT_INIT', messages: [{ id: 'welcome', role: 'assistant', text: welcomeText, createdAt: Date.now() }] })
      }, 0)
      return () => clearTimeout(timer)
    }

    const loadingTimer = setTimeout(() => dispatch({ type: 'LOAD_MESSAGES_START' }), 0)
    fetchSessions()
      .then((data) => {
        dispatch({ type: 'INIT_LOADED', sessions: data ?? [], showOnlyLocked: showOnlyLockedRef.current })
      })
      .catch(() => dispatch({ type: 'LOAD_MESSAGES_ERROR' }))
      .finally(() => clearTimeout(loadingTimer))
  }, [temporaryChat, fetchSessions, welcomeText])

  useEffect(() => {
    if (temporaryChat) {
      const timer = setTimeout(() => {
        dispatch({ type: 'TEMP_CHAT_INIT', messages: [{ id: 'welcome', role: 'assistant', text: welcomeText, createdAt: Date.now() }] })
      }, 0)
      return () => clearTimeout(timer)
    }

    if (!session.activeSessionId) return

    const existingSession = sessions.find((s) => s.sessionId === session.activeSessionId)
    if (!existingSession || existingSession.messageCount === 0) {
      const timer = setTimeout(() => {
        dispatch({ type: 'LOAD_MESSAGES_SUCCESS', messages: [{ id: 'welcome', role: 'assistant', text: welcomeText, createdAt: Date.now() }] })
      }, 0)
      return () => clearTimeout(timer)
    }

    const timer = setTimeout(() => {
      dispatch({ type: 'LOAD_MESSAGES_START' })
      const passcode = unlockedPasscodesRef.current[session.activeSessionId!] ?? privacyPassword
      chatApi.getMessages(session.activeSessionId!, passcode)
        .then((history) => {
          const msgs: Msg[] = history.length > 0 ? history : [{ id: 'welcome', role: 'assistant', text: welcomeText, createdAt: Date.now() }]
          if (!unlockedPasscodesRef.current[session.activeSessionId!] && privacyPassword) {
            unlockedPasscodesRef.current = { ...unlockedPasscodesRef.current, [session.activeSessionId!]: privacyPassword }
          }
          dispatch({ type: 'LOAD_MESSAGES_SUCCESS', messages: msgs })
        })
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : 'Failed to load chat history'
          if (msg.toLowerCase().includes('locked')) {
            const es = sessions.find(s => s.sessionId === session.activeSessionId)
            dispatch({ type: 'LOAD_MESSAGES_LOCKED', sessionId: session.activeSessionId!, securityQuestion: es?.securityQuestion ?? null })
          } else {
            toast.error(msg)
            dispatch({ type: 'LOAD_MESSAGES_ERROR' })
          }
        })
    }, 0)
    return () => clearTimeout(timer)
  }, [session.activeSessionId, temporaryChat, welcomeText, privacyPassword, sessions])

  const todayStr = new Date().toISOString().split('T')[0]
  const todayLog = logs.find(l => l.date === todayStr)

  const todaySymptoms = (() => {
    if (!todayLog) return []
    const allSymptomDefs = [...SYMPTOM_DEFS, ...customSymptoms]
    return todayLog.symptoms.map(sId => {
      const def = allSymptomDefs.find(d => d.id === sId)
      return def ? def.label : sId
    })
  })()

  const fetchSessionsRef = useRef(fetchSessions)
  fetchSessionsRef.current = fetchSessions

  const welcomeTextRef = useRef(welcomeText)
  welcomeTextRef.current = welcomeText

  const temporaryChatRef = useRef(temporaryChat)
  temporaryChatRef.current = temporaryChat

  useEffect(() => {
    const onClear = () => {
      dispatch({ type: 'CLEAR_SESSION', messages: [{ id: 'welcome', role: 'assistant', text: welcomeTextRef.current, createdAt: Date.now() }] })
      if (!temporaryChatRef.current) fetchSessionsRef.current()
    }
    window.addEventListener(CLEAR_LOCAL_CHATS_EVENT, onClear)
    return () => window.removeEventListener(CLEAR_LOCAL_CHATS_EVENT, onClear)
  }, [])

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [session.messages, isTyping])

  const send = async (overrideText?: string) => {
    const text = (overrideText || draft).trim()
    if (!text || isTyping) return

    dispatch({ type: 'ADD_USER_MESSAGE', message: { id: `u-${crypto.randomUUID()}`, role: 'user', text, createdAt: Date.now() } })
    if (!overrideText) setDraft('')
    setIsTyping(true)

    if (temporaryChat) {
      setTimeout(() => {
        const aid = `a-${Date.now()}`
        const aiResponse = generateAIResponse(text, user.name, currentDay, data.phaseLabel, todaySymptoms, user.role)
        dispatch({ type: 'ADD_ASSISTANT_MESSAGE', message: { id: aid, role: 'assistant', text: aiResponse, createdAt: Date.now() } })
        setIsTyping(false)
      }, 1500)
    } else {
      const isNew = !session.activeSessionId
      const sid = session.activeSessionId || generateNewSessionId()

      try {
        const passcode = unlockedPasscodesRef.current[sid]
        const result = await chatApi.send(sid, text, passcode)

        if (isNew) dispatch({ type: 'SET_ACTIVE_SESSION', sessionId: sid })

        dispatch({ type: 'ADD_ASSISTANT_MESSAGE', message: { id: result.assistantMessage.id, role: result.assistantMessage.role, text: result.assistantMessage.text, createdAt: result.assistantMessage.createdAt } })
        const profile = await userApi.getProfile()
        hydrate({ user: profile.user, settings: profile.settings, dashboard: profile.dashboard })
        await fetchLogs()
        fetchSessions()
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Failed to send message')
      } finally {
        setIsTyping(false)
      }
    }
  }

  const handleSessionClick = (sessionId: string) => {
    if (temporaryChat) setTemporaryChat(false)
    if (typeof window !== 'undefined' && window.innerWidth <= 768) setIsSidebarOpen(false)
    if (session.activeSessionId === sessionId) return
    dispatch({ type: 'SET_ACTIVE_SESSION', sessionId })
    dispatch({ type: 'UNLOCKED' })
  }

  const startNewChat = () => {
    if (temporaryChat) setTemporaryChat(false)
    if (typeof window !== 'undefined' && window.innerWidth <= 768) setIsSidebarOpen(false)
    dispatch({ type: 'NEW_CHAT', sessionId: generateNewSessionId(), messages: [{ id: 'welcome', role: 'assistant', text: welcomeText, createdAt: Date.now() }] })
  }

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    showConfirm({
      title: 'Delete Conversation',
      description: 'Are you sure you want to delete this conversation? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await chatApi.deleteSession(sessionId)
          toast.success('Chat deleted')
          if (session.activeSessionId === sessionId) {
            const remaining = (showOnlyLocked ? sessions.filter(s => s.isLocked) : sessions).filter((s) => s.sessionId !== sessionId)
            dispatch({ type: 'SET_ACTIVE_SESSION', sessionId: remaining.length > 0 ? remaining[0].sessionId : (showOnlyLocked ? null : generateNewSessionId()) })
          }
          fetchSessions()
        } catch (err: unknown) {
          toast.error(err instanceof Error ? err.message : 'Failed to delete chat')
        }
      }
    })
  }

  // Lock handlers moved to custom useChatLockForm hook

  const handleUnlockSubmit = async (passcode: string, isSecurityReset: boolean, securityAnswer: string) => {
    if (!session.lockedSessionToUnlock) return
    const sid = session.lockedSessionToUnlock.sessionId

    try {
      if (isSecurityReset) {
        if (!securityAnswer.trim()) { toast.error('Security answer is required'); return }
        const res = await chatApi.unlock(sid, undefined, securityAnswer)
        if (res.success && res.passcode) {
          toast.success(`Passcode retrieved! Unlocking chat.`)
          unlockedPasscodesRef.current = { ...unlockedPasscodesRef.current, [sid]: res.passcode! }
        } else if (res.success) {
          toast.success('Security answer verified. Chat unlocked.')
        }
      } else {
        if (!passcode.trim()) { toast.error('Passcode is required'); return }
        const res = await chatApi.unlock(sid, passcode)
        if (res.success) {
          toast.success('Chat unlocked')
          unlockedPasscodesRef.current = { ...unlockedPasscodesRef.current, [sid]: passcode }
        }
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Verification failed')
    }
  }

  const isInitialState = session.messages.length <= 1 && session.messages[0]?.id === 'welcome'

  if (session.isLoading) return <ChatSkeleton />

  return (
    <div className="chat-layout-container">
      <ChatSidebar
        sessions={filteredSessions}
        activeSessionId={session.activeSessionId}
        isOpen={isSidebarOpen}
        showOnlyLocked={showOnlyLocked}
        onSessionClick={handleSessionClick}
        onNewChat={startNewChat}
        onClose={() => setIsSidebarOpen(false)}
        onLock={openLockModal}
        onDelete={deleteSession}
      />

      <div className="chat-main-content">
        <ChatHeader
          title={temporaryChat ? 'Temporary Chat' : !session.activeSessionId ? 'New Chat' : (sessions.find(s => s.sessionId === session.activeSessionId)?.title ?? 'New Conversation')}
          sidebarOpen={isSidebarOpen}
          onToggleSidebar={() => { hapticSelection(); setIsSidebarOpen(!isSidebarOpen) }}
          hasActiveSession={!!session.activeSessionId}
          isLocked={!!(session.activeSessionId && sessions.find(s => s.sessionId === session.activeSessionId)?.isLocked)}
          isLocking={lockForm.isLockingSession || lockForm.isSettingUpLock}
          onLock={(e) => { hapticMedium(); session.activeSessionId && openLockModal(session.activeSessionId, e) }}
          onUnlock={() => session.activeSessionId && lockDispatch({ type: 'OPEN_PERMANENT_UNLOCK', sessionId: session.activeSessionId })}
        />

        {temporaryChat && (
          <div className="mx-4 mt-3 rounded-xl border border-[var(--mf-border)] bg-[var(--mf-card)] px-4 py-2 text-[11px] leading-relaxed text-muted-foreground">
            Temporary chat can use what you say in this thread to answer better, but it will not save messages or update dashboard data. Switch to a saved chat when you want cycle details from the conversation to populate your profile.
          </div>
        )}

        {session.lockedSessionToUnlock ? (
          <ChatLockScreen unlockInfo={session.lockedSessionToUnlock} onSubmit={handleUnlockSubmit} />
        ) : showOnlyLocked && filteredSessions.length === 0 ? (
          <ChatEmptyState />
        ) : isInitialState ? (
          <ChatLanding
            suggestions={suggestions}
            suggestionsLoading={suggestionsLoading}
            isTyping={isTyping}
            draft={draft}
            onSend={send}
            onDraftChange={setDraft}
          />
        ) : (
          <ChatThread
            messages={session.messages}
            isTyping={isTyping}
            suggestions={suggestions}
            suggestionsLoading={suggestionsLoading}
            draft={draft}
            onSend={send}
            onDraftChange={setDraft}
            chatShowTimestamps={chatShowTimestamps}
            temporaryChat={temporaryChat}
            userXp={user.xp}
            threadEndRef={threadEndRef}
          />
        )}
      </div>

      {lockForm.permanentUnlockSessionId && (
        <PermanentUnlockModal
          sessionId={lockForm.permanentUnlockSessionId}
          passcode={lockForm.permanentUnlockPasscode}
          onPasscodeChange={(v) => lockDispatch({ type: 'SET_PERMANENT_PASSCODE', passcode: v })}
          onConfirm={handlePermanentUnlock}
          onCancel={() => lockDispatch({ type: 'CLOSE_ALL' })}
        />
      )}

      {lockForm.lockSetupSessionId && (
        <LockSetupModal
          passcode={lockForm.lockSetupPasscode}
          isLocking={lockForm.isSettingUpLock}
          questionId={lockForm.lockSetupQuestionId}
          answer={lockForm.lockSetupAnswer}
          onPasscodeChange={(v) => lockDispatch({ type: 'SET_PASSCODE', passcode: v })}
          onQuestionChange={(qid) => lockDispatch({ type: 'SET_QUESTION', questionId: qid })}
          onAnswerChange={(a) => lockDispatch({ type: 'SET_ANSWER', answer: a })}
          onSubmit={handleLockSetupSubmit}
          onCancel={() => lockDispatch({ type: 'CLOSE_ALL' })}
        />
      )}
    </div>
  )
}
