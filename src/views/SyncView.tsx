import { useState, useMemo } from 'react'
import { Check } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { SupportActionsLog } from '../components/dashboard/SupportActionsLog'
import { EmotionTranslator } from '../components/dashboard/EmotionTranslator'
import { useStore } from '../store/useStore'
import { cn } from '../lib/utils'

interface StatusOption {
  id: string
  label: string
  image: string
  message: string
}

const STATUS_OPTIONS: StatusOption[] = [
  { id: 'cramps', label: 'Crampy', image: '/images/cramps.jpg', message: "I'm having cramps today." },
  { id: 'exhausted', label: 'Exhausted', image: '/images/fatique.jpg', message: "I'm feeling very low energy." },
  { id: 'sweets', label: 'Craving Sweets', image: '/images/cravings.png', message: "I'm craving something sweet!" },
  { id: 'space', label: 'Need Space', image: '/images/calm.jpg', message: "I just need a quiet day." },
  { id: 'great', label: 'Feeling Great!', image: '/images/happy.jpg', message: "I'm feeling energetic and good!" },
]

function computeCycleDay(startIso: string, cycleLen: number) {
  const start = new Date(`${startIso}T12:00:00`)
  if (Number.isNaN(+start)) return 1
  const days = Math.floor((Date.now() - +start) / 86400000)
  const m = ((days % cycleLen) + cycleLen) % cycleLen
  return m + 1
}

export function SyncView() {
  const { dashboard: data } = useStore()
  const [selected, setSelected] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [sent, setSent] = useState(false)

  const phase = useMemo(() => {
    const cycleDay = computeCycleDay(data.lastPeriodStart, data.typicalCycleDays)
    const periodLength = 5
    const predictedPeriodLength = 2
    const fertileStart = 10
    const fertileEnd = 16
    const upcomingStart = 23

    if (cycleDay <= periodLength) return 'menstrual'
    if (cycleDay <= periodLength + predictedPeriodLength) return 'follicular'
    if (cycleDay >= fertileStart && cycleDay <= fertileEnd) return 'fertile'
    if (cycleDay >= upcomingStart) return 'luteal'
    return 'follicular'
  }, [data.lastPeriodStart, data.typicalCycleDays])

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
    <div className="dashboard-flo-theme relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <main className="flo-main-container pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
        <div className="flo-content-inner">
          
          <div className="flo-dashboard-top mb-12">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="max-w-xl">
                <div className="flex items-center gap-3 mb-3">
                  <img src="/images/star.png" alt="Star" className="size-5 object-contain" />
                  <span className="text-[10px] font-normal uppercase tracking-[0.15em] bg-pink-500/10 text-pink-500 px-3 py-1 rounded-full border border-pink-500/20">
                    Interactive Hub
                  </span>
                </div>
                <h1 className="text-3xl font-normal tracking-tight text-[var(--mf-text-strong)]">
                  Partner Sync & Empathy Hub
                </h1>
                <p className="text-xs text-[var(--mf-muted)] mt-2 leading-relaxed">
                  Strengthen your relationship with real-time status pings, hormone decoding translators, and empathetic task sheets aligned with her cycle.
                </p>
              </div>
              <div className="hidden md:block shrink-0">
                <img src="/images/lady.png" alt="Empathy Hub Illustration" className="h-24 object-contain opacity-95" />
              </div>
            </div>
          </div>

          <div className="flo-dashboard-grid">
            
            {/* Left Column: Real-Time Ping Card */}
            <section className="flo-dashboard-left">
              <div className="flo-card p-8 relative overflow-hidden transition-all duration-300">
                
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4">
                    <img src="/images/heart.png" alt="Heart" className="size-14 object-contain" />
                  </div>

                  <h2 className="text-xl font-normal tracking-tight text-[var(--mf-text-strong)]">
                    Send Real-Time Check-In
                  </h2>
                  <p className="text-[11.5px] text-[var(--mf-muted)] mt-2 max-w-xs leading-relaxed">
                    Let your partner know how your body feels today. This sends an instant notification to coordinate care plans.
                  </p>
                </div>

                {sent ? (
                  <div className="mt-8 flex flex-col items-center text-center py-8 bg-[var(--mf-composer-bg)] border border-[var(--mf-border)] rounded-2xl animate-in slide-in-from-bottom-4 duration-500">
                    <div className="mb-4">
                      <img src="/images/star.png" alt="Success" className="size-14 object-contain" />
                    </div>
                    <h3 className="text-base font-medium text-[var(--mf-text-strong)]">Check-in Sent!</h3>
                    <p className="text-[11px] text-[var(--mf-muted)] mt-1.5 max-w-xs px-4 leading-relaxed">
                      Your partner has been notified. They can now view actions to support you during your phase.
                    </p>
                    <button 
                      onClick={() => { setSent(false); setSelected(null); }}
                      className="mt-5 text-xs text-[var(--mf-accent)] hover:underline font-normal"
                    >
                      Send another update
                    </button>
                  </div>
                ) : (
                  <div className="mt-8 space-y-6">
                    <div className="space-y-3">
                      <span className="text-[10px] font-normal text-[var(--mf-text-strong)] uppercase tracking-wider block">
                        Choose Your Current Feeling:
                      </span>
                      
                      <div className="grid grid-cols-2 gap-3">
                        {STATUS_OPTIONS.map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => setSelected(opt.id)}
                            type="button"
                            className={`relative overflow-hidden aspect-[4/3] rounded-2xl border text-left p-3.5 transition-all flex flex-col justify-between outline-none group ${
                              selected === opt.id
                                ? "border-[var(--mf-accent)] ring-1 ring-[var(--mf-accent)] scale-[1.01]"
                                : "border-[var(--mf-border)] hover:border-[var(--mf-accent)]/45"
                            }`}
                          >
                            <div className="absolute inset-0 bg-black/45 group-hover:bg-black/50 transition-colors z-10" />
                            <img src={opt.image} alt={opt.label} className="absolute inset-0 size-full object-cover z-0 transition-transform duration-500 group-hover:scale-105" />
                            
                            <div className="flex justify-end w-full z-20">
                              <div className={`rounded-full p-1 border transition-all ${
                                selected === opt.id
                                  ? "bg-[var(--mf-accent)] text-white border-[var(--mf-accent)]"
                                  : "bg-black/30 text-transparent border-white/40"
                              }`}>
                                <Check size={10} weight="bold" />
                              </div>
                            </div>
                            
                            <span className="text-white text-[11px] font-normal tracking-wide z-20 mt-auto drop-shadow-sm">
                              {opt.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleSendPing}
                      disabled={!selected || isSending}
                      className="w-full btn btn-primary py-3.5 rounded-2xl font-normal flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-xs active:scale-98 transition-all duration-300"
                    >
                      {isSending ? (
                        <span>Sending Check-in…</span>
                      ) : (
                        <>
                          <img src="/images/star.png" alt="Star" className="size-4 object-contain" />
                          <span>Send Instant Ping</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Right Column: Empathy Log & Emotion Translator */}
            <section className="flo-dashboard-right space-y-8">
              <SupportActionsLog />
              <EmotionTranslator />
            </section>

          </div>
        </div>
      </main>
    </div>
  )
}
