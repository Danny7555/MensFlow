import { Question, Sparkle, CaretRight } from '@phosphor-icons/react'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { ChatComposer } from '../ChatComposer'
import { hapticSelection } from '../../lib/haptics'

interface ChatLandingProps {
  suggestions: string[] | undefined
  suggestionsLoading: boolean
  isTyping: boolean
  draft: string
  onSend: (overrideText?: string) => void
  onDraftChange: (v: string) => void
}

export function ChatLanding({
  suggestions,
  suggestionsLoading,
  isTyping,
  draft,
  onSend,
  onDraftChange,
}: ChatLandingProps) {
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
