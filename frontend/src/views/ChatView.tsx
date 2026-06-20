/* eslint-disable */
import { useCallback, useEffect, useRef, useState } from 'react'
import { m } from 'framer-motion'
import { 
  Ghost, 
  Question, 
  Lock, 
  LockOpen,
  LockKey,
  ShieldCheck,
  Trash, 
  SidebarSimple, 
  X, 
  ChatCircle, 
  Plus,
  Sparkle,
  WarningCircle,
  CaretRight 
} from '@phosphor-icons/react'
import { ChatComposer } from '../components/ChatComposer'
import { useChatSession } from '../context/useChatSession'
import { useStore } from '../store/useStore'
import { CLEAR_LOCAL_CHATS_EVENT } from '../lib/constants'
import { Tooltip, TooltipContent, TooltipTrigger } from '../components/ui/tooltip'
import { ChatSkeleton } from '../components/skeletons/ChatSkeleton'
import { SYMPTOM_DEFS } from '../data/symptomsData'
import { chatApi, type ApiChatSession, useChatSuggestions } from '../services/chatService'
import { userApi } from '../services/userService'
import { toast } from 'sonner'
import { cn } from '../lib/utils'
import { computeCycleDay } from '../lib/cycleUtils'
import { MarkdownText } from '../components/MarkdownText'
import { SECURITY_QUESTIONS } from '../lib/constants'
import { getPasswordStrength } from '../lib/passwordStrength'
import { Button } from '@/components/ui/button'

type Msg = {
  id: string
  role: 'user' | 'assistant'
  text: string
  createdAt: number
}

