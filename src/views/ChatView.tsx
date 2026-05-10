import { useEffect, useRef, useState } from 'react'
import { Ghost } from '@phosphor-icons/react'
import { ChatComposer } from '../components/ChatComposer'
import { useChatSession } from '../context/useChatSession'
import { useSettings } from '../context/useSettings'
import { CHAT_STORAGE_KEY, CLEAR_LOCAL_CHATS_EVENT } from '../lib/constants'
import { cn } from '../lib/utils'

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
    if (temporaryChat) return [welcomeMessage()]
    return loadStoredMessages() ?? [welcomeMessage()]
  })

  const [draft, setDraft] = useState('')
  const prevTemporary = useRef<boolean | null>(null)

  /** ChatGPT-like: switching into ephemeral mode starts a fresh thread */
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

  const isInitialState = messages.length === 1 && messages[0].id === 'welcome'

  return (
    <div className="chat-view">
      {temporaryChat && (
        <div className="chat-temporary-banner chat-thread-spacing" role="status">
          <Ghost size={18} weight="duotone" aria-hidden />
          <span>
            Temporary chat - this conversation won&apos;t be saved to history or used to
            improve models (ChatGPT-style ephemeral session).
          </span>
        </div>
      )}

      {temporaryChat && isInitialState && (
        <div className="chat-temp-hero">
          <div className="chat-temp-hero-icon">
            <Ghost size={48} weight="duotone" className="text-[#2ebcc5]" />
          </div>
          <h2 className="chat-temp-hero-title">Temporary Chat</h2>
          <p className="chat-temp-hero-desc">
            Messages in this chat won&apos;t appear in your history and won&apos;t be used
            to improve our models. Any files you upload or data you log won&apos;t be saved.
          </p>
        </div>
      )}

      <div className={cn("chat-thread", isInitialState && temporaryChat && "opacity-0 h-0 pointer-events-none")} role="log" aria-live="polite">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`chat-bubble chat-bubble--${m.role}`}
          >
            <span className="chat-role">
              {m.role === 'user' ? 'You' : 'MensFlow'}
              {chatShowTimestamps && (
                <time
                  className="chat-time"
                  dateTime={new Date(m.createdAt).toISOString()}
                >
                  {fmtTime(m.createdAt)}
                </time>
              )}
            </span>
            <p className="chat-text">{m.text}</p>
          </div>
        ))}
      </div>
      <div className="chat-composer-dock">
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
  )
}
