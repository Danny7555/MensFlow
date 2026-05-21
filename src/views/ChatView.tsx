import { useEffect, useRef, useState, useMemo } from 'react'
import { Ghost, Question, Sparkle } from '@phosphor-icons/react'
import { ChatComposer } from '../components/ChatComposer'
import { useChatSession } from '../context/useChatSession'
import { useStore } from '../store/useStore'
import { CHAT_STORAGE_KEY, CLEAR_LOCAL_CHATS_EVENT } from '../lib/constants'
import { Tooltip, TooltipContent, TooltipTrigger } from '../components/ui/tooltip'
import { ChatSkeleton } from '../components/skeletons/ChatSkeleton'
import { SYMPTOM_DEFS } from '../data/symptomsData'

type Msg = {
  id: string
  role: 'user' | 'assistant'
  text: string
  createdAt: number
}

function loadStoredMessages(): Msg[] | null {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as { messages?: Msg[] }
    if (!Array.isArray(data.messages) || data.messages.length === 0)
      return null
    return data.messages.map((m) => ({
      ...m,
      createdAt:
        typeof m.createdAt === 'number' ? m.createdAt : Date.now(),
    }))
  } catch {
    return null
  }
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
    response += `Quietly taking over chores tonight so she can rest without having to ask will make an immense difference. ❤️`
  }
  // 2. Food / Cook / Cravings
  else if (hasSymptom('food') || hasSymptom('eat') || hasSymptom('cook') || hasSymptom('dinner') || hasSymptom('crave') || hasSymptom('chocolate')) {
    response += `Nutrition plays a major role in hormone balance! `
    if (isMenstrual) {
      response += `For the **Menstrual Phase**, she needs nutrient-dense, warm, and easily digestible foods. High iron is key to replenish blood loss. Consider cooking a warm stew, bone broth, beef, or spinach pasta. Dark chocolate (70%+) is also excellent for magnesium. Avoid cold foods or carbonated drinks which can worsen bloating. 🍲`
    } else if (isLuteal) {
      response += `During the **Luteal Phase**, metabolism naturally increases by about 100-300 calories, and serotonin levels drop, which explains why she might be experiencing intense cravings. Cook comforting, slow-burning complex carbs (sweet potatoes, brown rice, oats) and offer healthy fats like avocado or nut butter. This will prevent rapid blood sugar spikes and mood crashes! 🥑`
    } else if (isFertile) {
      response += `In the **Ovulatory Phase**, she is in high energy. Fresh, light foods, fiber-rich vegetables (broccoli, sprouts), and lean proteins are fantastic to support liver function as it processes peak estrogen levels. A vibrant quinoa salad with seeds is a great choice! 🥗`
    } else {
      response += `For the **Follicular Phase**, keep it light and vibrant. Fresh stir-fries, colorful salads, and citrus fruits match her rising energy curves perfectly! 🍊`
    }
  }
  // 3. Tired / Sleep / Energy / Exhausted
  else if (hasSymptom('tired') || hasSymptom('exhaust') || hasSymptom('energy') || hasSymptom('sleep') || hasSymptom('lazy')) {
    response += `Low energy and fatigue are highly correlated with hormonal shifts. `
    if (isLuteal) {
      response += `In the **Luteal Phase**, the high level of progesterone has a natural sedative effect on the brain, making her feel physically heavier and sleepy. Progesterone also raises her basal body temperature, which can disrupt sleep. Try keeping the bedroom a bit cooler tonight, dim the lights early, and assure her that it's completely okay to take a nap and be unproductive. 🛌`
    } else if (isMenstrual) {
      response += `During the **Menstrual Phase**, the sharp drop in all hormones combined with active shedding drains her biological battery. Let her rest completely. Taking over household responsibilities today will lift a huge weight off her shoulders. 🕯️`
    } else {
      response += `If she is feeling fatigued in her follicular or fertile phases, it could be a sign of sleep debt or stress overload. Suggest a gentle evening walk together to get fresh air and boost serotonin. 🌳`
    }
  }
  // 4. Mood / Sad / Angry / Irritable / Cry
  else if (hasSymptom('mood') || hasSymptom('sad') || hasSymptom('angry') || hasSymptom('cry') || hasSymptom('irritable') || hasSymptom('pms') || hasSymptom('space')) {
    response += `Emotions are deeply tied to neuro-chemical sensitivities. `
    if (isLuteal) {
      response += `We are in the **Luteal Phase** (Day ${currentDay}), which is the prime window for premenstrual mood shifts. As estrogen and progesterone begin to plummet, serotonin (the joy chemical) drops with them. This is a physical, chemical shift—not a personal reaction. If she asks for space or is easily irritated, give her a gentle, reassuring environment. Say: *"Take all the time you need, I've got things handled here. I love you."* and let her recharge in peace. 🤍`
    } else if (isMenstrual) {
      response += `In the **Menstrual Phase**, she may feel highly vulnerable or emotional due to physical pain. Offer validation rather than trying to 'fix' her feelings or rationalize. A warm hug, soft tones, and validation are powerful tools. 🌸`
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
    response += `Is there a specific symptom or care plan you'd like to ask about? Ask me about cramps, food cravings, fatigue, or how you can support her today! 🌸`
  }

  return response
}

const SUGGESTIONS = [
  { text: "How can I support her today? 💖", query: "How can I support her today?" },
  { text: "What should I cook for dinner? 🍲", query: "What should I cook for dinner?" },
  { text: "Explain her current cycle phase 🔮", query: "Explain her current cycle phase" },
  { text: "Why is she feeling tired/low energy? 🛌", query: "Why is she feeling tired/low energy?" },
]

