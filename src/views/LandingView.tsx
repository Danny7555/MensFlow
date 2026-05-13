import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CaretRight } from '@phosphor-icons/react'
import { ChatComposer } from '../components/ChatComposer'
import { useAuth } from '../context/useAuth'
import { CLEAR_LOCAL_CHATS_EVENT } from '../lib/constants'

export function LandingView() {
  const [draft, setDraft] = useState('')
  const [lastPrompt, setLastPrompt] = useState<string | null>(null)
  const { onboardingCompleted } = useAuth()
  const navigate = useNavigate()

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
        <div className="landing-hero-image-wrap">
          <img src="/images/lady.png" alt="" className="landing-hero-image" />
        </div>
        <h1 className="landing-title">Ask MensFlow about your cycle?</h1>
        <p className="landing-sub">
          Education, tracking context, and supportive guidance; not a substitute
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

        {!onboardingCompleted && (
          <>
            <div className="landing-cta-divider">
              <span>or</span>
            </div>

            <button 
              onClick={() => navigate('/onboarding')}
              className="landing-primary-cta"
            >
              <span className="landing-primary-cta-text">Personalize my experience</span>
              <CaretRight className="size-5" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
