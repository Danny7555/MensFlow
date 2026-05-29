import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CaretRight } from '@phosphor-icons/react'
import { ChatComposer } from '../components/ChatComposer'
import { useAuth } from '../context/useAuth'
import { CLEAR_LOCAL_CHATS_EVENT } from '../lib/constants'
import { post } from '../lib/apiClient'
import { toast } from 'sonner'

export function LandingView() {
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { onboardingCompleted, openAuthModal } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const onClear = () => {
      setMessages([])
      setDraft('')
    }
    window.addEventListener(CLEAR_LOCAL_CHATS_EVENT, onClear)
    return () => window.removeEventListener(CLEAR_LOCAL_CHATS_EVENT, onClear)
  }, [])

  const send = async () => {
    const text = draft.trim()
    if (!text || isLoading) return

    const userMsgCount = messages.filter((m) => m.role === 'user').length
    if (userMsgCount >= 2) {
      toast.error('You have reached the free guest message limit. Please sign in to continue.')
      return
    }

    const newUserMessage = { role: 'user' as const, text }
    const nextMessages = [...messages, newUserMessage]
    setMessages(nextMessages)
    setDraft('')
    setIsLoading(true)

    try {
      const response = await post<{ text: string }>('/chat/guest-message', {
        text,
        history: messages,
      })
      setMessages([...nextMessages, { role: 'assistant', text: response.text }])
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to connect to assistant')
      setMessages([
        ...nextMessages,
        { role: 'assistant', text: 'Sorry, I am having trouble connecting right now. Please try again.' },
      ])
    } finally {
      setIsLoading(false)
    }
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
        {messages.length > 0 && (
          <div className="landing-preview w-full max-h-[360px] overflow-y-auto pr-1 space-y-4 mb-4" aria-live="polite">
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user'
              // Only show banner after the assistant response corresponding to the 1st or 2nd user message
              const showBanner = !isUser && (idx === 1 || idx === 3)
              return (
                <div key={idx} className="space-y-3">
                  <div className={`chat-bubble ${isUser ? 'chat-bubble--user' : 'chat-bubble--assistant'}`}>
                    <span className="chat-role">{isUser ? 'You' : 'MensFlow'}</span>
                    <p className="chat-text text-left whitespace-pre-wrap">{msg.text}</p>
                  </div>
                  
                  {showBanner && (
                    <div className="px-4 py-3 rounded-2xl bg-[var(--mf-accent-soft)]/20 border border-[var(--mf-accent-border)]/20 text-xs text-muted-foreground flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-300">
                      {idx === 1 ? (
                        <>
                          <p className="font-semibold text-[var(--mf-text-strong)] flex items-center gap-1.5">
                            💡 Personalized Insights Await
                          </p>
                          <p className="text-left leading-normal">
                            You've used 1 of 2 free guest messages. Sign up free to save your chats, log daily symptoms, and sync cycle phases with your partner.
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-semibold text-[var(--mf-text-strong)] flex items-center gap-1.5">
                            🔒 Message Limit Reached
                          </p>
                          <p className="text-left leading-normal">
                            Create your free MensFlow account to unlock unlimited messaging, personalized tracker advice, and secure private chats.
                          </p>
                        </>
                      )}
                      <button 
                        onClick={() => openAuthModal()}
                        className="text-left font-semibold text-[var(--mf-accent)] hover:underline self-start cursor-pointer"
                      >
                        Sign in or sign up now →
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
            
            {isLoading && (
              <div className="chat-bubble chat-bubble--assistant">
                <span className="chat-role">MensFlow</span>
                <div className="flex items-center gap-1.5 py-3 px-1">
                  {[0, 150, 300].map((delay) => (
                    <div
                      key={delay}
                      style={{ animationDelay: `${delay}ms` }}
                      className="size-2 rounded-full bg-[var(--mf-accent)] animate-bounce"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="landing-composer-wrap">
          <ChatComposer
            value={draft}
            onChange={setDraft}
            onSubmit={send}
            placeholder={
              messages.filter((m) => m.role === 'user').length >= 2
                ? 'Free message limit reached. Please sign in.'
                : 'Ask MensFlow'
            }
            disabled={isLoading || messages.filter((m) => m.role === 'user').length >= 2}
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
