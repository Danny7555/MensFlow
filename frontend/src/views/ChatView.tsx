import { useCallback, useEffect, useRef, useState } from 'react'
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

type Msg = {
  id: string
  role: 'user' | 'assistant'
  text: string
  createdAt: number
}

export function ChatView({ showOnlyLocked = false, privacyPassword }: { showOnlyLocked?: boolean; privacyPassword?: string }) {
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
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > 768
    }
    return true
  })

  const [messages, setMessages] = useState<Msg[]>([])
  const [draft, setDraft] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { data: suggestions, isLoading: suggestionsLoading } = useChatSuggestions()

  const [unlockedPasscodes, setUnlockedPasscodes] = useState<Record<string, string>>({})
  const [lockedSessionToUnlock, setLockedSessionToUnlock] = useState<{
    sessionId: string
    securityQuestion: string | null
    error?: string
  } | null>(null)

  const [permanentUnlockSessionId, setPermanentUnlockSessionId] = useState<string | null>(null)
  const [permanentUnlockPasscode, setPermanentUnlockPasscode] = useState('')
  const [isLockingSession, setIsLockingSession] = useState(false)

  const [lockSetupSessionId, setLockSetupSessionId] = useState<string | null>(null)
  const [lockSetupPasscode, setLockSetupPasscode] = useState('')
  const [lockSetupQuestionId, setLockSetupQuestionId] = useState(SECURITY_QUESTIONS[0].id)
  const [lockSetupAnswer, setLockSetupAnswer] = useState('')
  const [isSettingUpLock, setIsSettingUpLock] = useState(false)

  const generateNewSessionId = () => `chat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

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
        setActiveSessionId(null)
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          text: welcomeText,
          createdAt: Date.now(),
        }])
        setIsLoading(false)
      }, 0)
      return () => clearTimeout(timer)
    }

    const loadingTimer = setTimeout(() => setIsLoading(true), 0)
    fetchSessions()
      .then((data) => {
        const isLocked = showOnlyLockedRef.current
        const filtered = isLocked ? data?.filter(s => s.isLocked) : data
        if (filtered && filtered.length > 0) {
          setActiveSessionId(filtered[0].sessionId)
        } else {
          setActiveSessionId(isLocked ? null : generateNewSessionId())
        }
      })
      .finally(() => {
        clearTimeout(loadingTimer)
        setIsLoading(false)
      })
  }, [temporaryChat, fetchSessions, welcomeText])

  useEffect(() => {
    if (temporaryChat) {
      const timer = setTimeout(() => {
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          text: welcomeText,
          createdAt: Date.now(),
        }])
        setIsLoading(false)
      }, 0)
      return () => clearTimeout(timer)
    }

    if (!activeSessionId) return

    const existingSession = sessions.find((s) => s.sessionId === activeSessionId)
    if (!existingSession || existingSession.messageCount === 0) {
      const timer = setTimeout(() => {
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          text: welcomeText,
          createdAt: Date.now(),
        }])
        setIsLoading(false)
      }, 0)
      return () => clearTimeout(timer)
    }

    const timer = setTimeout(() => {
      setIsLoading(true)
      const passcode = unlockedPasscodes[activeSessionId] ?? privacyPassword
      chatApi.getMessages(activeSessionId, passcode)
        .then((history) => {
          if (history.length > 0) {
            setMessages(history)
          } else {
            setMessages([{
              id: 'welcome',
              role: 'assistant',
              text: welcomeText,
              createdAt: Date.now(),
            }])
          }
          if (!unlockedPasscodes[activeSessionId] && privacyPassword) {
            setUnlockedPasscodes((prev) => ({ ...prev, [activeSessionId]: privacyPassword }))
          }
          setLockedSessionToUnlock(null)
        })
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : 'Failed to load chat history'
          if (msg.toLowerCase().includes('locked')) {
            setLockedSessionToUnlock({
              sessionId: activeSessionId,
              securityQuestion: existingSession.securityQuestion,
            })
          } else {
            toast.error(msg)
          }
        })
        .finally(() => {
          setIsLoading(false)
        })
    }, 0)
    return () => clearTimeout(timer)
  }, [activeSessionId, temporaryChat, welcomeText, unlockedPasscodes])

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
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        text: welcomeText,
        createdAt: Date.now(),
      }])
      if (!temporaryChat) {
        fetchSessions()
      }
    }
    window.addEventListener(CLEAR_LOCAL_CHATS_EVENT, onClear)
    return () => window.removeEventListener(CLEAR_LOCAL_CHATS_EVENT, onClear)
  }, [welcomeText, temporaryChat, fetchSessions])

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const fmtTime = (t: number) => {
    const d = new Date(t)
    let hours = d.getHours()
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12
    hours = hours ? hours : 12
    return `${hours}:${minutes} ${ampm}`
  }

  const getIsoString = (t: number) => {
    return new Date(t).toISOString()
  }

  const send = async (overrideText?: string) => {
    const text = (overrideText || draft).trim()
    if (!text || isTyping) return

    const uid = `u-${Date.now()}`
    const now = Date.now()

    setMessages((m) => [
      ...m,
      { id: uid, role: 'user', text, createdAt: now }
    ])

    if (!overrideText) setDraft('')
    setIsTyping(true)

    if (temporaryChat) {
      setTimeout(() => {
        const aid = `a-${Date.now()}`
        const aiResponse = generateAIResponse(text, user.name, currentDay, data.phaseLabel, todaySymptoms, user.role)

        setMessages((m) => [
          ...m,
          {
            id: aid,
            role: 'assistant',
            text: aiResponse,
            createdAt: Date.now(),
          }
        ])
        setIsTyping(false)
      }, 1500)
    } else {
      const isNew = !activeSessionId
      const sid = activeSessionId || generateNewSessionId()

      try {
        const passcode = unlockedPasscodes[sid]
        const result = await chatApi.send(sid, text, passcode)

        if (isNew) {
          setActiveSessionId(sid)
        }

        setMessages((m) => [
          ...m,
          {
            id: result.assistantMessage.id,
            role: result.assistantMessage.role,
            text: result.assistantMessage.text,
            createdAt: result.assistantMessage.createdAt,
          }
        ])
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
    if (temporaryChat) {
      setTemporaryChat(false)
    }
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setIsSidebarOpen(false)
    }
    if (activeSessionId === sessionId) return
    setActiveSessionId(sessionId)
    setLockedSessionToUnlock(null)
  }

  const startNewChat = () => {
    if (temporaryChat) {
      setTemporaryChat(false)
    }
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setIsSidebarOpen(false)
    }
    const newId = generateNewSessionId()
    setActiveSessionId(newId)
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      text: welcomeText,
      createdAt: Date.now(),
    }])
    setLockedSessionToUnlock(null)
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

          if (activeSessionId === sessionId) {
            const remaining = (showOnlyLocked ? sessions.filter(s => s.isLocked) : sessions).filter((s) => s.sessionId !== sessionId)
            if (remaining.length > 0) {
              setActiveSessionId(remaining[0].sessionId)
            } else {
              setActiveSessionId(showOnlyLocked ? null : generateNewSessionId())
            }
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
    if (isLockingSession || isSettingUpLock) return

    if (rawPrivacyLockChats) {
      setIsLockingSession(true)
      try {
        await chatApi.lock(sessionId)
        toast.success('Chat locked!')
        setSessions((prev) => prev.map((s) => s.sessionId === sessionId ? { ...s, isLocked: true } : s))
        if (activeSessionId === sessionId) {
          setActiveSessionId(generateNewSessionId())
          setMessages([{ id: 'welcome', role: 'assistant', text: welcomeText, createdAt: Date.now() }])
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Failed to lock session')
      } finally {
        setIsLockingSession(false)
      }
      return
    }

    setLockSetupSessionId(sessionId)
    setLockSetupPasscode('')
    setLockSetupQuestionId(SECURITY_QUESTIONS[0].id)
    setLockSetupAnswer('')
  }

  const handleLockSetupSubmit = async () => {
    if (!lockSetupSessionId || !lockSetupPasscode.trim()) return
    setIsSettingUpLock(true)
    try {
      const activeQuestion = SECURITY_QUESTIONS.find(q => q.id === lockSetupQuestionId)!
      await chatApi.lock(lockSetupSessionId, lockSetupPasscode, activeQuestion.label, lockSetupAnswer)
      toast.success('Chat locked!')
      setSessions((prev) => prev.map((s) => s.sessionId === lockSetupSessionId ? { ...s, isLocked: true } : s))
      if (activeSessionId === lockSetupSessionId) {
        setActiveSessionId(generateNewSessionId())
        setMessages([{ id: 'welcome', role: 'assistant', text: welcomeText, createdAt: Date.now() }])
      }
      setLockSetupSessionId(null)
      setLockSetupPasscode('')
      setLockSetupAnswer('')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to lock session')
    } finally {
      setIsSettingUpLock(false)
    }
  }

  const handlePermanentUnlock = async () => {
    if (!permanentUnlockSessionId) return
    try {
      await chatApi.unlockPermanent(permanentUnlockSessionId, permanentUnlockPasscode || undefined)
      toast.success('Chat is now public again!')
      setSessions((prev) => prev.map((s) => s.sessionId === permanentUnlockSessionId ? { ...s, isLocked: false } : s))
      setUnlockedPasscodes((prev) => { const next = { ...prev }; delete next[permanentUnlockSessionId]; return next })
      setPermanentUnlockSessionId(null)
      setPermanentUnlockPasscode('')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Incorrect passcode, try again.')
    }
  }

  const handleUnlockSubmit = async (passcode: string, isSecurityReset: boolean, securityAnswer: string) => {
    if (!lockedSessionToUnlock) return
    const sid = lockedSessionToUnlock.sessionId

    try {
      if (isSecurityReset) {
        if (!securityAnswer.trim()) {
          toast.error('Security answer is required')
          return
        }
        const res = await chatApi.unlock(sid, undefined, securityAnswer)
        if (res.success && res.passcode) {
          toast.success(`Passcode retrieved! Unlocking chat.`)
          setUnlockedPasscodes((prev) => ({ ...prev, [sid]: res.passcode! }))
          setLockedSessionToUnlock(null)
        } else if (res.success) {
          toast.success('Security answer verified. Chat unlocked.')
          setLockedSessionToUnlock(null)
        }
      } else {
        if (!passcode.trim()) {
          toast.error('Passcode is required')
          return
        }
        const res = await chatApi.unlock(sid, passcode)
        if (res.success) {
          toast.success('Chat unlocked')
          setUnlockedPasscodes((prev) => ({ ...prev, [sid]: passcode }))
          setLockedSessionToUnlock(null)
        }
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Verification failed')
    }
  }

  const getCurrentChatTitle = () => {
    if (temporaryChat) return 'Temporary Chat'
    if (!activeSessionId) return 'New Chat'
    const active = sessions.find((s) => s.sessionId === activeSessionId)
    return active ? active.title : 'New Conversation'
  }

  const isInitialState = messages.length <= 1 && messages[0]?.id === 'welcome'

  if (isLoading) {
    return <ChatSkeleton />
  }

  return (
    <div className="chat-layout-container">
      <ChatSidebar
        sessions={filteredSessions}
        activeSessionId={activeSessionId}
        isOpen={isSidebarOpen}
        showOnlyLocked={showOnlyLocked}
        onSessionClick={handleSessionClick}
        onNewChat={startNewChat}
        onClose={() => setIsSidebarOpen(false)}
        onLock={openLockModal}
        onDelete={deleteSession}
      />

      <div className="chat-main-content">
        <div className="chat-header-bar">
          <div className="chat-header-left">
            <button
              type="button"
              className="chat-toggle-sidebar-btn active-squish"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              <SidebarSimple size={20} />
            </button>
            <span className="chat-header-title">
              {getCurrentChatTitle()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {activeSessionId && !sessions.find((s) => s.sessionId === activeSessionId)?.isLocked && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg h-8 text-xs gap-1.5"
                onClick={(e) => openLockModal(activeSessionId, e)}
                disabled={isLockingSession || isSettingUpLock}
              >
                <Lock size={14} />
                {isLockingSession ? 'Locking…' : 'Lock Chat'}
              </Button>
            )}
            {activeSessionId && sessions.find((s) => s.sessionId === activeSessionId)?.isLocked && (
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
                  onClick={() => {
                    setPermanentUnlockSessionId(activeSessionId)
                    setPermanentUnlockPasscode('')
                  }}
                >
                  <LockOpen size={14} />
                  Unlock
                </Button>
              </div>
            )}
          </div>
        </div>

        {temporaryChat && (
          <div className="mx-4 mt-3 rounded-xl border border-[var(--mf-border)] bg-[var(--mf-card)] px-4 py-2 text-[11px] leading-relaxed text-muted-foreground">
            Temporary chat can use what you say in this thread to answer better, but it will not save messages or update dashboard data. Switch to a saved chat when you want cycle details from the conversation to populate your profile.
          </div>
        )}

        {lockedSessionToUnlock ? (
          <ChatLockScreen
            unlockInfo={lockedSessionToUnlock}
            onSubmit={handleUnlockSubmit}
          />
        ) : showOnlyLocked && filteredSessions.length === 0 ? (
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
        ) : isInitialState ? (
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-5 flex flex-col">
            <div className="landing-center animate-in fade-in zoom-in duration-700 w-full mx-auto my-auto">
              <div className="landing-hero-image-wrap">
                <div className="landing-hero-glow" />
                <img loading="lazy" src="/images/lady.jpg" alt="" className="landing-hero-image" />
              </div>
              <div className="w-full max-w-[500px] mx-auto space-y-1 sm:space-y-1.5">
                <h1 className="landing-title">Ask MensFlow about your cycle?</h1>
                <p className="landing-sub">
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
                </p>
              </div>

              <div className="landing-composer-wrap mt-5 sm:mt-7">
                {!suggestionsLoading && suggestions && suggestions.length > 0 && !isTyping && !isLoading && (
                  <div className="chat-suggestions-container">
                    <div className="chat-suggestions-label">
                      <Sparkle size={14} weight="fill" className="text-[var(--mf-accent)]" />
                      <span>Suggested Questions</span>
                    </div>
                    <div className="chat-suggestions-grid">
                      {suggestions.map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => send(s)}
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
                  onChange={setDraft}
                  onSubmit={() => send()}
                  placeholder="Ask MensFlow"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="chat-view">
            {temporaryChat && (
              <div className="chat-temporary-banner chat-thread-spacing" role="status">
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
              </div>
            )}

            {!temporaryChat && (!user.xp || user.xp < 500) && (
              <div className="chat-temporary-banner chat-thread-spacing bg-amber-500/10 border-amber-500/20 text-[var(--mf-text-strong)] flex items-center justify-between" role="status">
                <div className="flex items-center gap-2">
                  <WarningCircle size={18} className="text-amber-500 shrink-0" />
                  <span className="text-[11.5px] font-normal">
                    Free Tier Chat Limit: Reach 100 XP via daily quizzes to unlock unlimited AI translation. (Current XP: {user.xp || 0}/100)
                  </span>
                </div>
                <div className="w-24 bg-muted/40 h-1.5 rounded-full overflow-hidden border border-border/20 relative shrink-0">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, ((user?.xp || 0) / 500) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            <div className="chat-thread" role="log" aria-live="polite">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`chat-bubble chat-bubble--${m.role}`}
                >
                  <span className="chat-role flex items-center gap-1.5">
                    {m.role === 'user' ? 'You' : 'MensFlow'}
                    {chatShowTimestamps && (
                      <time
                        className="chat-time"
                        dateTime={getIsoString(m.createdAt)}
                        suppressHydrationWarning
                      >
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
                  <span className="chat-role flex items-center gap-1.5">
                    MensFlow
                  </span>
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

              {!suggestionsLoading && suggestions && suggestions.length > 0 && !isTyping && !isLoading && (
                <div className="chat-suggestions-container mobile-only-suggestions mt-2">
                  <div className="chat-suggestions-label">
                    <Sparkle size={14} weight="fill" className="text-[var(--mf-accent)]" />
                    <span>Suggested Questions</span>
                  </div>
                  <div className="chat-suggestions-grid">
                    {suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => send(s)}
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
                {!suggestionsLoading && suggestions && suggestions.length > 0 && !isTyping && !isLoading && (
                  <div className="chat-suggestions-container desktop-only-suggestions">
                    <div className="chat-suggestions-label">
                      <Sparkle size={14} weight="fill" className="text-[var(--mf-accent)]" />
                      <span>Suggested Questions</span>
                    </div>
                    <div className="chat-suggestions-grid">
                      {suggestions.map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => send(s)}
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
                  onChange={setDraft}
                  onSubmit={() => send()}
                  placeholder="Ask MensFlow"
                  minimal
                  showKeyboardHint
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {permanentUnlockSessionId && (
        <PermanentUnlockModal
          sessionId={permanentUnlockSessionId}
          passcode={permanentUnlockPasscode}
          onPasscodeChange={setPermanentUnlockPasscode}
          onConfirm={handlePermanentUnlock}
          onCancel={() => { setPermanentUnlockSessionId(null); setPermanentUnlockPasscode('') }}
        />
      )}

      {lockSetupSessionId && (
        <LockSetupModal
          passcode={lockSetupPasscode}
          isLocking={isSettingUpLock}
          questionId={lockSetupQuestionId}
          answer={lockSetupAnswer}
          onPasscodeChange={setLockSetupPasscode}
          onQuestionChange={setLockSetupQuestionId}
          onAnswerChange={setLockSetupAnswer}
          onSubmit={handleLockSetupSubmit}
          onCancel={() => setLockSetupSessionId(null)}
        />
      )}
    </div>
  )
}