export function ChatView() {
  const { temporaryChat } = useChatSession()
  const { chatPersistLocal, chatShowTimestamps } = useStore((state) => state.settings)
  const { dashboard: data, user, logs, customSymptoms } = useStore()

  const persistToDisk = chatPersistLocal && !temporaryChat

  const [messages, setMessages] = useState<Msg[]>(() => {
    if (temporaryChat) return []
    return loadStoredMessages() ?? []
  })

  const [draft, setDraft] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const prevTemporary = useRef<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const threadEndRef = useRef<HTMLDivElement>(null)

  // Compute active day and logs in real time
  const currentDay = useMemo(() => {
    const start = new Date(`${data.lastPeriodStart}T12:00:00`)
    if (!Number.isNaN(+start)) {
      const days = Math.floor((Date.now() - +start) / 86400000)
      const m = ((days % data.typicalCycleDays) + data.typicalCycleDays) % data.typicalCycleDays
      return m + 1
    }
    return 1
  }, [data.lastPeriodStart, data.typicalCycleDays])

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])
  const todayLog = useMemo(() => logs.find(l => l.date === todayStr), [logs, todayStr])

  const todaySymptoms = useMemo(() => {
    if (!todayLog) return []
    const allSymptomDefs = [...SYMPTOM_DEFS, ...customSymptoms]
    return todayLog.symptoms.map(sId => {
      const def = allSymptomDefs.find(d => d.id === sId)
      return def ? def.label : sId
    })
  }, [todayLog, customSymptoms])

  const welcomeText = useMemo(() => {
    return `Hi - I'm MensFlow, your personal relationship and cycle support companion. Currently, ${user.name} is on Day ${currentDay} of her cycle (${data.phaseLabel}). Ask me about her active phase, logged symptoms, how you can support her today, or what healthy meals you can cook! 🌸`
  }, [user.name, currentDay, data.phaseLabel])

  function welcomeMessage(): Msg {
    return {
      id: 'welcome',
      role: 'assistant',
      text: welcomeText,
      createdAt: Date.now(),
    }
  }

  // Set up welcome message if chat thread is empty
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([welcomeMessage()])
    }
  }, [welcomeText])

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (prevTemporary.current === null) {
      prevTemporary.current = temporaryChat
      return
    }
    if (!prevTemporary.current && temporaryChat) {
      setMessages([welcomeMessage()])
    }
    prevTemporary.current = temporaryChat
  }, [temporaryChat, welcomeText])

  useEffect(() => {
    const onClear = () => setMessages([welcomeMessage()])
    window.addEventListener(CLEAR_LOCAL_CHATS_EVENT, onClear)
    return () => window.removeEventListener(CLEAR_LOCAL_CHATS_EVENT, onClear)
  }, [welcomeText])

  useEffect(() => {
    if (!persistToDisk) return
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify({ messages }))
    } catch {
      /* quota */
    }
  }, [messages, persistToDisk])

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

  const send = (overrideText?: string) => {
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

    // Simulate bouncy AI loading and context decoding
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
  }

  const isInitialState = messages.length <= 1 && messages[0]?.id === 'welcome'

  if (isLoading) {
    return <ChatSkeleton />
  }

  return (
    <div className={isInitialState ? "landing" : "chat-view"}>
      {isInitialState ? (
        <div className="landing-center animate-in fade-in zoom-in duration-700 max-w-[800px] w-full px-4 mx-auto">
          <div className="landing-hero-image-wrap">
            <img src="/images/lady.png" alt="" className="landing-hero-image" />
          </div>
          <h1 className="landing-title">Ask MensFlow about your cycle?</h1>
          <p className="landing-sub flex items-center gap-1 justify-center max-w-[500px] mx-auto text-center leading-relaxed">
            Education, tracking context, and supportive guidance; not a substitute for medical care.
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-1 hover:bg-black/5 rounded-full transition-colors inline-flex items-center justify-center cursor-help" aria-label="Medical disclaimer information">
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

          {/* Dynamic suggestion tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 mb-6 text-left">
            {SUGGESTIONS.map((sug) => (
              <button
                key={sug.query}
                type="button"
                onClick={() => send(sug.query)}
                className="p-4 rounded-2xl border border-[var(--mf-border)] bg-[var(--mf-card)] hover:border-[var(--mf-accent-border)] hover:bg-[var(--mf-accent-soft)]/20 active-squish transition-all flex items-start gap-3 cursor-pointer group text-xs text-[var(--mf-text)] font-medium leading-relaxed !shadow-none"
              >
                <div className="size-6 rounded-lg bg-[var(--mf-accent-soft)] flex items-center justify-center text-[var(--mf-accent)] shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                  <Sparkle size={12} weight="fill" />
                </div>
                <span>{sug.text}</span>
              </button>
            ))}
          </div>

          <div className="landing-composer-wrap mt-2">
            <ChatComposer
              value={draft}
              onChange={setDraft}
              onSubmit={() => send()}
              placeholder="Ask MensFlow"
            />
          </div>
        </div>
      ) : (
        <>
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
                <p className="chat-text whitespace-pre-line">{m.text}</p>
              </div>
            ))}

            {isTyping && (
              <div className="chat-bubble chat-bubble--assistant animate-pulse duration-1000">
                <span className="chat-role flex items-center gap-1.5">
                  MensFlow
                </span>
                <div className="flex items-center gap-1.5 py-3 px-1">
                  <div className="size-2 rounded-full bg-[var(--mf-accent)] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="size-2 rounded-full bg-[var(--mf-accent)] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="size-2 rounded-full bg-[var(--mf-accent)] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={threadEndRef} />
          </div>

          <div className="chat-composer-dock p-3 bg-background/80 backdrop-blur-md border-t border-border">
            <div className="max-w-[800px] mx-auto w-full">
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
        </>
      )}
    </div>
  )
}
