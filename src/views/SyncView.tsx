import { useState } from 'react'
import { Heart, Check, Sparkle, Users } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { SupportActionsLog } from '../components/dashboard/SupportActionsLog'
import { EmotionTranslator } from '../components/dashboard/EmotionTranslator'

interface StatusOption {
  id: string
  label: string
  icon: string
  message: string
}

const STATUS_OPTIONS: StatusOption[] = [
  { id: 'cramps', label: 'Crampy 😭', icon: '😭', message: "I'm having cramps today." },
  { id: 'exhausted', label: 'Exhausted 🥱', icon: '🥱', message: "I'm feeling very low energy." },
  { id: 'sweets', label: 'Craving Sweets 🍫', icon: '🍫', message: "I'm craving something sweet!" },
  { id: 'space', label: 'Need Space 🤫', icon: '🤫', message: "I just need a quiet day." },
  { id: 'great', label: 'Feeling Great! ✨', icon: '✨', message: "I'm feeling energetic and good!" },
]

export function SyncView() {
  const [selected, setSelected] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSendPing = () => {
    if (!selected) return
    setIsSending(true)
    
    const option = STATUS_OPTIONS.find(o => o.id === selected)
    if (!option) return

    setTimeout(() => {
      const pingData = {
        id: option.id,
        label: option.label,
        message: option.message,
        timestamp: Date.now()
      }
      localStorage.setItem('mensflow_partner_ping:v1', JSON.stringify(pingData))
      window.dispatchEvent(new Event('storage'))

      setIsSending(false)
      setSent(true)
      toast.success("Ping sent to partner!", {
        icon: '💬'
      })
    }, 800)
  }

  return (
    <div className="min-h-screen bg-[var(--mf-bg)] pb-32 relative overflow-x-hidden">
      {/* Hero Banner Area (Flat shadowless header) */}
      <div className="relative border-b border-[var(--mf-border)] bg-[var(--mf-card)] py-10 mb-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-[var(--mf-accent)] flex items-center justify-center text-white">
              <Users size={22} weight="duotone" />
            </div>
            <span className="text-[10px] font-medium uppercase tracking-[0.15em] bg-pink-500/10 text-pink-500 px-3 py-1 rounded-full border border-pink-500/20">
              Interactive Hub
            </span>
          </div>
          {/* Changed font-bold to font-medium for counter letter-shapes at display sizes */}
          <h1 className="text-3xl font-medium tracking-tight text-[var(--mf-text-strong)]">
            Partner Sync & Empathy Hub
          </h1>
          <p className="text-xs text-[var(--mf-muted)] mt-2 max-w-xl leading-relaxed">
            Strengthen your relationship with real-time status pings, hormone decoding translators, and empathetic task sheets aligned with her cycle.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Real-Time Ping Card (Flat shadowless styling) */}
          <div className="lg:col-span-5">
            <div className="bg-[var(--mf-card)] border border-[var(--mf-border)] rounded-[32px] p-6 relative overflow-hidden transition-all duration-300 !shadow-none">
              
              <div className="flex flex-col items-center text-center">
                <div className="size-14 rounded-full bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] flex items-center justify-center mb-4 border border-[var(--mf-accent)]/10">
                  <Heart size={28} weight="fill" className="animate-pulse" />
                </div>

                <h2 className="text-xl font-medium tracking-tight text-[var(--mf-text-strong)]">
                  Send Real-Time Check-In
                </h2>
                <p className="text-[11.5px] text-[var(--mf-muted)] mt-2 max-w-xs leading-relaxed">
                  Let your partner know how your body feels today. This sends an instant notification to coordinate care plans.
                </p>
              </div>

              {sent ? (
                <div className="mt-8 flex flex-col items-center text-center py-8 bg-[var(--mf-composer-bg)] border border-[var(--mf-border)] rounded-2xl animate-in slide-in-from-bottom-4 duration-500">
                  <div className="size-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
                    <Check size={28} weight="bold" />
                  </div>
                  <h3 className="text-base font-medium text-[var(--mf-text-strong)]">Check-in Sent!</h3>
                  <p className="text-[11px] text-[var(--mf-muted)] mt-1.5 max-w-xs px-4 leading-relaxed">
                    Your partner has been notified. They can now view actions to support you during your phase.
                  </p>
                  <button 
                    onClick={() => { setSent(false); setSelected(null); }}
                    className="mt-5 text-xs text-[var(--mf-accent)] hover:underline font-medium"
                  >
                    Send another update
                  </button>
                </div>
              ) : (
                <div className="mt-8 space-y-6">
                  <div className="space-y-3">
                    <span className="text-[10px] font-medium text-[var(--mf-text-strong)] uppercase tracking-wider block">
                      Choose Your Current Feeling:
                    </span>
                    
                    <div className="grid grid-cols-1 gap-2">
                      {STATUS_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => setSelected(opt.id)}
                          className={`w-full text-left p-3.5 rounded-2xl border text-xs font-medium transition-all flex items-center justify-between outline-none !shadow-none ${
                            selected === opt.id
                              ? "border-[var(--mf-accent)] bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] scale-[1.01]"
                              : "border-[var(--mf-border)] hover:bg-[var(--mf-hover)]/30 text-[var(--mf-text-strong)]"
                          }`}
                        >
                          <span className="flex items-center gap-3">
                            <span className="text-base">{opt.icon}</span>
                            <span>{opt.label}</span>
                          </span>
                          {selected === opt.id && (
                            <div className="bg-[var(--mf-accent)] text-white rounded-full p-0.5">
                              <Check size={10} weight="bold" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleSendPing}
                    disabled={!selected || isSending}
                    className="w-full btn btn-primary py-3.5 rounded-2xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-xs active:scale-98 transition-all duration-300"
                  >
                    {isSending ? (
                      <span>Sending Check-in…</span>
                    ) : (
                      <>
                        <Sparkle size={14} weight="fill" />
                        <span>Send Instant Ping</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Empathy Log & Emotion Translator (Flat shadowless components) */}
          <div className="lg:col-span-7 space-y-2">
            <SupportActionsLog />
            <EmotionTranslator />
          </div>

        </div>
      </div>
    </div>
  )
}
