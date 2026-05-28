import { useState, useMemo, useEffect } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { Check, Sparkle, PaperPlaneTilt, LinkSimple, Copy, ArrowRight, Users } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { SupportActionsLog } from '../components/dashboard/SupportActionsLog'
import { EmotionTranslator } from '../components/dashboard/EmotionTranslator'
import { useStore } from '../store/useStore'
import { useAuth } from '../context/useAuth'
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

const SUPPORT_PING_OPTIONS: StatusOption[] = [
  { id: 'chocolate', label: 'Bring Chocolate', image: '/images/cravings.png', message: "I'm on my way home with some sweet treats for you! 🍫" },
  { id: 'dinner', label: 'Cook Dinner', image: '/images/cramps.jpg', message: "Don't worry about dinner tonight, I've got it covered! 🍳" },
  { id: 'hug', label: 'Warm Hug', image: '/images/happy.jpg', message: "Just wanted to send you a warm hug and remind you I'm here. ❤️" },
  { id: 'space', label: 'Give Space', image: '/images/calm.jpg', message: "I'll make sure you have a quiet, peaceful space to rest today. 🤫" },
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
  const { dashboard: ownDashboard, partnerStatus, fetchPartnerStatus, user, pairPartner } = useStore()
  const { isAuthenticated, openAuthModal } = useAuth()
  const [selected, setSelected] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [partnerCodeInput, setPartnerCodeInput] = useState('')
  const [isPairing, setIsPairing] = useState(false)

  const handlePair = async () => {
    if (!partnerCodeInput.trim()) return
    setIsPairing(true)
    await pairPartner(partnerCodeInput.trim())
    setPartnerCodeInput('')
    setIsPairing(false)
  }

  useEffect(() => {
    if (user?.role === 'partner') {
      fetchPartnerStatus()
    }
  }, [user?.role, fetchPartnerStatus])

  const data = useMemo(() => {
    if (user?.role === 'partner' && partnerStatus?.paired && partnerStatus?.cycle) {
      return partnerStatus.cycle
    }
    return ownDashboard
  }, [user?.role, partnerStatus, ownDashboard])

  const phase = useMemo(() => {
    const cycleDay = computeCycleDay(data.lastPeriodStart, data.typicalCycleDays)
    return getPhaseFromDay(cycleDay)
  }, [data.lastPeriodStart, data.typicalCycleDays])

  const options = user?.role === 'partner' ? SUPPORT_PING_OPTIONS : STATUS_OPTIONS

  const handleSendPing = async () => {
    if (!selected) return
    setIsSending(true)
    
    const option = options.find(o => o.id === selected)
    if (!option) { setIsSending(false); return }

    try {
      await partnerApi.sendPing(option.id, option.label, option.message)
      setIsSending(false)
      setSent(true)
      toast.success(user?.role === 'partner' ? 'Support ping sent to partner!' : 'Ping sent to partner!', { icon: '💬' })
    } catch (err: unknown) {
      setIsSending(false)
      toast.error(err instanceof Error ? err.message : 'Failed to send ping')
    }
  }

  if (!partnerStatus?.paired) {
    return (
      <m.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="dashboard-flo-theme relative overflow-hidden min-h-screen"
      >
        {/* Ambient background */}
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-pink-500/10 to-purple-500/5 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-rose-500/8 to-transparent blur-[100px] pointer-events-none" />

        <main className="flo-main-container pb-32 relative z-10">
          <div className="flo-content-inner max-w-3xl mx-auto">

            {/* Hero Header */}
            <m.div variants={itemVariants} className="text-center pt-10 pb-8 space-y-4">
              <m.div
                animate={{ y: [0, -12, 0], rotate: [0, 3, -3, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="inline-block mb-2"
              >
                <div className="relative">
                  <div className="size-24 rounded-full bg-gradient-to-br from-pink-400 to-rose-600 flex items-center justify-center shadow-xl shadow-pink-500/20">
                    <Users size={40} weight="duotone" className="text-white" />
                  </div>
                  <div className="absolute -right-1 -bottom-1 size-7 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center border-2 border-white dark:border-gray-900">
                    <LinkSimple size={14} weight="bold" className="text-white" />
                  </div>
                </div>
              </m.div>

              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] bg-pink-500/10 text-pink-500 dark:text-pink-400 px-3 py-1 rounded-full border border-pink-500/20">
                  Partner Sync
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-normal tracking-tight text-[var(--mf-text-strong)] leading-tight">
                Connect with your partner
              </h1>
              <p className="text-sm text-[var(--mf-muted)] max-w-md mx-auto leading-relaxed">
                {user?.role === 'partner'
                  ? 'Pair with your partner to see her cycle phases, receive daily care checklists, and send real-time supportive updates.'
                  : 'Invite your partner to sync cycles, share mood check-ins, and build daily care routines together.'}
              </p>
            </m.div>

            {/* How it works */}
            <m.div variants={itemVariants} className="grid grid-cols-3 gap-4 mb-8">
              {[
                { step: '1', title: 'Copy your code', desc: 'Get your unique 6-character code below', icon: Copy },
                { step: '2', title: 'Share it', desc: 'Send the code to your partner via message', icon: PaperPlaneTilt },
                { step: '3', title: 'Connect', desc: 'They enter it and you sync instantly', icon: LinkSimple },
              ].map(({ step, title, desc, icon: Icon }) => (
                <div key={step} className="p-4 rounded-2xl bg-[var(--mf-composer-bg)] border border-[var(--mf-border)] text-center space-y-2">
                  <div className="size-8 rounded-full bg-[var(--mf-accent)]/10 text-[var(--mf-accent)] flex items-center justify-center mx-auto">
                    <Icon size={16} weight="bold" />
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Step {step}</p>
                  <p className="text-xs font-medium text-[var(--mf-text-strong)]">{title}</p>
                  <p className="text-[10px] text-[var(--mf-muted)] leading-relaxed">{desc}</p>
                </div>
              ))}
            </m.div>

            {/* Pairing cards */}
            {!isAuthenticated ? (
              <m.div
                variants={itemVariants}
                className="p-8 rounded-[2rem] bg-gradient-to-br from-pink-500/10 via-[var(--mf-composer-bg)] to-[var(--mf-composer-bg)] border border-[var(--mf-border)] text-center space-y-6 relative overflow-hidden max-w-xl mx-auto shadow-xl"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />
                <div className="relative z-10 space-y-4">
                  <div className="size-12 rounded-2xl bg-pink-500/10 flex items-center justify-center mx-auto text-pink-500 animate-pulse">
                    <Users size={24} weight="bold" />
                  </div>
                  <h3 className="text-lg font-medium text-[var(--mf-text-strong)]">Pairing requires an account</h3>
                  <p className="text-xs text-[var(--mf-muted)] max-w-sm mx-auto leading-relaxed">
                    Create an account or sign in to generate a secure pairing code and start syncing with your partner.
                  </p>
                  <m.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={openAuthModal}
                    className="inline-flex items-center gap-2 bg-[var(--mf-accent)] text-white hover:opacity-95 px-6 py-3 rounded-xl text-xs font-semibold shadow-lg shadow-[var(--mf-accent)]/20 transition-all cursor-pointer border-0 outline-none"
                  >
                    <span>Sign In or Sign Up</span>
                    <ArrowRight size={14} weight="bold" />
                  </m.button>
                </div>
              </m.div>
            ) : (
              <m.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* Your code card */}
                <div className="p-6 rounded-[1.5rem] bg-gradient-to-br from-pink-500/8 via-[var(--mf-composer-bg)] to-[var(--mf-composer-bg)] border border-[var(--mf-border)] space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-full blur-2xl" />
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-xl bg-pink-500/10 flex items-center justify-center">
                        <Copy size={14} weight="bold" className="text-pink-500" />
                      </div>
                      <span className="text-xs font-semibold text-[var(--mf-text-strong)]">Your Pairing Code</span>
                    </div>
                    <p className="text-[11px] text-[var(--mf-muted)] leading-relaxed">
                      Share this code with your partner. They'll enter it on their Partner Sync page to connect with you.
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-mono font-bold tracking-[0.3em] text-[var(--mf-text-strong)] bg-white dark:bg-white/5 px-4 py-2.5 rounded-xl border border-[var(--mf-border)] select-all flex-1 text-center">
                        {user?.partnerCode ?? '- - - - - -'}
                      </span>
                      <m.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        type="button"
                        onClick={() => {
                          if (user?.partnerCode) {
                            navigator.clipboard.writeText(user.partnerCode)
                            toast.success('Pairing code copied!', {
                              description: 'Send this code to your partner so they can connect with you.',
                            })
                          }
                        }}
                        className="size-11 shrink-0 rounded-xl bg-[var(--mf-accent)] text-white hover:opacity-90 flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-[var(--mf-accent)]/20"
                      >
                        <Copy size={18} weight="bold" />
                      </m.button>
                    </div>
                  </div>
                </div>

                {/* Enter partner's code */}
                <div className="p-6 rounded-[1.5rem] bg-gradient-to-br from-purple-500/8 via-[var(--mf-composer-bg)] to-[var(--mf-composer-bg)] border border-[var(--mf-border)] space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl" />
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-xl bg-purple-500/10 flex items-center justify-center">
                        <LinkSimple size={14} weight="bold" className="text-purple-500" />
                      </div>
                      <span className="text-xs font-semibold text-[var(--mf-text-strong)]">Enter Partner's Code</span>
                    </div>
                    <p className="text-[11px] text-[var(--mf-muted)] leading-relaxed">
                      Got a code from your partner? Enter it below to pair and start syncing your cycles together.
                    </p>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="e.g. XY82HA"
                        value={partnerCodeInput}
                        onChange={(e) => setPartnerCodeInput(e.target.value.toUpperCase())}
                        className="w-full bg-white dark:bg-white/5 border border-[var(--mf-border)] rounded-xl px-4 py-3 text-base font-mono tracking-[0.3em] text-center font-bold focus:outline-none focus:ring-2 focus:ring-[var(--mf-accent)]/50 focus:border-[var(--mf-accent)] uppercase text-[var(--mf-text-strong)] transition-all text-sm font-semibold"
                        maxLength={6}
                      />
                      <m.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        type="button"
                        disabled={isPairing || !partnerCodeInput.trim()}
                        onClick={handlePair}
                        className="w-full h-11 bg-[var(--mf-accent)] text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[var(--mf-accent)]/20 hover:opacity-95"
                      >
                        {isPairing ? (
                          <m.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                            <Sparkle size={16} weight="bold" />
                          </m.div>
                        ) : (
                          <>
                            <LinkSimple size={16} weight="bold" />
                            <span>Connect with Partner</span>
                            <ArrowRight size={14} weight="bold" />
                          </>
                        )}
                      </m.button>
                    </div>
                  </div>
                </div>
              </m.div>
            )}

            {/* Trust note */}
            <m.p variants={itemVariants} className="text-center text-[10px] text-muted-foreground mt-6">
              🔒 Your health data is always private. Only aggregated cycle phase info is shared with your partner.
            </m.p>

          </div>
        </main>
      </m.div>
    )
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
                    {user?.role === 'partner' ? 'Send supportive update' : 'Send Real-Time Check-In'}
                  </h2>
                  <p className="text-[11.5px] text-[var(--mf-muted)] mt-2 max-w-xs leading-relaxed">
                    {user?.role === 'partner' 
                      ? 'Let your partner know how you are supporting her today. This sends an instant notification to her phone.'
                      : 'Let your partner know how your body feels today. This sends an instant notification to coordinate care plans.'}
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
                    <h3 className="text-base font-medium text-[var(--mf-text-strong)]">
                      {user?.role === 'partner' ? 'Support Update Sent!' : 'Check-in Sent!'}
                    </h3>
                    <p className="text-[11px] text-[var(--mf-muted)] mt-1.5 max-w-xs px-4 leading-relaxed">
                      {user?.role === 'partner'
                        ? 'Your partner has been notified. Keep up the supportive gestures!'
                        : 'Your partner has been notified. They can now view actions to support you during your phase.'}
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
                        {user?.role === 'partner' ? 'Choose Your Supportive Action:' : 'Choose Your Current Feeling:'}
                      </span>
                      
                      <div className="grid grid-cols-2 gap-3">
                        {options.map((opt) => (
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
              {user?.role === 'partner' && <SupportActionsLog />}
              {user?.role === 'partner' && <EmotionTranslator />}
              <SupportHistory />
            </m.section>

          </div>
        </div>
      </main>
    </m.div>
  )
}
