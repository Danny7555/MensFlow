import { useCallback, useEffect, useRef, useState, useReducer } from 'react'
import { m } from 'framer-motion'
import {
  Ghost,
  Question,
  Lock,
  LockOpen,
  SidebarSimple,
  Sparkle,
  WarningCircle,
  CaretRight
} from '@phosphor-icons/react'
import { ChatComposer } from '../components/ChatComposer'
import { useChatSession } from '../context/useChatSession'
import { useStore } from '../store/useStore'
import { CLEAR_LOCAL_CHATS_EVENT, SECURITY_QUESTIONS } from '../lib/constants'
import { Tooltip, TooltipContent, TooltipTrigger } from '../components/ui/tooltip'
import { ChatSkeleton } from '../components/skeletons/ChatSkeleton'
import { SYMPTOM_DEFS } from '../data/symptomsData'
import { chatApi, type ApiChatSession, useChatSuggestions } from '../services/chatService'
import { userApi } from '../services/userService'
import { toast } from 'sonner'
import { computeCycleDay } from '../lib/cycleUtils'
import { MarkdownText } from '../components/MarkdownText'
import { Button } from '@/components/ui/button'
import { generateAIResponse } from '../lib/chatAI'
import { ChatSidebar } from '../components/chat/ChatSidebar'
import { ChatLockScreen } from '../components/chat/ChatLockScreen'
import { PermanentUnlockModal } from '../components/chat/PermanentUnlockModal'
import { LockSetupModal } from '../components/chat/LockSetupModal'
import { hapticSelection, hapticMedium } from '../lib/haptics'

