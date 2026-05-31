import { useCallback, useEffect, useRef, useState } from 'react'
import { m } from 'framer-motion'
import { 
  Ghost, 
  Question, 
  Lock, 
  Trash, 
  SidebarSimple, 
  X, 
  ChatCircle, 
  Plus,
  Sparkle,
  CheckCircle,
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
import { toast } from 'sonner'
import { cn } from '../lib/utils'
import { computeCycleDay } from '../lib/cycleUtils'
import { MarkdownText } from '../components/MarkdownText'
import { getPasswordStrength } from '../lib/passwordStrength'

type Msg = {
  id: string
  role: 'user' | 'assistant'
  text: string
  createdAt: number
}

function generateAIResponse(
  userPrompt: string, 
  partnerName: string, 
  currentDay: number, 
  phase: string, 
  todaySymptoms: string[]
): string {
  const prompt = userPrompt.toLowerCase()
  const hasSymptom = (keyword: string) => prompt.includes(keyword)

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
      response += `Since ${partnerName} is currently in her **Menstrual Phase**, her body is working hard. I highly recommend preparing a warm water bottle or a heating pad for her. In terms of nutrition, a warm herbal tea like raspberry leaf or ginger tea can physically relax the muscles, and foods rich in magnesium (such as a piece of dark chocolate or a banana) help alleviate spasms. `
    } else if (isLuteal) {
      response += `As ${partnerName} is in her **Luteal Phase**, premenstrual cramping can begin due to prostaglandins rising. A warm magnesium bath, light stretching, or cozy rest will help soothe her nervous system. `
    } else {
      response += `Since she is not in her period, these could be minor ovulation cramps (mittelschmerz) if she is near mid-cycle, or mild tension. Gentle warmth and hydration are great first steps! `
    }
    response += `Quietly taking over chores tonight so she can rest without having to ask will make an immense difference.`
  }
  // 2. Food / Cook / Cravings
  else if (hasSymptom('food') || hasSymptom('eat') || hasSymptom('cook') || hasSymptom('dinner') || hasSymptom('crave') || hasSymptom('chocolate')) {
    response += `Nutrition plays a major role in hormone balance! `
    if (isMenstrual) {
      response += `For the **Menstrual Phase**, she needs nutrient-dense, warm, and easily digestible foods. High iron is key to replenish blood loss. Consider cooking a warm stew, bone broth, beef, or spinach pasta. Dark chocolate (70%+) is also excellent for magnesium. Avoid cold foods or carbonated drinks which can worsen bloating. `
    } else if (isLuteal) {
      response += `During the **Luteal Phase**, metabolism naturally increases by about 100-300 calories, and serotonin levels drop, which explains why she might be experiencing intense cravings. Cook comforting, slow-burning complex carbs (sweet potatoes, brown rice, oats) and offer healthy fats like avocado or nut butter. This will prevent rapid blood sugar spikes and mood crashes! `
    } else if (isFertile) {
      response += `In the **Ovulatory Phase**, she is in high energy. Fresh, light foods, fiber-rich vegetables (broccoli, sprouts), and lean proteins are fantastic to support liver function as it processes peak estrogen levels. A vibrant quinoa salad with seeds is a great choice! `
    } else {
      response += `For the **Follicular Phase**, keep it light and vibrant. Fresh stir-fries, colorful salads, and citrus fruits match her rising energy curves perfectly! `
    }
  }
  // 3. Tired / Sleep / Energy / Exhausted
  else if (hasSymptom('tired') || hasSymptom('exhaust') || hasSymptom('energy') || hasSymptom('sleep') || hasSymptom('lazy')) {
    response += `Low energy and fatigue are highly correlated with hormonal shifts. `
    if (isLuteal) {
      response += `In the **Luteal Phase**, the high level of progesterone has a natural sedative effect on the brain, making her feel physically heavier and sleepy. Progesterone also raises her basal body temperature, which can disrupt sleep. Try keeping the bedroom a bit cooler tonight, dim the lights early, and assure her that it's completely okay to take a nap and be unproductive. `
    } else if (isMenstrual) {
      response += `During the **Menstrual Phase**, the sharp drop in all hormones combined with active shedding drains her biological battery. Let her rest completely. Taking over household responsibilities today will lift a huge weight off her shoulders. ️`
    } else {
      response += `If she is feeling fatigued in her follicular or fertile phases, it could be a sign of sleep debt or stress overload. Suggest a gentle evening walk together to get fresh air and boost serotonin. `
    }
  }
  // 4. Mood / Sad / Angry / Irritable / Cry
  else if (hasSymptom('mood') || hasSymptom('sad') || hasSymptom('angry') || hasSymptom('cry') || hasSymptom('irritable') || hasSymptom('pms') || hasSymptom('space')) {
    response += `Emotions are deeply tied to neuro-chemical sensitivities. `
    if (isLuteal) {
      response += `We are in the **Luteal Phase** (Day ${currentDay}), which is the prime window for premenstrual mood shifts. As estrogen and progesterone begin to plummet, serotonin (the joy chemical) drops with them. This is a physical, chemical shift—not a personal reaction. If she asks for space or is easily irritated, give her a gentle, reassuring environment. Say: *"Take all the time you need, I've got things handled here. I love you."* and let her recharge in peace. `
    } else if (isMenstrual) {
      response += `In the **Menstrual Phase**, she may feel highly vulnerable or emotional due to physical pain. Offer validation rather than trying to 'fix' her feelings or rationalize. A warm hug, soft tones, and validation are powerful tools. `
    } else {
      response += `Her hormones are currently rising, so sudden emotional drops might stem from work stress or external factors. Listen actively and let her vent without jumping to give advice unless she asks. ☕`
    }
  }
  // 5. How to support / What to do / Help
  else if (hasSymptom('support') || hasSymptom('help') || hasSymptom('do') || hasSymptom('care')) {
    response += `The best way to support ${partnerName} depends heavily on her active phase (currently **${phase}**, Day ${currentDay}):\n\n`
    if (isMenstrual) {
      response += `1. **Warm Comfort:** Keep a heating pad plugged in and prepare warm tea (chamomile or ginger).\n`
      response += `2. **Quiet Relief:** Handle meals, dishes, and laundry without being asked.\n`
      response += `3. **Empathetic Listening:** Validate her discomfort and reassure her she is safe and loved.`
    } else if (isLuteal) {
      response += `1. **Sensory Comfort:** Dim the lights, keep the house quiet, and make the bedroom cool (progesterone raises body temp).\n`
      response += `2. **Comfort Cravings:** Bring her a soothing snack (avocados, dark chocolate, sweet potato fries).\n`
      response += `3. **Give Space:** Don't take irritability personally; give her space to nest and recharge.`
    } else if (isFertile) {
      response += `1. **Plan Dates:** Organize a special high-effort date night; she is in peak social energy.\n`
      response += `2. **Active Engagement:** Share deep conversations and match her outgoing momentum.\n`
      response += `3. **Physical Action:** Great time for workouts, adventures, or starting new projects together.`
    } else {
      response += `1. **Gentle Motivation:** Suggest an evening stroll or dynamic activity to ease back into routines.\n`
      response += `2. **Try New Things:** Suggest cooking a new recipe or exploring a new place.\n`
      response += `3. **Creative Planning:** Brainstorm future ideas or travel plans together.`
    }
  }
  // 6. Phase / Cycle questions
  else if (hasSymptom('phase') || hasSymptom('cycle') || hasSymptom('current')) {
    response += `Based on the latest logs, ${partnerName} is on **Day ${currentDay}** of her cycle, which places her in the **${phase}**. `
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
    response += `Hi! I'm MensFlow, your empathetic relationship translator. Currently, ${partnerName} is on **Day ${currentDay}** of her cycle (**${phase}**). `
    if (todaySymptoms.length > 0) {
      response += `Today, she has logged the following symptoms: **${todaySymptoms.join(', ')}**. `
      response += `These logs are excellent clues: they indicate her body is experiencing physiological shifts. Focus on providing restorative comfort, handling household chores, and asking supportive questions like *"Is there anything I can do to make you more comfortable?"* `
    } else {
      response += `She hasn't logged any symptoms yet today. It's a great opportunity to check in gently. In this phase, her body values ${isLuteal ? 'calm nesting and cool spaces' : isMenstrual ? 'deep rest and soothing warmth' : 'creative ideas and fun engagement'}. `
    }
    response += `Is there a specific symptom or care plan you'd like to ask about? Ask me about cramps, food cravings, fatigue, or how you can support her today! `
  }

  return response
}




