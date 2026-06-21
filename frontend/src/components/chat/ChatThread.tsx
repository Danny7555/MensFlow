import React from 'react'
import { m } from 'framer-motion'
import { Ghost, Question, WarningCircle, Sparkle, CaretRight } from '@phosphor-icons/react'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { ChatComposer } from '../ChatComposer'
import { MarkdownText } from '../MarkdownText'
import { hapticSelection } from '../../lib/haptics'

export type Msg = {
  id: string
  role: 'user' | 'assistant'
  text: string
  createdAt: number
}

interface ChatThreadProps {
  messages: Msg[]
  isTyping: boolean
  suggestions: string[] | undefined
  suggestionsLoading: boolean
  draft: string
  onSend: (overrideText?: string) => void
  onDraftChange: (v: string) => void
  chatShowTimestamps: boolean
  temporaryChat: boolean
  userXp: number | undefined
  threadEndRef: React.RefObject<HTMLDivElement | null>
}

const fmtTime = (t: number) => {
  const d = new Date(t)
  let hours = d.getHours()
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  hours = hours ? hours : 12
  return `${hours}:${minutes} ${ampm}`
}

const getIsoString = (t: number) => new Date(t).toISOString()

export function ChatThread({
  messages,
  isTyping,
  suggestions,
  suggestionsLoading,
  draft,
  onSend,
  onDraftChange,
  chatShowTimestamps,
  temporaryChat,
  userXp,
  threadEndRef,
}: ChatThreadProps) {
  return (
    <div className="chat-view">
      {temporaryChat && (
        <output className="chat-temporary-banner chat-thread-spacing">
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
        </output>
      )}

      {!temporaryChat && (!userXp || userXp < 500) && (
        <output className="chat-temporary-banner chat-thread-spacing bg-amber-500/10 border-amber-500/20 text-[var(--mf-text-strong)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WarningCircle size={18} className="text-amber-500 shrink-0" />
            <span className="text-[11.5px] font-normal">
              Free Tier Chat Limit: Reach 100 XP via daily quizzes to unlock unlimited AI translation. (Current XP: {userXp || 0}/100)
            </span>
          </div>
          <div className="w-24 bg-muted/40 h-1.5 rounded-full overflow-hidden border border-border/20 relative shrink-0">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, ((userXp || 0) / 500) * 100)}%` }}
            />
          </div>
        </output>
      )}

      <div className="chat-thread" role="log" aria-live="polite">
        {messages.map((m) => (
          <div key={m.id} className={`chat-bubble chat-bubble--${m.role}`}>
            <span className="chat-role flex items-center gap-1.5">
              {m.role === 'user' ? 'You' : 'MensFlow'}
              {chatShowTimestamps && (
                <time className="chat-time" dateTime={getIsoString(m.createdAt)} suppressHydrationWarning>
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
            <span className="chat-role flex items-center gap-1.5">MensFlow</span>
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

        {!suggestionsLoading && suggestions && suggestions.length > 0 && !isTyping && (
          <div className="chat-suggestions-container mobile-only-suggestions mt-2">
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
        <div ref={threadEndRef} />
      </div>

      <div className="chat-composer-dock p-3 bg-background/80 backdrop-blur-md border-t border-border">
        <div className="max-w-[800px] mx-auto w-full">
          {!suggestionsLoading && suggestions && suggestions.length > 0 && !isTyping && (
            <div className="chat-suggestions-container desktop-only-suggestions">
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
            minimal
            showKeyboardHint
          />
        </div>
      </div>
    </div>
  )
}