const generateNewSessionId = () => `chat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
const fmtTime = (t: number) => {
  const d = new Date(t)
  let hours = d.getHours()
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  hours = hours ? hours : 12
  return `${hours}:${minutes} ${ampm}`
}
const getIsoString = (t: number) => new Date(t).toISOString()

type Msg = {
  id: string
  role: 'user' | 'assistant'
  text: string
  createdAt: number
}

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

// ── Sub-components ────────────────────────────────────────────────────────────

function ChatHeader({
  title,
  sidebarOpen,
  onToggleSidebar,
  hasActiveSession,
  isLocked,
  isLocking,
  onLock,
  onUnlock,
}: {
  title: string
  sidebarOpen: boolean
  onToggleSidebar: () => void
  hasActiveSession: boolean
  isLocked: boolean
  isLocking: boolean
  onLock: (e: React.MouseEvent) => void
  onUnlock: () => void
}) {
  return (
    <div className="chat-header-bar">
      <div className="chat-header-left">
        <button
          type="button"
          className="chat-toggle-sidebar-btn active-squish"
          onClick={onToggleSidebar}
          title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          <SidebarSimple size={20} />
        </button>
        <span className="chat-header-title">{title}</span>
      </div>

      <div className="flex items-center gap-2">
        {hasActiveSession && !isLocked && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg h-8 text-xs gap-1.5"
            onClick={onLock}
            disabled={isLocking}
          >
            <Lock size={14} />
            {isLocking ? 'Locking…' : 'Lock Chat'}
          </Button>
        )}
        {hasActiveSession && isLocked && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
              <Lock size={10} weight="fill" />
              Locked
            </span>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg h-8 text-xs gap-1.5 hover:text-emerald-500 hover:border-emerald-500/30"
              title="Remove password protection and make this chat public"
              onClick={onUnlock}
            >
              <LockOpen size={14} />
              Unlock
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function ChatEmptyState() {
  return (
    <div className="flex-1 overflow-y-auto flex items-center justify-center p-4">
      <div className="text-center max-w-sm mx-auto space-y-4">
        <div className="size-16 rounded-full bg-[var(--mf-accent-soft)]/20 flex items-center justify-center text-[var(--mf-accent)] mx-auto animate-pulse">
          <Lock size={32} />
        </div>
        <h2 className="text-lg font-semibold text-[var(--mf-text-strong)]">No Locked Chats</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          You haven&apos;t locked any conversation sessions yet. Go to the main chat, select a conversation, and click the &quot;Lock Chat&quot; button to secure it.
        </p>
      </div>
    </div>
  )
}

function ChatLanding({
  suggestions,
  suggestionsLoading,
  isTyping,
  draft,
  onSend,
  onDraftChange,
}: {
  suggestions: string[] | undefined
  suggestionsLoading: boolean
  isTyping: boolean
  draft: string
  onSend: (overrideText?: string) => void
  onDraftChange: (v: string) => void
}) {
  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-5 flex flex-col">
      <div className="landing-center animate-in fade-in zoom-in duration-700 w-full mx-auto my-auto">
        <div className="landing-hero-image-wrap">
          <div className="landing-hero-glow" />
          <img loading="lazy" src="/images/lady.jpg" alt="" className="landing-hero-image" />
        </div>
        <div className="w-full max-w-[500px] mx-auto space-y-1 sm:space-y-1.5">
          <h1 className="landing-title">Ask MensFlow about your cycle?</h1>
          <div className="landing-sub">
            <span>Education, tracking context, and supportive guidance; </span>
            <strong className="font-semibold text-rose-600 dark:text-rose-400">not a substitute for medical care.</strong>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="p-1 hover:bg-black/5 rounded-full transition-colors inline-flex items-center justify-center cursor-help align-middle ml-0.5" aria-label="Medical disclaimer information">
                  <Question size={14} weight="bold" className="opacity-40" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-center">
                <p className="max-w-[240px]">
                  MensFlow is an educational tool. Always consult a healthcare professional for medical advice, diagnosis, or treatment.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="landing-composer-wrap mt-5 sm:mt-7">
          {!suggestionsLoading && suggestions && suggestions.length > 0 && !isTyping && (
            <div className="chat-suggestions-container">
              <div className="chat-suggestions-label">
                <Sparkle size={14} weight="fill" className="text-[var(--mf-accent)]" />
                <span>Suggested Questions</span>
              </div>
              <div className="chat-suggestions-grid">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { hapticSelection(); onSend(s); }}
                    className="chat-suggestion-chip"
                  >
                    <span>{s}</span>
                    <span className="chat-suggestion-icon">
                      <CaretRight size={14} weight="bold" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <ChatComposer
            value={draft}
            onChange={onDraftChange}
            onSubmit={() => onSend()}
            placeholder="Ask MensFlow"
          />
        </div>
      </div>
    </div>
  )
}

function ChatThread({
  messages,
  isTyping,
  suggestions,
  suggestionsLoading,
  draft,
  onSend,
  onDraftChange,
  chatShowTimestamps,
  temporaryChat,
  userXp,
  threadEndRef,
}: {
  messages: Msg[]
  isTyping: boolean
  suggestions: string[] | undefined
  suggestionsLoading: boolean
  draft: string
  onSend: (overrideText?: string) => void
  onDraftChange: (v: string) => void
  chatShowTimestamps: boolean
  temporaryChat: boolean
  userXp: number | undefined
  threadEndRef: React.RefObject<HTMLDivElement | null>
}) {
  return (
    <div className="chat-view">
      {temporaryChat && (
        <output className="chat-temporary-banner chat-thread-spacing">
          <Ghost size={18} weight="duotone" aria-hidden />
          <span>
            Temporary chat - this conversation won&apos;t be saved to history or used to
            improve Ai models.
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="ml-1 p-0.5 hover:bg-black/10 rounded-full transition-colors flex items-center justify-center" aria-label="More information">
                <Question size={14} weight="bold" className="opacity-60" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="max-w-[200px]">
                Temporary chats are private sessions that aren&apos;t saved to your history or used for training.
              </p>
            </TooltipContent>
          </Tooltip>
        </output>
      )}

      {!temporaryChat && (!userXp || userXp < 500) && (
        <output className="chat-temporary-banner chat-thread-spacing bg-amber-500/10 border-amber-500/20 text-[var(--mf-text-strong)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WarningCircle size={18} className="text-amber-500 shrink-0" />
            <span className="text-[11.5px] font-normal">
              Free Tier Chat Limit: Reach 100 XP via daily quizzes to unlock unlimited AI translation. (Current XP: {userXp || 0}/100)
            </span>
          </div>
          <div className="w-24 bg-muted/40 h-1.5 rounded-full overflow-hidden border border-border/20 relative shrink-0">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, ((userXp || 0) / 500) * 100)}%` }}
            />
          </div>
        </output>
      )}

      <div className="chat-thread" role="log" aria-live="polite">
        {messages.map((m) => (
          <div key={m.id} className={`chat-bubble chat-bubble--${m.role}`}>
            <span className="chat-role flex items-center gap-1.5">
              {m.role === 'user' ? 'You' : 'MensFlow'}
              {chatShowTimestamps && (
                <time className="chat-time" dateTime={getIsoString(m.createdAt)} suppressHydrationWarning>
                  {fmtTime(m.createdAt)}
                </time>
              )}
            </span>
            {m.role === 'user' ? (
              <p className="chat-text whitespace-pre-line">{m.text}</p>
            ) : (
              <MarkdownText text={m.text} />
            )}
          </div>
        ))}

        {isTyping && (
          <div className="chat-bubble chat-bubble--assistant animate-pulse duration-1000">
            <span className="chat-role flex items-center gap-1.5">MensFlow</span>
            <div className="flex items-center gap-1.5 py-3 px-1">
              {[0, 150, 300].map((delay) => (
                <m.div
                  key={delay}
                  initial={{ y: 0 }}
                  animate={{ y: [0, -6, 0] }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: [0.16, 1, 0.3, 1],
                    delay: delay / 1000
                  }}
                  className="size-2 rounded-full bg-[var(--mf-accent)]"
                />
              ))}
            </div>
          </div>
        )}

        {!suggestionsLoading && suggestions && suggestions.length > 0 && !isTyping && (
          <div className="chat-suggestions-container mobile-only-suggestions mt-2">
            <div className="chat-suggestions-label">
              <Sparkle size={14} weight="fill" className="text-[var(--mf-accent)]" />
              <span>Suggested Questions</span>
            </div>
            <div className="chat-suggestions-grid">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { hapticSelection(); onSend(s); }}
                  className="chat-suggestion-chip"
                >
                  <span>{s}</span>
                  <span className="chat-suggestion-icon">
                    <CaretRight size={14} weight="bold" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
        <div ref={threadEndRef} />
      </div>

      <div className="chat-composer-dock p-3 bg-background/80 backdrop-blur-md border-t border-border">
        <div className="max-w-[800px] mx-auto w-full">
          {!suggestionsLoading && suggestions && suggestions.length > 0 && !isTyping && (
            <div className="chat-suggestions-container desktop-only-suggestions">
              <div className="chat-suggestions-label">
                <Sparkle size={14} weight="fill" className="text-[var(--mf-accent)]" />
                <span>Suggested Questions</span>
              </div>
              <div className="chat-suggestions-grid">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { hapticSelection(); onSend(s); }}
                    className="chat-suggestion-chip"
                  >
                    <span>{s}</span>
                    <span className="chat-suggestion-icon">
                      <CaretRight size={14} weight="bold" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <ChatComposer
            value={draft}
            onChange={onDraftChange}
            onSubmit={() => onSend()}
            placeholder="Ask MensFlow"
            minimal
            showKeyboardHint
          />
        </div>
      </div>
    </div>
  )
}

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
  const [lockForm, lockDispatch] = useReducer(lockFormReducer, initialLockForm)

  const [draft, setDraft] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const { data: suggestions, isLoading: suggestionsLoading } = useChatSuggestions()

  const unlockedPasscodesRef = useRef<Record<string, string>>({})

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

  useEffect(() => {
    const onClear = () => {
      dispatch({ type: 'CLEAR_SESSION', messages: [{ id: 'welcome', role: 'assistant', text: welcomeText, createdAt: Date.now() }] })
      if (!temporaryChat) fetchSessions()
    }
    window.addEventListener(CLEAR_LOCAL_CHATS_EVENT, onClear)
    return () => window.removeEventListener(CLEAR_LOCAL_CHATS_EVENT, onClear)
  }, [welcomeText, temporaryChat, fetchSessions])

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
