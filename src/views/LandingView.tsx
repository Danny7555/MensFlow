import { useEffect, useState } from 'react'
import { ChatComposer } from '../components/ChatComposer'
import { CLEAR_LOCAL_CHATS_EVENT } from '../lib/constants'

export function LandingView() {
  const [draft, setDraft] = useState('')
  const [lastPrompt, setLastPrompt] = useState<string | null>(null)

  useEffect(() => {
    const onClear = () => {
      setLastPrompt(null)
      setDraft('')
    }
    window.addEventListener(CLEAR_LOCAL_CHATS_EVENT, onClear)
    return () => window.removeEventListener(CLEAR_LOCAL_CHATS_EVENT, onClear)
  }, [])

  const send = () => {
    const text = draft.trim()
    if (!text) return
    setLastPrompt(text)
    setDraft('')
  }

  return (
    <div className="landing">
      <div className="landing-center">
        <h1 className="landing-title">Ask MensFlow about your cycle?</h1>
        <p className="landing-sub">
          Education, tracking context, and supportive guidance — not a substitute
          for medical care.
        </p>
        {lastPrompt && (
          <div className="landing-preview" aria-live="polite">
            <div className="chat-bubble chat-bubble--user">
              <span className="chat-role">You</span>
              <p className="chat-text">{lastPrompt}</p>
            </div>
            <div className="chat-bubble chat-bubble--assistant">
              <span className="chat-role">MensFlow</span>
              <p className="chat-text">
                Sign up free to continue this chat with history, tracker-aware
                tips, and saved insights.
              </p>
            </div>
          </div>
        )}
        <div className="landing-composer-wrap">
          <ChatComposer
            value={draft}
            onChange={setDraft}
            onSubmit={send}
            placeholder="Ask MensFlow"
          />
        </div>

      </div>
    </div>
  )
}
