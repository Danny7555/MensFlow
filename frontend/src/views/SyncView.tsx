import { useState, useMemo } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { Check, Sparkle,  PaperPlaneTilt } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { SupportActionsLog } from '../components/dashboard/SupportActionsLog'
import { EmotionTranslator } from '../components/dashboard/EmotionTranslator'
import { useStore } from '../store/useStore'
import { partnerApi } from '../lib/api'
import { cn } from '../lib/utils'
import { computeCycleDay, getPhaseFromDay, getPhaseTasks } from '../lib/cycleUtils'

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

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
}

const floatVariants: Variants = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
}

function SupportHistory() {
  const { completedActions } = useStore()
  const allPossibleTasks = [
    ...getPhaseTasks('menstrual'),
    ...getPhaseTasks('follicular'),
    ...getPhaseTasks('ovulatory'),
    ...getPhaseTasks('luteal'),
  ]

  const completed = allPossibleTasks.filter(t => completedActions.includes(t.id))

  if (completed.length === 0) return null

  return (
    <m.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flo-card p-6 border border-[var(--mf-border)] !shadow-none"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="size-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
          <Check size={18} weight="bold" />
        </div>
        <h3 className="text-base font-medium text-[var(--mf-text-strong)]">Shared Support History</h3>
      </div>
      <div className="space-y-3">
        {completed.slice(-3).reverse().map((task) => (
          <div key={task.id} className="flex items-center justify-between text-[11.5px] py-2 border-b border-border/40 last:border-0">
            <div className="flex items-center gap-2.5">
              <img src="/images/heart.png" alt="" className="size-3.5 object-contain" />
              <span className="text-[var(--mf-text)]">{task.label}</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Completed</span>
          </div>
        ))}
      </div>
    </m.div>
  )
}

