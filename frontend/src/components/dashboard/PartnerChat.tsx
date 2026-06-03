import React, { useState, useEffect, useRef } from 'react'
import { 
  ChatCircle, 
  PaperPlaneTilt, 
  Sparkle, 
  CircleNotch,
  ArrowRight
} from '@phosphor-icons/react'
import { useStore } from '../../store/useStore'
import { 
  usePartnerChatMessagesQuery, 
  useSendPartnerChatMessageMutation, 
  usePartnerChatSuggestionsQuery 
} from '../../services/partnerService'
import { toast } from 'sonner'
import { cn } from '../../lib/utils'

const formatMessageTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const today = new Date()
  const isToday = date.toDateString() === today.toDateString()
  
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (isToday) {
    return timeStr
  }
  const month = date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  return `${month}, ${timeStr}`
}

export function PartnerChat() {
  const { user, partnerStatus } = useStore()
  const isPartner = user?.role === 'partner'
  const partnerName = partnerStatus?.partner?.name || 'Partner'

  const [messageText, setMessageText] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Query message history with 3-second refetch for a live-chat experience
  const { data: messages = [], isLoading: messagesLoading } = usePartnerChatMessagesQuery({
    refetchInterval: 3000,
  })

  // Send message mutation
  const sendMutation = useSendPartnerChatMessageMutation()

  // Suggestions query
  const { 
    data: suggestions = [], 
    isLoading: suggestionsLoading, 
    refetch: refetchSuggestions 
  } = usePartnerChatSuggestionsQuery()

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = messageText.trim()
    if (!text || sendMutation.isPending) return

    try {
      await sendMutation.mutateAsync(text)
      setMessageText('')
      setShowSuggestions(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send message')
    }
  }

  const handleSelectSuggestion = (suggestion: string) => {
    setMessageText(suggestion)
    toast.success('Suggestion pre-filled! Edit or send.', { duration: 2000 })
  }

  const handleToggleSuggestions = () => {
    if (!showSuggestions) {
      refetchSuggestions()
    }
    setShowSuggestions(!showSuggestions)
  }

  if (!partnerStatus?.paired) {
    return null
  }

  return (
    <div className="flo-card relative overflow-hidden transition-all duration-300 border border-[var(--mf-border)] !shadow-none p-5 flex flex-col max-h-[500px]">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-[var(--mf-border)] mb-4">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-full bg-[var(--mf-accent)]/10 flex items-center justify-center text-[var(--mf-accent)]">
            <ChatCircle size={18} weight="duotone" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-[var(--mf-text-strong)] leading-none">
              Direct Partner Chat
            </h3>
            <span className="text-[10px] text-[var(--mf-muted)] mt-1 inline-block">
              Chatting with {partnerName}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-500 text-[10px] px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-medium">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Connected
        </div>
      </div>

      {/* Messages list */}
      <div className="overflow-y-auto pr-1 space-y-3 mb-3 scrollbar-thin">
        {messagesLoading && messages.length === 0 ? (
          <div className="flex items-center justify-center py-4">
            <CircleNotch size={24} className="animate-spin text-[var(--mf-muted)]" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center">
            <div className="size-12 rounded-full bg-[var(--mf-hover)]/30 flex items-center justify-center mb-3">
              <ChatCircle size={22} className="text-[var(--mf-muted)]" />
            </div>
            <p className="text-xs text-[var(--mf-text-strong)] font-medium">No messages yet</p>
            <p className="text-[10px] text-[var(--mf-muted)] mt-1 max-w-[200px] leading-relaxed">
              Send a message to your partner to start coordinating care plans and support!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === user.id
            return (
              <div 
                key={msg.id} 
                className={cn(
                  "flex flex-col max-w-[85%]", 
                  isMe ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <div 
                  className={cn(
                    "px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed", 
                    isMe 
                      ? "bg-[var(--mf-accent)] text-white rounded-tr-none" 
                      : "bg-[var(--mf-hover)] text-[var(--mf-text-strong)] rounded-tl-none border border-[var(--mf-border)]"
                  )}
                >
                  {msg.text}
                </div>
                <span className="text-[9px] text-[var(--mf-muted)] mt-1 px-1">
                  {formatMessageTime(msg.createdAt)}
                </span>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested replies helper section for partner */}
      {isPartner && showSuggestions && (
        <div className="mb-3 p-3 rounded-2xl bg-[var(--mf-hover)]/40 border border-[var(--mf-border)] animate-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--mf-text-strong)] font-medium mb-2">
            <Sparkle size={12} weight="fill" className="text-[var(--mf-accent)]" />
            <span>AI Empathetic Suggestions:</span>
          </div>
          {suggestionsLoading ? (
            <div className="flex items-center gap-2 py-1 text-[10px] text-[var(--mf-muted)]">
              <CircleNotch size={12} className="animate-spin" />
              <span>Analyzing her logs and phase…</span>
            </div>
          ) : suggestions.length === 0 ? (
            <span className="text-[10px] text-[var(--mf-muted)] italic">No suggestions available</span>
          ) : (
            <div className="space-y-1.5">
              {suggestions.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => handleSelectSuggestion(sug)}
                  className="w-full text-left p-2 rounded-xl text-[11px] bg-[var(--mf-card)] hover:bg-[var(--mf-hover)] border border-[var(--mf-border)] hover:border-[var(--mf-accent)]/40 transition-all text-[var(--mf-text-strong)] flex items-center justify-between group"
                >
                  <span>{sug}</span>
                  <ArrowRight size={10} className="opacity-0 group-hover:opacity-100 text-[var(--mf-accent)] transition-all shrink-0 ml-1.5" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Input composer */}
      <form onSubmit={handleSend} className="relative flex items-center gap-2">
        {isPartner && (
          <button
            type="button"
            onClick={handleToggleSuggestions}
            className={cn(
              "size-10 rounded-xl flex items-center justify-center shrink-0 border transition-all active:scale-95",
              showSuggestions 
                ? "bg-[var(--mf-accent)]/15 border-[var(--mf-accent)]/30 text-[var(--mf-accent)]"
                : "bg-[var(--mf-hover)] border-[var(--mf-border)] hover:border-[var(--mf-accent)]/40 text-[var(--mf-text-strong)]"
            )}
            title="Ask AI what to say"
          >
            <Sparkle size={16} weight={showSuggestions ? "fill" : "bold"} />
          </button>
        )}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Type a message…"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            disabled={sendMutation.isPending}
            aria-label="Type a message to partner"
            className="w-full h-10 pl-3.5 pr-10 rounded-xl bg-[var(--mf-hover)] border border-[var(--mf-border)] text-xs text-[var(--mf-text-strong)] placeholder-[var(--mf-muted)] focus:outline-none focus:border-[var(--mf-accent)]/60 focus:ring-1 focus:ring-[var(--mf-accent)]/60 transition-all"
          />
          <button
            type="submit"
            disabled={!messageText.trim() || sendMutation.isPending}
            className="absolute right-1 top-1 size-8 rounded-lg bg-[var(--mf-accent)] hover:opacity-95 text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 border-0 cursor-pointer"
          >
            {sendMutation.isPending ? (
              <CircleNotch size={14} className="animate-spin" />
            ) : (
              <PaperPlaneTilt size={14} weight="bold" />
            )}
          </button>
        </div>
      </form>

    </div>
  )
}
