
import { useEffect, useRef, useState } from 'react'
import { Ghost, Question } from '@phosphor-icons/react'
import { ChatComposer } from '../components/ChatComposer'
import { useChatSession } from '../context/useChatSession'
import { useSettings } from '../context/useSettings'
import { CHAT_STORAGE_KEY, CLEAR_LOCAL_CHATS_EVENT } from '../lib/constants'
import { Tooltip, TooltipContent, TooltipTrigger } from '../components/ui/tooltip'

type Msg = {
  id: string
  role: 'user' | 'assistant'
  text: string
  createdAt: number
}

const welcomeText =
  "Hi - I'm MensFlow. Ask about cycle basics, symptoms, or tracking. I share education, not diagnoses."

function welcomeMessage(): Msg {
  return {
    id: 'welcome',
    role: 'assistant',
    text: welcomeText,
    createdAt: Date.now(),
  }
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

export function ChatView() {
  const { temporaryChat } = useChatSession()
  const {
    settings: { chatPersistLocal, chatShowTimestamps },
  } = useSettings()

  const persistToDisk = chatPersistLocal && !temporaryChat

  const [messages, setMessages] = useState<Msg[]>(() => {
    if (temporaryChat) return []
    return loadStoredMessages() ?? []
  })

  const [draft, setDraft] = useState('')
  const [mounted, setMounted] = useState(false)
  const [now, setNow] = useState<Date | null>(null)
  const prevTemporary = useRef<boolean | null>(null)

  useEffect(() => {
    setMounted(true)
    setNow(new Date())
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
  }, [temporaryChat])

  useEffect(() => {
    const onClear = () => setMessages([welcomeMessage()])
    window.addEventListener(CLEAR_LOCAL_CHATS_EVENT, onClear)
    return () => window.removeEventListener(CLEAR_LOCAL_CHATS_EVENT, onClear)
  }, [])

  useEffect(() => {
    if (!persistToDisk) return
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify({ messages }))
    } catch {
      /* quota */
    }
  }, [messages, persistToDisk])

  const fmtTime = (t: number) =>
    new Date(t).toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    })

  const send = () => {
    const text = draft.trim()
    if (!text) return
    const uid = `u-${Date.now()}`
    const aid = `a-${Date.now()}`
    const now = Date.now()
    setMessages((m) => [
      ...m,
      { id: uid, role: 'user', text, createdAt: now },
      {
        id: aid,
        role: 'assistant',
        text:
          'This is a local preview. Wire your API here to stream real answers grounded on MensFlow content.',
        createdAt: now + 1,
      },
    ])
    setDraft('')
  }

  const isInitialState = messages.length === 0

  return (
    <div className={isInitialState ? "landing" : "chat-view"}>
      {isInitialState ? (
        <div className="landing-center animate-in fade-in zoom-in duration-700">
          <div className="landing-hero-image-wrap">
            <img src="/images/lady.png" alt="" className="landing-hero-image" />
          </div>
          <h1 className="landing-title">Ask MensFlow about your cycle?</h1>
          <p className="landing-sub flex items-center gap-1 justify-center">
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
          <div className="landing-composer-wrap">
            <ChatComposer
              value={draft}
              onChange={setDraft}
              onSubmit={send}
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
                <span className="chat-role">
                  {m.role === 'user' ? 'You' : 'MensFlow'}
                  {chatShowTimestamps && mounted && (
                    <time
                      className="chat-time"
                      dateTime={now?.toISOString() || ""}
                      suppressHydrationWarning
                    >
                      {fmtTime(m.createdAt)}
                    </time>
                  )}
                </span>
                <p className="chat-text">{m.text}</p>
              </div>
            ))}
          </div>

          <div className="chat-composer-dock p-3 bg-background/80 backdrop-blur-md border-t border-border">
            <div className="max-w-[800px] mx-auto w-full">
              <ChatComposer
                value={draft}
                onChange={setDraft}
                onSubmit={send}
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