export function SyncView() {
  const { dashboard: data } = useStore()
  const [selected, setSelected] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [sent, setSent] = useState(false)

  const phase = useMemo(() => {
    const cycleDay = computeCycleDay(data.lastPeriodStart, data.typicalCycleDays)
    return getPhaseFromDay(cycleDay)
  }, [data.lastPeriodStart, data.typicalCycleDays])

  const handleSendPing = async () => {
    if (!selected) return
    setIsSending(true)
    
    const option = STATUS_OPTIONS.find(o => o.id === selected)
    if (!option) { setIsSending(false); return }

    try {
      await partnerApi.sendPing(option.id, option.label, option.message)
      setIsSending(false)
      setSent(true)
      toast.success('Ping sent to partner!', { icon: '💬' })
    } catch (err: any) {
      setIsSending(false)
      toast.error(err.message ?? 'Failed to send ping')
    }
  }

  return (
    <m.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="dashboard-flo-theme relative overflow-hidden"
    >
      {/* Dynamic Background Glow - Softer and more subtle */}
      <AnimatePresence mode="wait">
        <m.div 
          key={phase}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
          className={cn(
            "absolute -top-[10%] -left-[10%] w-[120%] h-[120%] blur-[120px] pointer-events-none z-0",
            phase === 'menstrual' && "bg-gradient-radial from-rose-500/10 via-transparent to-transparent",
            phase === 'follicular' && "bg-gradient-radial from-teal-500/10 via-transparent to-transparent",
            phase === 'fertile' && "bg-gradient-radial from-sky-500/10 via-transparent to-transparent",
            phase === 'luteal' && "bg-gradient-radial from-amber-500/10 via-transparent to-transparent"
          )} 
        />
      </AnimatePresence>

      <main className="flo-main-container pb-32 relative z-10">
        <div className="flo-content-inner">
          
          <m.div variants={itemVariants} className="flo-dashboard-top mb-12">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="max-w-xl">
                <div className="flex items-center gap-3 mb-3">
                  <m.img 
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    src="/images/star.png" alt="Star" className="size-5 object-contain" 
                  />
                  <span className="text-[10px] font-normal uppercase tracking-[0.15em] bg-pink-500/10 text-pink-500 px-3 py-1 rounded-full border border-pink-500/20">
                    Interactive Hub
                  </span>
                </div>
                <h1 className="text-4xl font-normal tracking-tight text-[var(--mf-text-strong)] leading-[1.1]">
                  Partner Sync & <br />
                  <span className="text-[var(--mf-accent)]">Empathy Hub</span>
                </h1>
                <p className="text-sm text-[var(--mf-muted)] mt-4 leading-relaxed max-w-lg">
                  Strengthen your relationship with real-time status pings, hormone decoding translators, and empathetic task sheets aligned with her cycle.
                </p>
              </div>
              <m.div 
                variants={floatVariants}
                animate="animate"
                className="hidden md:block shrink-0"
              >
                <img src="/images/lady.png" alt="Empathy Hub Illustration" className="h-32 object-contain opacity-95" />
              </m.div>
            </div>
          </m.div>

          <div className="flo-dashboard-grid">
            
            {/* Left Column: Real-Time Ping Card */}
            <m.section variants={itemVariants} className="flo-dashboard-left">
              <div className="flo-card p-8 relative overflow-hidden transition-all duration-300">
                
                <div className="flex flex-col items-center text-center">
                  <m.div 
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="mb-4"
                  >
                    <img src="/images/heart.png" alt="Heart" className="size-14 object-contain" />
                  </m.div>

                  <h2 className="text-xl font-normal tracking-tight text-[var(--mf-text-strong)]">
                    Send Real-Time Check-In
                  </h2>
                  <p className="text-[11.5px] text-[var(--mf-muted)] mt-2 max-w-xs leading-relaxed">
                    Let your partner know how your body feels today. This sends an instant notification to coordinate care plans.
                  </p>
                </div>

                {sent ? (
                  <m.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-8 flex flex-col items-center text-center py-8 bg-[var(--mf-composer-bg)] border border-[var(--mf-border)] rounded-2xl"
                  >
                    <div className="mb-4">
                      <Sparkle size={48} weight="fill" className="text-pink-400 animate-pulse" />
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
                  </m.div>
                ) : (
                  <div className="mt-8 space-y-6">
                    <div className="space-y-3">
                      <span className="text-[10px] font-normal text-[var(--mf-text-strong)] uppercase tracking-wider block">
                        Choose Your Current Feeling:
                      </span>
                      
                      <div className="grid grid-cols-2 gap-3">
                        {STATUS_OPTIONS.map((opt) => (
                          <m.button
                            key={opt.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelected(opt.id)}
                            type="button"
                            className={cn(
                              "relative overflow-hidden aspect-[4/3] rounded-2xl border text-left p-3.5 transition-all flex flex-col justify-between outline-none group",
                              selected === opt.id
                                ? "border-[var(--mf-accent)] ring-1 ring-[var(--mf-accent)]"
                                : "border-[var(--mf-border)] hover:border-[var(--mf-accent-border)]"
                            )}
                          >
                            <div className="absolute inset-0 bg-black/45 group-hover:bg-black/50 transition-colors z-10" />
                            <img src={opt.image} alt={opt.label} className="absolute inset-0 size-full object-cover z-0 transition-transform duration-700 group-hover:scale-110" />
                            
                            <div className="flex justify-end w-full z-20">
                              <div className={cn(
                                "rounded-full p-1 border transition-all",
                                selected === opt.id
                                  ? "bg-[var(--mf-accent)] text-white border-[var(--mf-accent)]"
                                  : "bg-black/30 text-transparent border-white/40"
                              )}>
                                <Check size="10" weight="bold" />
                              </div>
                            </div>
                            
                            <span className="text-white text-[11px] font-normal tracking-wide z-20 mt-auto drop-shadow-sm">
                              {opt.label}
                            </span>
                          </m.button>
                        ))}
                      </div>
                    </div>

                    <m.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={handleSendPing}
                      disabled={!selected || isSending}
                      className="w-full h-12 bg-[var(--mf-accent)] text-white rounded-2xl font-normal flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-xs transition-all !shadow-none"
                    >
                      {isSending ? (
                        <div className="flex items-center gap-2">
                          <m.div 
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Sparkle size={16} weight="bold" />
                          </m.div>
                          <span>Sending Check-in…</span>
                        </div>
                      ) : (
                        <>
                          <PaperPlaneTilt size={16} weight="bold" />
                          <span>Send Instant Ping</span>
                        </>
                      )}
                    </m.button>
                  </div>
                )}
              </div>
            </m.section>

            {/* Right Column: Empathy Log & Emotion Translator */}
            <m.section variants={itemVariants} className="flo-dashboard-right space-y-8">
              <SupportActionsLog />
              <EmotionTranslator />
              <SupportHistory />
            </m.section>

          </div>
        </div>
      </main>
    </m.div>
  )
}