function generateAIResponse(
  userPrompt: string, 
  targetName: string, 
  currentDay: number, 
  phase: string, 
  todaySymptoms: string[],
  userRole?: 'lady' | 'partner'
): string {
  const prompt = userPrompt.toLowerCase()
  const hasSymptom = (keyword: string) => prompt.includes(keyword)
  const isPartnerView = userRole === 'partner'
  const subject = isPartnerView ? (targetName || 'your partner') : 'you'
  const possessive = isPartnerView ? 'her' : 'your'
  const loggedText = isPartnerView ? 'she has' : 'you have'

  // Normalize phase name
  const phaseNormalized = (phase || '').toLowerCase()
  const isLuteal = phaseNormalized.includes('luteal')
  const isMenstrual = phaseNormalized.includes('menstrual')
  const isFertile = phaseNormalized.includes('ovulatory') || phaseNormalized.includes('fertile')

  let response = ""

  // 1. Cramps / Pain
  if (hasSymptom('cramp') || hasSymptom('pain') || hasSymptom('hurt')) {
    response += `Physical discomfort and cramps on Day ${currentDay} of the cycle are very common, especially during the Menstrual phase when uterine contractions occur to shed the lining. `
    if (isMenstrual) {
      response += isPartnerView
        ? `Since ${subject} is currently in her **Menstrual Phase**, her body is working hard. Prepare a warm water bottle or heating pad, offer ginger or chamomile tea, and keep the evening low-pressure. `
        : `Since you are currently in your **Menstrual Phase**, your body is working hard. Try a heating pad, warm fluids like ginger or chamomile tea, and lower-pressure plans today. `
    } else if (isLuteal) {
      response += isPartnerView
        ? `As ${subject} is in her **Luteal Phase**, premenstrual cramping can begin as prostaglandins rise. Warmth, light stretching, magnesium-rich foods, and quiet rest can help. `
        : `As you are in your **Luteal Phase**, premenstrual cramping can begin as prostaglandins rise. Warmth, light stretching, magnesium-rich foods, and quiet rest can help. `
    } else {
      response += isPartnerView
        ? `Since she is not in her period, this could be minor ovulation pain if she is near mid-cycle, or mild tension. Gentle warmth and hydration are good first steps. `
        : `Since you are not in your period, this could be minor ovulation pain if you are near mid-cycle, or mild tension. Gentle warmth and hydration are good first steps. `
    }
    response += isPartnerView
      ? `Taking over a practical task so she can rest without asking may help a lot.`
      : `If pain is severe, unusual, or worsening, consider checking in with a clinician.`
  }
  // 2. Food / Cook / Cravings
  else if (hasSymptom('food') || hasSymptom('eat') || hasSymptom('cook') || hasSymptom('dinner') || hasSymptom('crave') || hasSymptom('chocolate')) {
    response += `Nutrition plays a major role in hormone balance! `
    if (isMenstrual) {
      response += `For the **Menstrual Phase**, ${possessive} body may benefit from warm, nutrient-dense foods, iron-rich meals, hydration, and magnesium-rich snacks. `
    } else if (isLuteal) {
      response += `During the **Luteal Phase**, cravings and appetite can rise. Slow-burning carbs, protein, healthy fats, and steady meals can reduce blood-sugar dips. `
    } else if (isFertile) {
      response += `In the **Ovulatory Phase**, fresh meals with fiber, lean protein, and colorful vegetables can support energy and estrogen metabolism. `
    } else {
      response += `For the **Follicular Phase**, lighter meals, bright produce, protein, and hydration can match rising energy. `
    }
  }
  // 3. Tired / Sleep / Energy / Exhausted
  else if (hasSymptom('tired') || hasSymptom('exhaust') || hasSymptom('energy') || hasSymptom('sleep') || hasSymptom('lazy')) {
    response += `Low energy and fatigue are highly correlated with hormonal shifts. `
    if (isLuteal) {
      response += `In the **Luteal Phase**, progesterone can feel sedating and may raise body temperature, which can affect sleep. A cooler room, earlier wind-down, and gentler expectations can help. `
    } else if (isMenstrual) {
      response += isPartnerView
        ? `During the **Menstrual Phase**, low hormone levels and active bleeding can drain energy. Help by reducing demands and taking over practical tasks.`
        : `During the **Menstrual Phase**, low hormone levels and active bleeding can drain energy. Give yourself permission to reduce demands and rest more.`
    } else {
      response += `If fatigue shows up outside the lower-energy phases, it may point to sleep debt, stress, hydration, food timing, or illness. Gentle movement and consistent rest are good first checks. `
    }
  }
  // 4. Mood / Sad / Angry / Irritable / Cry
  else if (hasSymptom('mood') || hasSymptom('sad') || hasSymptom('angry') || hasSymptom('cry') || hasSymptom('irritable') || hasSymptom('pms') || hasSymptom('space')) {
    response += `Emotions are deeply tied to neuro-chemical sensitivities. `
    if (isLuteal) {
      response += isPartnerView
        ? `This is the **Luteal Phase** (Day ${currentDay}), a common window for premenstrual mood shifts. Respond gently, avoid taking irritability personally, and offer space or reassurance based on what she prefers. `
        : `You are in the **Luteal Phase** (Day ${currentDay}), a common window for premenstrual mood shifts. Try lowering stimulation, naming what you need, and giving yourself extra margin. `
    } else if (isMenstrual) {
      response += `In the **Menstrual Phase**, pain and low hormones can make emotions feel closer to the surface. Validation, warmth, and less pressure are useful. `
    } else {
      response += `Hormones may be more stable or rising now, so sudden emotional dips can also come from stress, sleep, food timing, or overwhelm. `
    }
  }
  // 5. How to support / What to do / Help
  else if (hasSymptom('support') || hasSymptom('help') || hasSymptom('do') || hasSymptom('care')) {
    response += isPartnerView
      ? `The best way to support ${subject} depends on her active phase (currently **${phase}**, Day ${currentDay}):\n\n`
      : `The best self-care plan depends on your active phase (currently **${phase}**, Day ${currentDay}):\n\n`
    if (isMenstrual) {
      response += `1. **Warm Comfort:** Use heat, warm drinks, and comfortable clothing.\n`
      response += `2. **Lower the Load:** Reduce demanding plans where possible.\n`
      response += `3. **Track Signals:** Log flow, cramps, fatigue, and mood for better predictions.`
    } else if (isLuteal) {
      response += `1. **Sensory Comfort:** Dim lights, keep evenings calmer, and cool the bedroom.\n`
      response += `2. **Steady Food:** Add protein, complex carbs, and magnesium-rich snacks.\n`
      response += `3. **Protect Energy:** Avoid overcommitting and track PMS patterns.`
    } else if (isFertile) {
      response += `1. **Use Momentum:** Plan social, creative, or active tasks if energy feels high.\n`
      response += `2. **Confirm Ovulation Cues:** Track LH or cervical mucus if relevant.\n`
      response += `3. **Stay Grounded:** Hydrate and avoid overloading the schedule.`
    } else {
      response += `1. **Build Rhythm:** Use rising energy for planning, errands, or light movement.\n`
      response += `2. **Try New Things:** This can be a good time for fresh routines.\n`
      response += `3. **Keep Logging:** Record mood and energy as the baseline improves.`
    }
  }
  // 6. Phase / Cycle questions
  else if (hasSymptom('phase') || hasSymptom('cycle') || hasSymptom('current')) {
    response += isPartnerView
      ? `Based on the latest logs, ${subject} is on **Day ${currentDay}** of her cycle, which places her in the **${phase}**. `
      : `Based on your latest logs, you are on **Day ${currentDay}** of your cycle, which places you in the **${phase}**. `
    if (isMenstrual) {
      response += `The Menstrual Phase is characterized by the shedding of the uterine lining, low hormone baselines, and a clear need for physical restoration and warmth.`
    } else if (isLuteal) {
      response += `The Luteal Phase is the nesting phase. High progesterone prepares the body for potential pregnancy, naturally slowing her digestive system and reducing serotonin, leading to nesting behaviors, sleepiness, and cravings.`
    } else if (isFertile) {
      response += `The Ovulatory Phase is the high-energy peak of the cycle. Peak estrogen and testosterone drive high confidence, communication skills, and social openness.`
    } else {
      response += `The Follicular Phase is the renewal phase. Estrogen is rising, which starts to lift her fatigue and steadily increases mental focus and physical energy.`
    }
  }
  // 7. General fallback
  else {
    response += isPartnerView
      ? `Hi! I'm MensFlow, your empathetic relationship translator. Currently, ${subject} is on **Day ${currentDay}** of her cycle (**${phase}**). `
      : `Hi! I'm MensFlow, your cycle support companion. You are currently on **Day ${currentDay}** of your cycle (**${phase}**). `
    if (todaySymptoms.length > 0) {
      response += `Today, ${loggedText} logged: **${todaySymptoms.join(', ')}**. `
      response += isPartnerView
        ? `These logs are useful clues. Focus on comfort, practical support, and asking what would help most. `
        : `These logs are useful clues. Focus on comfort, realistic plans, hydration, and tracking what changes. `
    } else {
      response += isPartnerView
        ? `She has not logged symptoms yet today. A gentle check-in can help. `
        : `You have not logged symptoms yet today. A quick check-in can make today's guidance more accurate. `
    }
    response += isPartnerView
      ? `Ask me about cramps, food cravings, fatigue, or how to support her today.`
      : `Ask me about cramps, food cravings, fatigue, cycle phase, or what to log today.`
  }

  return makeFriendlyShortResponse(response)
}

