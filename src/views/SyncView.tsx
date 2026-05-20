import { useState } from 'react'
import { Heart, Check, Sparkle } from '@phosphor-icons/react'
import { toast } from 'sonner'


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
      // Simulate writing to localStorage for cross-tab communication
      const pingData = {
        id: option.id,
        label: option.label,
        message: option.message,
        timestamp: Date.now()
      }
      localStorage.setItem('mensflow_partner_ping:v1', JSON.stringify(pingData))
      // Trigger storage event manually for same-page testing
      window.dispatchEvent(new Event('storage'))

      setIsSending(false)
      setSent(true)
      toast.success("Ping sent to partner!")
    }, 800)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 size-80 rounded-full bg-[var(--mf-accent)]/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 size-80 rounded-full bg-pink-500/5 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-card border rounded-3xl p-6 shadow-xl relative overflow-hidden animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center text-center">
          <div className="size-14 rounded-full bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] flex items-center justify-center mb-4">
            <Heart size={28} weight="fill" className="animate-pulse" />
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-[var(--mf-text-strong)]">
            Partner Check-In
          </h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs">
            Let your partner know how you are feeling. This updates their dashboard in real-time to help them support you better.
          </p>
        </div>

        {sent ? (
          <div className="mt-8 flex flex-col items-center text-center py-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="size-16 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mb-4">
              <Check size={32} weight="bold" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--mf-text-strong)]">Check-in Sent!</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Your partner has been notified. They now have tips on how to support you today.
            </p>
            <button 
              onClick={() => { setSent(false); setSelected(null); }}
              className="mt-6 text-xs text-[var(--mf-accent)] hover:underline font-semibold"
            >
              Send another update
            </button>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            <div className="space-y-3">
              <span className="text-xs font-semibold text-[var(--mf-text-strong)] uppercase tracking-wider block">
                How is your body feeling?
              </span>
              
              <div className="grid grid-cols-1 gap-2.5">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setSelected(opt.id)}
                    className={`w-full text-left p-4 rounded-2xl border text-sm font-medium transition-all flex items-center justify-between outline-none ${
                      selected === opt.id
                        ? "border-[var(--mf-accent)] bg-[var(--mf-accent-soft)] text-[var(--mf-accent)] shadow-sm scale-[1.01]"
                        : "border-border hover:bg-muted/30 text-[var(--mf-text-strong)]"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-lg">{opt.icon}</span>
                      <span>{opt.label}</span>
                    </span>
                    {selected === opt.id && (
                      <div className="bg-[var(--mf-accent)] text-white rounded-full p-0.5">
                        <Check size={12} weight="bold" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSendPing}
              disabled={!selected || isSending}
              className="w-full btn btn-primary py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm active:scale-98 transition-transform"
            >
              {isSending ? (
                <span>Sending…</span>
              ) : (
                <>
                  <Sparkle size={16} weight="fill" />
                  <span>Send Real-Time Ping</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