export function ChatView({ showOnlyLocked = false }: { showOnlyLocked?: boolean }) {
  const { temporaryChat, setTemporaryChat } = useChatSession()
  const { chatShowTimestamps } = useStore((state) => state.settings)
  const { dashboard: data, user, logs, customSymptoms, showConfirm } = useStore()

  const threadEndRef = useRef<HTMLDivElement>(null)
  // Capture the static prop in a ref so the initial-load effect doesn't
  // re-derive state from a changing prop (fixes react-doctor no-adjust-state-on-prop-change)
  const showOnlyLockedRef = useRef(showOnlyLocked)

  // Compute active cycle day from store data (computeCycleDay handles Date.now internally)
  const currentDay = computeCycleDay(data.lastPeriodStart, data.typicalCycleDays)

  const welcomeText = `Hi - I'm MensFlow, your personal relationship and cycle support companion. Currently, ${user.name} is on Day ${currentDay} of her cycle (${data.phaseLabel}). Ask me about her active phase, logged symptoms, how you can support her today, or what healthy meals you can cook! `

  const [sessions, setSessions] = useState<ApiChatSession[]>([])
  const filteredSessions = showOnlyLocked ? sessions.filter((s) => s.isLocked) : sessions
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

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

  const [lockModalSessionId, setLockModalSessionId] = useState<string | null>(null)
  const [lockPasscodeVal, setLockPasscodeVal] = useState('')
  const [lockSecurityQVal, setLockSecurityQVal] = useState('')
  const [lockSecurityAVal, setLockSecurityAVal] = useState('')

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
      const passcode = unlockedPasscodes[activeSessionId]
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
  }, [activeSessionId, temporaryChat, welcomeText, sessions, unlockedPasscodes])

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
        const aiResponse = generateAIResponse(text, user.name, currentDay, data.phaseLabel, todaySymptoms)
        
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
      let sid = activeSessionId
      if (!sid) {
        sid = generateNewSessionId()
        setActiveSessionId(sid)
      }

      try {
        const passcode = unlockedPasscodes[sid]
        const result = await chatApi.send(sid, text, passcode)
        setMessages((m) => [
          ...m,
          {
            id: result.assistantMessage.id,
            role: result.assistantMessage.role,
            text: result.assistantMessage.text,
            createdAt: result.assistantMessage.createdAt,
          }
        ])
        // Refresh recent session list
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

  // // Lock Actions
  // const openLockModal = (sessionId: string, e: React.MouseEvent) => {
  //   e.stopPropagation()
  //   setLockModalSessionId(sessionId)
  // }

  const handleLockSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lockModalSessionId) return
    if (!lockPasscodeVal.trim() || !lockSecurityQVal.trim() || !lockSecurityAVal.trim()) {
      toast.error('All fields are required')
      return
    }

    const strength = getPasswordStrength(lockPasscodeVal)
    if (!strength || !strength.isStrong) {
      toast.error('Passcode is too weak. Please use a stronger passcode (at least Good).')
      return
    }

    try {
      await chatApi.lock(lockModalSessionId, lockPasscodeVal, lockSecurityQVal, lockSecurityAVal)
      toast.success('Chat session locked!')
      
      // Store verified passcode locally
      setUnlockedPasscodes((prev) => ({ ...prev, [lockModalSessionId]: lockPasscodeVal }))

      setLockModalSessionId(null)
      setLockPasscodeVal('')
      setLockSecurityQVal('')
      setLockSecurityAVal('')
      
      fetchSessions()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to lock session')
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
          toast.success(`Success! Your passcode was retrieved.`)
          setUnlockedPasscodes((prev) => ({ ...prev, [sid]: res.passcode! }))
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
      {/* 1. Left Sidebar for Chat History */}
      <aside className={cn("chat-sidebar-wrapper", !isSidebarOpen && "collapsed")}>
        {!showOnlyLocked && (
          <div className="chat-sidebar-header">
            <button
              type="button"
              className="chat-new-btn active-squish"
              onClick={startNewChat}
            >
              <Plus size={16} weight="bold" />
              <span>New Chat</span>
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
                  {/* {!s.isLocked && (
                    <button
                      type="button"
                      className="chat-session-action-btn"
                      title="Lock Chat"
                      onClick={(e) => openLockModal(s.sessionId, e)}
                    >
                      <Lock size={14} />
                    </button>
                  )} */}
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

          {/* <div className="flex items-center gap-2">
            {activeSessionId && !sessions.find((s) => s.sessionId === activeSessionId)?.isLocked && (
              <button
                type="button"
                className="text-xs text-muted-foreground flex items-center gap-1 hover:text-[var(--mf-accent)] px-2 py-1.5 rounded-lg border border-border bg-card transition-colors cursor-pointer"
                onClick={(e) => openLockModal(activeSessionId, e)}
              >
                <Lock size={14} />
                <span>Lock Chat</span>
              </button>
            )}
            {activeSessionId && sessions.find((s) => s.sessionId === activeSessionId)?.isLocked && (
              <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                <Lock size={10} weight="fill" />
                Locked
              </span>
            )}
          </div> */}
        </div>

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
              <p className="text-xs text-muted-foreground -mt-2 max-w-[280px]">
                {showSecurityQuestionReset 
                  ? "Answer the security question configured for this chat to retrieve your passcode."
                  : "Enter the passcode to view and continue this conversation."}
              </p>

              <div className="chat-lock-inputs">
                {showSecurityQuestionReset ? (
                  <>
                    <div className="text-xs font-semibold text-[var(--mf-text)] mb-1">
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

              <button type="submit" className="chat-lock-btn mt-2">
                {showSecurityQuestionReset ? "Retrieve Passcode" : "Unlock Chat"}
              </button>

              <button
                type="button"
                className="chat-lock-forgot"
                onClick={() => setShowSecurityQuestionReset(!showSecurityQuestionReset)}
              >
                {showSecurityQuestionReset ? "Back to Passcode Input" : "Forgot passcode? Answer security question"}
              </button>
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
          <div className="flex-1 overflow-y-auto flex items-center justify-center p-4">
            <div className="landing-center animate-in fade-in zoom-in duration-700 max-w-[800px] w-full px-4 mx-auto">
              <div className="landing-hero-image-wrap">
                <img src="/images/lady.png" alt="" className="landing-hero-image" />
              </div>
              <h1 className="landing-title">Ask MensFlow about your cycle?</h1>
              <div className="landing-sub flex items-center gap-1 justify-center max-w-[500px] mx-auto text-center leading-relaxed">
                Education, tracking context, and supportive guidance; not a substitute for medical care.
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="p-1 hover:bg-black/5 rounded-full transition-colors inline-flex items-center justify-center cursor-help" aria-label="Medical disclaimer information">
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

              <div className="landing-composer-wrap mt-8">
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
                    <button className="ml-1 p-0.5 hover:bg-black/10 rounded-full transition-colors flex items-center justify-center" aria-label="More information">
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
                    Free Tier Chat Limit: Reach 500 XP via daily quizzes to unlock unlimited AI translation. (Current XP: {user.xp || 0}/500)
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
              <div ref={threadEndRef} />
            </div>

            <div className="chat-composer-dock p-3 bg-background/80 backdrop-blur-md border-t border-border">
              <div className="max-w-[800px] mx-auto w-full">
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
                  minimal
                  showKeyboardHint
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lock Setup Modal Overlay */}
      {lockModalSessionId && (
        <div className="chat-modal-overlay">
          <form className="chat-modal-card animate-in zoom-in-95 duration-200" onSubmit={handleLockSubmit}>
            <div className="chat-modal-header">
              <h3 className="chat-modal-title">Lock Chat Conversation</h3>
              <button
                type="button"
                className="chat-modal-close"
                onClick={() => setLockModalSessionId(null)}
              >
                <X size={18} />
              </button>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Add passcode protection to this conversation. You will also need to configure a security question in case you forget the passcode.
            </p>

            <div className="flex flex-col gap-3 text-left">
              <div>
                <label className="text-xs font-semibold text-[var(--mf-text)] mb-1 block">Passcode / Password</label>
                <input
                  type="password"
                  placeholder="Set passcode"
                  className="chat-lock-input"
                  value={lockPasscodeVal}
                  onChange={(e) => setLockPasscodeVal(e.target.value)}
                  required
                />
                {(() => {
                  const strengthResult = getPasswordStrength(lockPasscodeVal)
                  if (!lockPasscodeVal) return null
                  return (
                    <div className="w-full mt-2 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-300">
                      <div className="flex justify-between items-center text-[10px] font-medium tracking-wide">
                        <span className="text-muted-foreground uppercase">Password Strength</span>
                        {strengthResult && (
                          <span className={strengthResult.textClass}>
                            {strengthResult.label}
                          </span>
                        )}
                      </div>
                      <div className="h-1.5 w-full bg-muted/30 dark:bg-muted/10 rounded-full overflow-hidden flex gap-1">
                        {strengthResult && (
                          <>
                            <div className={`h-full rounded-full transition-all duration-500 flex-1 ${
                              strengthResult.percent >= 33 
                                ? strengthResult.label === 'Bad' 
                                  ? 'bg-rose-500' 
                                  : strengthResult.label === 'Good' 
                                    ? 'bg-amber-500' 
                                    : 'bg-emerald-500'
                                : 'bg-transparent'
                            }`} />
                            <div className={`h-full rounded-full transition-all duration-500 flex-1 ${
                              strengthResult.percent >= 66 
                                ? strengthResult.label === 'Good' 
                                  ? 'bg-amber-500' 
                                  : 'bg-emerald-500'
                                : 'bg-muted/10'
                            }`} />
                            <div className={`h-full rounded-full transition-all duration-500 flex-1 ${
                              strengthResult.percent >= 100 
                                ? 'bg-emerald-500' 
                                : 'bg-muted/10'
                            }`} />
                          </>
                        )}
                      </div>
                      {strengthResult?.label === 'Bad' && (
                        <p className="text-[9px] text-muted-foreground leading-normal text-left flex items-center gap-2">
                          <WarningCircle size={14} aria-hidden="true" className="text-rose-500" />
                          <span>Make it at least 8 characters with numbers or special symbols.</span>
                        </p>
                      )}
                      {strengthResult?.label === 'Good' && (
                        <p className="text-[9px] text-muted-foreground leading-normal text-left flex items-center gap-2">
                          <CheckCircle size={14} aria-hidden="true" className="text-amber-500" />
                          <span>Good! Add uppercase letters and symbols for maximum security.</span>
                        </p>
                      )}
                      {strengthResult?.label === 'Excellent' && (
                        <p className="text-[9px] leading-normal font-medium text-emerald-500 dark:text-emerald-400 text-left flex items-center gap-2">
                          <Sparkle size={14} aria-hidden="true" className="text-emerald-500" />
                          <span>Excellent! Your passcode is highly secure.</span>
                        </p>
                      )}
                    </div>
                  )
                })()}
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--mf-text)] mb-1 block">Security Question</label>
                <input
                  type="text"
                  placeholder="e.g., What was your first pet's name?"
                  className="chat-lock-input"
                  value={lockSecurityQVal}
                  onChange={(e) => setLockSecurityQVal(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--mf-text)] mb-1 block">Security Answer</label>
                <input
                  type="text"
                  placeholder="Enter answer"
                  className="chat-lock-input"
                  value={lockSecurityAVal}
                  onChange={(e) => setLockSecurityAVal(e.target.value)}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="chat-lock-btn mt-2"
              disabled={(() => {
                const strengthResult = getPasswordStrength(lockPasscodeVal)
                return !strengthResult || !strengthResult.isStrong
              })()}
             >
               Secure Chat
             </button>
          </form>
        </div>
      )}
    </div>
  )
}