function makeFriendlyShortResponse(response: string): string {
  const cleaned = response.replace(/\s+/g, ' ').trim()
  const sentences = cleaned.match(/[^.!?]+[.!?]+/g) ?? [cleaned]
  const short = sentences.slice(0, 3).join(' ').trim()
  const withEmoji = /[\u{1F300}-\u{1FAFF}]/u.test(short) ? short : `🌸 ${short}`
  return withEmoji.length > 520 ? `${withEmoji.slice(0, 500).trim()}...` : withEmoji
}




export function ChatView({ showOnlyLocked = false, privacyPassword }: { showOnlyLocked?: boolean; privacyPassword?: string }) {
  const { temporaryChat, setTemporaryChat } = useChatSession()
  const { chatShowTimestamps, privacyLockChats: rawPrivacyLockChats } = useStore((state) => state.settings)
  const { dashboard: data, user, logs, customSymptoms, showConfirm, hydrate, fetchLogs } = useStore()

  const threadEndRef = useRef<HTMLDivElement>(null)
  // Capture the static prop in a ref so the initial-load effect doesn't
  // re-derive state from a changing prop (fixes react-doctor no-adjust-state-on-prop-change)
  const showOnlyLockedRef = useRef(showOnlyLocked)

  // Compute active cycle day from store data (computeCycleDay handles Date.now internally)
  const currentDay = computeCycleDay(data.lastPeriodStart, data.typicalCycleDays)

  const welcomeText = user.role === 'partner'
    ? `Hi - I'm MensFlow, your partner support companion. Currently, ${user.name || 'your partner'} is on Day ${currentDay} of her cycle (${data.phaseLabel}). Ask me about her active phase, logged symptoms, supportive gestures, or care ideas for today. `
    : `Hi - I'm MensFlow, your cycle support companion. You are on Day ${currentDay} of your cycle (${data.phaseLabel}). Ask me about your active phase, symptoms, food, rest, what to log, or how to care for yourself today. `

  const [sessions, setSessions] = useState<ApiChatSession[]>([])
  // In normal mode: hide locked chats (they live in the Locked Chats view).
  // In locked mode: show only locked chats.
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

  // Lock & Unlock States
  const [unlockedPasscodes, setUnlockedPasscodes] = useState<Record<string, string>>({})
  const [lockedSessionToUnlock, setLockedSessionToUnlock] = useState<{
    sessionId: string
    securityQuestion: string | null
    error?: string
  } | null>(null)
  const [unlockPasscodeVal, setUnlockPasscodeVal] = useState('')
  const [unlockSecurityAnsVal, setUnlockSecurityAnsVal] = useState('')
  const [showSecurityQuestionReset, setShowSecurityQuestionReset] = useState(false)

  // Permanent-unlock state
  const [permanentUnlockSessionId, setPermanentUnlockSessionId] = useState<string | null>(null)
  const [permanentUnlockPasscode, setPermanentUnlockPasscode] = useState('')
  const [isLockingSession, setIsLockingSession] = useState(false)

  // Lock-setup state (when no global privacy password exists)
  const [lockSetupSessionId, setLockSetupSessionId] = useState<string | null>(null)
  const [lockSetupPasscode, setLockSetupPasscode] = useState('')
  const [lockSetupQuestionId, setLockSetupQuestionId] = useState(SECURITY_QUESTIONS[0].id)
  const [lockSetupAnswer, setLockSetupAnswer] = useState('')
  const [isSettingUpLock, setIsSettingUpLock] = useState(false)

  const generateNewSessionId = () => `chat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

  // Fetch session history list on mount
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

  // 1. Initial Load of Sessions
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  // 2. Load messages for activeSessionId
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
      // Use per-session unlocked passcode, or fall back to the view-level privacyPassword (from LockedChatsView)
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
          // If unlocked via privacyPassword, track that passcode
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

  // Handle setting clear local chats
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


  // Auto scroll effect
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
    
    // eslint-disable-next-line react-hooks/purity
    const uid = `u-${Date.now()}`
    // eslint-disable-next-line react-hooks/purity
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

  // Session Actions
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
    setShowSecurityQuestionReset(false)
    setUnlockPasscodeVal('')
    setUnlockSecurityAnsVal('')
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
    setShowSecurityQuestionReset(false)
    setUnlockPasscodeVal('')
    setUnlockSecurityAnsVal('')
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

  // Lock Actions
  const openLockModal = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (isLockingSession || isSettingUpLock) return

    // If global privacy password is set, one-click lock
    if (rawPrivacyLockChats) {
      setIsLockingSession(true)
      try {
        await chatApi.lock(sessionId) // backend reads settings credentials
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

    // No global password — show lock-setup modal with passcode/security question
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

  // Permanent unlock — remove password protection entirely
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

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lockedSessionToUnlock) return
    const sid = lockedSessionToUnlock.sessionId

    try {
      if (showSecurityQuestionReset) {
        if (!unlockSecurityAnsVal.trim()) {
          toast.error('Security answer is required')
          return
        }
        const res = await chatApi.unlock(sid, undefined, unlockSecurityAnsVal)
        if (res.success && res.passcode) {
          toast.success(`Passcode retrieved! Unlocking chat.`)
          setUnlockedPasscodes((prev) => ({ ...prev, [sid]: res.passcode! }))
          setLockedSessionToUnlock(null)
          setUnlockPasscodeVal('')
          setUnlockSecurityAnsVal('')
          setShowSecurityQuestionReset(false)
        } else if (res.success) {
          toast.success('Security answer verified. Chat unlocked.')
          setLockedSessionToUnlock(null)
          setUnlockPasscodeVal('')
          setUnlockSecurityAnsVal('')
          setShowSecurityQuestionReset(false)
        }
      } else {
        if (!unlockPasscodeVal.trim()) {
          toast.error('Passcode is required')
          return
        }
        const res = await chatApi.unlock(sid, unlockPasscodeVal)
        if (res.success) {
          toast.success('Chat unlocked')
          setUnlockedPasscodes((prev) => ({ ...prev, [sid]: unlockPasscodeVal }))
          setLockedSessionToUnlock(null)
          setUnlockPasscodeVal('')
          setUnlockSecurityAnsVal('')
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
      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 1. Left Sidebar for Chat History */}
      <aside className={cn("chat-sidebar-wrapper", !isSidebarOpen && "collapsed")}>
        {!showOnlyLocked && (
          <div className="chat-sidebar-header flex items-center justify-between gap-2">
            <button
              type="button"
              className="chat-new-btn active-squish flex-1"
              onClick={startNewChat}
            >
              <Plus size={16} weight="bold" />
              <span>New Chat</span>
            </button>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-xl transition-all"
              title="Close Menu"
            >
              <X size={18} weight="bold" />
            </button>
          </div>
        )}

        <div className="chat-sessions-list scrollbar-hide">
          <div className="text-[10px] text-muted-foreground uppercase font-semibold px-2 mb-2 tracking-wider">
            Recent Chats
          </div>
          {filteredSessions.length === 0 ? (
            <div className="text-xs text-muted-foreground px-2 py-4 italic">
              No recent chats
            </div>
          ) : (
            filteredSessions.map((s) => (
              <div
                key={s.sessionId}
                className={cn(
                  "chat-session-item",
                  activeSessionId === s.sessionId && "active"
                )}
                onClick={() => handleSessionClick(s.sessionId)}
              >
                <div className="chat-session-left">
                  {s.isLocked ? (
                    <Lock size={16} className="text-amber-500 shrink-0" />
                  ) : (
                    <ChatCircle size={16} className="opacity-70 shrink-0" />
                  )}
                  <span className="chat-session-title">
                    {s.title}
                  </span>
                </div>
                
                <div className="chat-session-actions">
                  {!s.isLocked && (
                    <button
                      type="button"
                      className="chat-session-action-btn"
                      title="Lock Chat"
                      onClick={(e) => openLockModal(s.sessionId, e)}
                    >
                      <Lock size={14} />
                    </button>
                  )}
                  <button
                    type="button"
                    className="chat-session-action-btn"
                    title="Delete Chat"
                    onClick={(e) => deleteSession(s.sessionId, e)}
                  >
                    <Trash size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* 2. Main Chat Area */}
      <div className="chat-main-content">
        {/* Chat Header Bar */}
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

        {/* Chat Content Body */}
        {lockedSessionToUnlock ? (
          /* Render Lock Screen */
          <div className="chat-lock-screen">
            <form className="chat-lock-card animate-in fade-in zoom-in-95 duration-300" onSubmit={handleUnlockSubmit}>
              <div className="chat-lock-icon-wrap">
                <Lock size={28} weight="fill" />
              </div>
              <h2 className="font-semibold text-lg text-[var(--mf-text-strong)]">
                {showSecurityQuestionReset ? "Unlock via Question" : "This chat is locked"}
              </h2>
              <p className="text-xs text-muted-foreground -mt-1 max-w-[280px]">
                {showSecurityQuestionReset 
                  ? "Answer the security question to retrieve your passcode."
                  : "Enter the passcode to view and continue this conversation."}
              </p>

              <div className="chat-lock-inputs">
                {showSecurityQuestionReset ? (
                  <>
                    <div className="text-xs font-medium text-[var(--mf-text)] mb-0.5">
                      Question: <span className="text-muted-foreground font-normal italic">{lockedSessionToUnlock.securityQuestion}</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Enter security answer"
                      className="chat-lock-input"
                      value={unlockSecurityAnsVal}
                      onChange={(e) => setUnlockSecurityAnsVal(e.target.value)}
                      required
                      autoFocus
                    />
                  </>
                ) : (
                  <input
                    type="password"
                    placeholder="Enter passcode"
                    className="chat-lock-input"
                    value={unlockPasscodeVal}
                    onChange={(e) => setUnlockPasscodeVal(e.target.value)}
                    required
                    autoFocus
                  />
                )}
              </div>

              <Button
                type="submit"
                className="w-full rounded-xl h-11 text-sm font-medium"
                disabled={showSecurityQuestionReset ? !unlockSecurityAnsVal.trim() : !unlockPasscodeVal.trim()}
              >
                {showSecurityQuestionReset ? "Retrieve Passcode" : "Unlock Chat"}
              </Button>

              {lockedSessionToUnlock?.securityQuestion && (
                <button
                  type="button"
                  className="chat-lock-forgot"
                  onClick={() => setShowSecurityQuestionReset(!showSecurityQuestionReset)}
                >
                  {showSecurityQuestionReset ? "Back to passcode" : "Forgot passcode?"}
                </button>
              )}
            </form>
          </div>
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
          /* Render Landing view */
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-5 flex flex-col">
            <div className="landing-center animate-in fade-in zoom-in duration-700 w-full mx-auto my-auto">
              <div className="landing-hero-image-wrap">
                <div className="landing-hero-glow" />
                <img src="/images/lady.jpg" alt="" className="landing-hero-image" />
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
          /* Render Active Chat Thread */
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

              {/* Mobile-only suggested questions inside the scrollable thread */}
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
                {/* Desktop-only suggested questions inside the sticky dock */}
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

      {/* Permanent Unlock Modal Overlay */}
      {permanentUnlockSessionId && (
        <div className="chat-modal-overlay">
          <div className="chat-modal-card animate-in zoom-in-95 duration-200">
            <div className="chat-modal-header">
              <h3 className="chat-modal-title">Make Chat Public?</h3>
              <button
                type="button"
                className="chat-modal-close"
                onClick={() => { setPermanentUnlockSessionId(null); setPermanentUnlockPasscode('') }}
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This will permanently remove password protection and move the conversation back into your main chat history.
            </p>
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-medium text-[var(--mf-text)]">Enter your passcode or account password</label>
              <input
                type="password"
                placeholder="Enter passcode / account password"
                className="chat-lock-input"
                value={permanentUnlockPasscode}
                onChange={(e) => setPermanentUnlockPasscode(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1 rounded-xl h-11 text-sm"
                onClick={() => { setPermanentUnlockSessionId(null); setPermanentUnlockPasscode('') }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-xl h-11 text-sm bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
                onClick={handlePermanentUnlock}
                disabled={!permanentUnlockPasscode.trim()}
              >
                <LockOpen size={16} weight="bold" />
                Unlock & Make Public
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Lock Setup Modal Overlay */}
      {lockSetupSessionId && (
        <div className="chat-modal-overlay">
          <div className="chat-modal-card animate-in zoom-in-95 duration-200">
            <div className="chat-modal-header">
              <h3 className="chat-modal-title flex items-center gap-2">
                <Lock size={18} /> Lock Chat
              </h3>
              <button
                type="button"
                className="chat-modal-close"
                onClick={() => setLockSetupSessionId(null)}
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Set a passcode to protect this conversation. You'll need it to view or continue the chat.
            </p>
            <div className="flex flex-col gap-4 text-left">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--mf-text)]">Passcode</label>
                <div className="relative">
                  <LockKey size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    placeholder="Enter a passcode"
                    className="chat-lock-input pl-9"
                    value={lockSetupPasscode}
                    onChange={(e) => setLockSetupPasscode(e.target.value)}
                    autoFocus
                  />
                </div>
                {lockSetupPasscode && (() => {
                  const strength = getPasswordStrength(lockSetupPasscode)
                  if (!strength) return null
                  return (
                    <div className="pt-1 animate-in fade-in slide-in-from-top-1 duration-300">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Strength</span>
                        <span className={`text-[10px] font-medium ${strength.textClass}`}>{strength.label}</span>
                      </div>
                      <div className="h-1 bg-muted/50 rounded-full overflow-hidden flex gap-0.5">
                        <div className={`h-full transition-all duration-500 flex-1 rounded-full ${strength.percent >= 33 ? strength.label === 'Bad' ? 'bg-rose-500' : strength.label === 'Good' ? 'bg-amber-500' : 'bg-emerald-500' : 'bg-muted/10'}`} />
                        <div className={`h-full transition-all duration-500 flex-1 rounded-full ${strength.percent >= 66 ? strength.label === 'Good' ? 'bg-amber-500' : 'bg-emerald-500' : 'bg-muted/10'}`} />
                        <div className={`h-full transition-all duration-500 flex-1 rounded-full ${strength.percent >= 100 ? 'bg-emerald-500' : 'bg-muted/10'}`} />
                      </div>
                    </div>
                  )
                })()}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--mf-text)]">Security Question <span className="text-muted-foreground font-normal">(optional)</span></label>
                <select
                  className="w-full h-11 px-3 rounded-xl bg-muted border border-border text-sm text-[var(--mf-text-strong)] focus:border-[var(--mf-accent-border)] focus:ring-1 focus:ring-[var(--mf-accent)] outline-none transition-all"
                  value={lockSetupQuestionId}
                  onChange={(e) => setLockSetupQuestionId(e.target.value)}
                >
                  {SECURITY_QUESTIONS.map((q) => (
                    <option key={q.id} value={q.id}>{q.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--mf-text)]">Answer <span className="text-muted-foreground font-normal">(optional — for recovery)</span></label>
                <input
                  type="text"
                  placeholder="Your answer"
                  className="chat-lock-input"
                  value={lockSetupAnswer}
                  onChange={(e) => setLockSetupAnswer(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1 rounded-xl h-11 text-sm"
                onClick={() => setLockSetupSessionId(null)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-xl h-11 text-sm"
                onClick={handleLockSetupSubmit}
                disabled={!lockSetupPasscode.trim() || isSettingUpLock}
              >
                <ShieldCheck size={16} weight="bold" />
                {isSettingUpLock ? 'Locking…' : 'Lock Chat'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
