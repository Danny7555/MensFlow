/* eslint-disable */
import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { m } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { Check, Sparkle, PaperPlaneTilt, LinkSimple, Copy, ArrowRight, Users, ChatCircle, Lock, ShareNetwork } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { PartnerChat } from '../components/dashboard/PartnerChat'
import { PresenceBadge } from '../components/dashboard/PresenceBadge'
import { useStore } from '../store/useStore'
import { resolveAssetUrl } from '../lib/apiClient'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog"


import { useAuth } from '../context/useAuth'
import { partnerApi } from '../services/partnerService'
import { cn } from '../lib/utils'
import { getPhaseTasks } from '../lib/cycleUtils'
import { Button } from '@/components/ui/button'

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
  { id: 'hug', label: 'Warm Hug', image: '/images/happy.jpg', message: "Just wanted to send you a warm hug and remind you I'm here." },
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



const allPossibleTasks = [
  ...getPhaseTasks('menstrual'),
  ...getPhaseTasks('follicular'),
  ...getPhaseTasks('ovulatory'),
  ...getPhaseTasks('luteal'),
]

function SupportHistory() {
  const { completedActions } = useStore()

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
              <img loading="lazy" src="/images/heart.png" alt="" className="size-3.5 object-contain shrink-0" />
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
  const { partnerStatus, fetchPartnerStatus, user, pairPartner } = useStore()
  const { isAuthenticated, openAuthModal } = useAuth()
  const mainRef = useRef<HTMLElement>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [partnerCodeInput, setPartnerCodeInput] = useState('')
  const [isPairing, setIsPairing] = useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [isInviting, setIsInviting] = useState(false)
  const [copied, setCopied] = useState(false)

  // Pre-fill pairing code from URL query param if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (code) {
      const timer = setTimeout(() => {
        setPartnerCodeInput(code.toUpperCase())
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [])

  const handlePair = async () => {
    if (!partnerCodeInput.trim()) return
    setIsPairing(true)
    await pairPartner(partnerCodeInput.trim())
    setPartnerCodeInput('')
    setIsPairing(false)
  }

  const inviteUrl = `${window.location.origin}/sync?code=${user?.partnerCode || ''}`
  const copyLink = () => {
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSendInvite = async () => {
    const email = inviteEmail.trim()
    if (!email) return
    setIsInviting(true)
    try {
      await useStore.getState().invitePartner(email)
      setInviteEmail('')
      setIsInviteModalOpen(false)
      toast.success('Invitation sent!')
    } catch {
      // Handled in store
    } finally {
      setIsInviting(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated && user?.role) {
      fetchPartnerStatus()
    }
  }, [isAuthenticated, user?.role, fetchPartnerStatus])

  // Always start at the top when this view opens
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
    const appCanvas = document.querySelector('.app-canvas') as HTMLElement | null
    if (appCanvas) appCanvas.scrollTop = 0
    // Run again after layout settles in case SSR/SPA deferred paint
    const id = requestAnimationFrame(() => {
      window.scrollTo(0, 0)
      if (appCanvas) appCanvas.scrollTop = 0
    })
    return () => cancelAnimationFrame(id)
  }, [])

  const options = user?.role === 'partner' ? SUPPORT_PING_OPTIONS : STATUS_OPTIONS

  const handleSendPing = async () => {
    if (!selected) return
    setIsSending(true)
    
    const option = options.find(o => o.id === selected)
    if (!option) { setIsSending(false); return }

    try {
      if (isAuthenticated) {
        await partnerApi.sendPing(option.id, option.label, option.message)
      }

      // Broadcast ping details via localStorage for cross-tab sync support
      const pingData = {
        id: option.id,
        label: option.label,
        message: option.message,
        senderId: user?.id || 'guest',
        senderRole: user?.role || 'lady',
        timestamp: Date.now()
      }
      localStorage.setItem('mensflow_partner_ping:v1', JSON.stringify(pingData))
      window.dispatchEvent(new Event('storage'))

      setIsSending(false)
      setSent(true)
      toast.success(user?.role === 'partner' ? 'Support ping sent to partner!' : 'Ping sent to partner!', { icon: <ChatCircle size={16} weight="fill" className="text-teal-500" /> })
    } catch (err: unknown) {
      setIsSending(false)
      toast.error(err instanceof Error ? err.message : 'Failed to send ping')
    }
  }

  if (partnerStatus === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="size-8 rounded-full border-2 border-[var(--mf-border)] border-t-[var(--mf-accent)] animate-spin" />
      </div>
    )
  }

  if (!partnerStatus?.paired) {
    return (
      <m.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="dashboard-flo-theme relative overflow-hidden min-h-screen"
      >
        <main ref={mainRef} className="flo-main-container pb-32 relative z-10">
          <div className="flo-content-inner max-w-3xl mx-auto">
            {/* Hero Header */}
              <m.div variants={itemVariants} className="text-center pt-8 pb-6 space-y-4">
                <div className="inline-block">
                  <div className="relative inline-flex">
                    <div className="size-20 rounded-full bg-gradient-to-br from-pink-400 to-rose-600 flex items-center justify-center">
                      <Users size={32} weight="duotone" className="text-white" />
                    </div>
                    <div className="absolute -right-0.5 -bottom-0.5 size-6 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center border-2 border-white dark:border-gray-900">
                      <LinkSimple size={12} weight="bold" className="text-white" />
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-normal uppercase tracking-[0.2em] bg-pink-500/10 text-pink-500 dark:text-pink-400 px-3 py-1 rounded-full border border-pink-500/20">
                    Partner Sync
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-normal tracking-tight text-[var(--mf-text-strong)] leading-tight">
                  Connect with your partner
                </h1>
                <p className="text-sm text-[var(--mf-muted)] max-w-md mx-auto leading-relaxed">
                  {user?.role === 'partner'
                    ? 'Enter the code your partner shared with you to sync cycles and start receiving daily care checklists.'
                    : 'Share your unique code with your partner so they can sync with your cycle and support you better.'}
                </p>
              </m.div>

            {/* How it works — role-aware */}
            <m.div variants={itemVariants} className="mb-8">
              <div className="flo-card p-5 border border-[var(--mf-border)] !shadow-none">
                <h3 className="text-[10px] font-normal uppercase tracking-[0.2em] text-muted-foreground mb-5 text-center">
                  How it works
                </h3>
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 relative">
                  {(user?.role === 'partner' ? [
                    { step: '1', title: 'Get the code', desc: "Ask your partner to open her Sync page and copy her code", icon: Copy },
                    { step: '2', title: 'Enter it below', desc: 'Paste or type the 6-character code in the field below', icon: LinkSimple },
                    { step: '3', title: "You're connected!", desc: 'See her cycle phases and send real-time care updates', icon: PaperPlaneTilt },
                  ] : [
                    { step: '1', title: 'Copy your code', desc: 'Get your unique 6-character code below', icon: Copy },
                    { step: '2', title: 'Share it', desc: 'Send the code to your partner via message or any app', icon: PaperPlaneTilt },
                    { step: '3', title: 'They connect', desc: 'Your partner enters it on their Sync page — done!', icon: LinkSimple },
                  ]).map(({ step, title, desc, icon: Icon }) => (
                    <div key={step} className="flex-1 flex flex-col items-center text-center relative z-10 group">
                      <div className="size-12 rounded-2xl bg-[var(--mf-card)] border border-[var(--mf-border)] text-[var(--mf-accent)] flex items-center justify-center mb-2.5">
                        <Icon size={18} weight="bold" />
                      </div>
                      <div className="size-5 rounded-full bg-pink-500/10 text-pink-500 text-[10px] font-normal flex items-center justify-center mb-1.5">
                        {step}
                      </div>
                      <p className="text-xs font-normal text-[var(--mf-text-strong)]">{title}</p>
                      <p className="text-[11px] text-[var(--mf-muted)] leading-relaxed max-w-[180px] mt-0.5">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </m.div>

            {/* Pairing card — role-aware */}
            {!isAuthenticated ? (
              <div className="flo-card p-6 border border-[var(--mf-border)] !shadow-none text-center space-y-5 relative overflow-hidden max-w-xl mx-auto">
                <div className="relative z-10 space-y-4">
                  <div className="size-10 rounded-xl bg-pink-500/10 flex items-center justify-center mx-auto text-pink-500">
                    <Users size={20} weight="bold" />
                  </div>
                  <h3 className="text-base font-normal text-[var(--mf-text-strong)]">Sign in to connect</h3>
                  <p className="text-xs text-[var(--mf-muted)] max-w-sm mx-auto leading-relaxed">
                    Sign in or create an account to sync cycles with your partner.
                  </p>
                  <Button
                    onClick={() => openAuthModal(window.location.search.includes('code') ? 'register' : 'login')}
                    className="bg-[var(--mf-accent)] hover:bg-[var(--mf-accent)]/90 text-white rounded-xl text-xs"
                  >
                    Sign In or Sign Up
                    <ArrowRight size={14} weight="bold" />
                  </Button>
                </div>
              </div>
            ) : user?.role === 'partner' ? (
              /* ── Partner: enter lady's code ── */
              <m.div variants={itemVariants} className="max-w-md mx-auto">
                <div className="flo-card p-5 border border-[var(--mf-border)] !shadow-none space-y-3.5">
                  <div className="flex items-center gap-2">
                    <div className="size-7 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0">
                      <LinkSimple size={14} weight="bold" />
                    </div>
                    <span className="text-xs font-normal text-[var(--mf-text-strong)]">Enter your partner's code</span>
                  </div>
                  <p className="text-[11px] text-[var(--mf-muted)] leading-relaxed">
                    Your partner has a unique 6-character code on her Sync page. Enter it here to connect.
                  </p>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="e.g. XY82HA"
                      value={partnerCodeInput}
                      onChange={(e) => setPartnerCodeInput(e.target.value.toUpperCase())}
                      aria-label="Partner pairing code"
                      className="w-full bg-[var(--mf-composer-bg)] border border-[var(--mf-border)] rounded-xl px-4 py-2.5 text-base font-mono tracking-[0.3em] text-center focus:outline-none focus:ring-2 focus:ring-[var(--mf-accent)]/50 focus:border-[var(--mf-accent)] uppercase text-[var(--mf-text-strong)] transition-all text-sm"
                      maxLength={6}
                    />
                    <Button
                      disabled={isPairing || !partnerCodeInput.trim()}
                      onClick={handlePair}
                      className="w-full bg-[var(--mf-accent)] hover:bg-[var(--mf-accent)]/90 text-white rounded-xl text-xs h-11"
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
                    </Button>
                  </div>
                </div>
              </m.div>
            ) : (
              /* ── Lady: show her code to share ── */
              <m.div variants={itemVariants} className="max-w-md mx-auto">
                <div className="flo-card p-5 border border-[var(--mf-border)] !shadow-none space-y-3.5">
                  <div className="flex items-center gap-2">
                    <div className="size-7 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500 shrink-0">
                      <Copy size={14} weight="bold" />
                    </div>
                    <span className="text-xs font-normal text-[var(--mf-text-strong)]">Your Pairing Code</span>
                  </div>
                  <p className="text-[11px] text-[var(--mf-muted)] leading-relaxed">
                    Share this code with your partner. They'll enter it on their Partner Sync page to connect with you.
                  </p>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl font-mono tracking-[0.3em] text-[var(--mf-text-strong)] bg-[var(--mf-composer-bg)] px-4 py-2.5 rounded-xl border border-[var(--mf-border)] select-all flex-1 text-center">
                      {user?.partnerCode ?? '— — — — — —'}
                    </span>
                    <Button
                      onClick={() => {
                        if (user?.partnerCode) {
                          navigator.clipboard.writeText(user.partnerCode)
                          toast.success('Code copied!', {
                            description: 'Send this to your partner so they can connect with you.',
                          })
                        }
                      }}
                      className="size-11 shrink-0 rounded-xl bg-[var(--mf-accent)] hover:bg-[var(--mf-accent)]/90 text-white"
                      size="icon"
                    >
                      <Copy size={18} weight="bold" />
                    </Button>
                  </div>
                  <p className="text-[10.5px] text-[var(--mf-muted)] text-center pt-1">
                    Once your partner enters this code, you'll both be connected automatically.
                  </p>
                </div>
              </m.div>
            )}

            {/* Invite partner banner — lady only, authenticated, unpaired */}
            {isAuthenticated && user?.role === 'lady' && (
              <m.div variants={itemVariants} className="mt-8 w-full max-w-2xl mx-auto px-4 sm:px-0">
                <Button
                  onClick={() => setIsInviteModalOpen(true)}
                  className="w-full text-left bg-gradient-to-r from-[var(--mf-accent)] to-[#be185d] rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 text-white flex flex-col items-center sm:flex-row justify-between gap-4 sm:gap-6 overflow-hidden relative group cursor-pointer h-auto border-0"
                >
                  <div className="z-10 text-center sm:text-left space-y-1.5">
                    <h3 className="text-base sm:text-lg font-semibold tracking-tight leading-snug">Share your cycle with a partner</h3>
                    <p className="text-white/80 text-xs sm:text-sm max-w-[460px] leading-relaxed">
                      Invite your partner to view your cycle phases and symptoms to improve communication and support.
                    </p>
                  </div>
                  <span className="z-10 w-full sm:w-auto px-5 py-2.5 bg-white text-[var(--mf-accent)] rounded-xl text-sm font-semibold shrink-0 text-center">
                    Invite Partner
                  </span>
                  <div className="absolute right-[-20px] top-[-20px] opacity-10 group-hover:scale-110 transition-transform duration-700">
                     <img loading="lazy" src="/images/girl.jpg" alt="" className="size-40 sm:size-48 object-contain rotate-[-15deg]" />
                  </div>
                </Button>
              </m.div>
            )}

            {/* Trust note */}
            <m.p variants={itemVariants} className="text-center text-[10px] text-muted-foreground mt-5">
              <Lock size={10} aria-hidden="true" className="inline mr-0.5" />
              Your health data is always private. Only aggregated cycle phase info is shared with your partner.
            </m.p>

          </div>

          {/* Invite Partner Dialog */}
          <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
            <DialogContent className="invite-partner-dialog-content w-[calc(100vw-1rem)] max-w-[480px] sm:w-[calc(100vw-2rem)] max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] p-0 overflow-hidden border border-border rounded-2xl sm:rounded-3xl bg-background flex flex-col">
              <div className="invite-partner-dialog-body p-4 sm:p-6 md:p-8 overflow-y-auto min-h-0">
                <DialogHeader className="mb-4">
                  <div className="size-12 rounded-xl bg-[var(--mf-accent-soft)] flex items-center justify-center text-[var(--mf-accent)] mb-3">
                    <ShareNetwork size={24} weight="duotone" />
                  </div>
                  <DialogTitle className="text-lg sm:text-xl font-semibold tracking-tight">Invite your partner</DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground pt-1.5 leading-relaxed">
                    Shared access allows your partner to see your cycle phases, symptoms, and daily insights.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-5">
                  <div className="space-y-2.5">
                    <label 
                      htmlFor="partner-email"
                      className="text-xs sm:text-sm font-medium uppercase tracking-wider text-muted-foreground"
                    >
                      Partner's Email
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input 
                        id="partner-email"
                        type="email" 
                        placeholder="email@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSendInvite() }}
                        disabled={isInviting}
                        className="flex-1 h-12 px-4 rounded-xl bg-muted/50 border border-border focus:border-[var(--mf-accent-border)] focus:bg-background transition-all outline-none text-sm"
                      />
                      <Button 
                        onClick={handleSendInvite}
                        disabled={isInviting || !inviteEmail.trim()}
                        className="h-12 px-6 bg-[var(--mf-accent)] hover:bg-[var(--mf-accent)]/90 text-white rounded-xl shrink-0"
                      >
                        {isInviting ? 'Inviting...' : 'Invite'}
                      </Button>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs tracking-widest uppercase">
                      <span className="bg-background px-4 text-muted-foreground font-medium">Or use a link</span>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                   <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 sm:p-3 rounded-xl bg-muted/30 border min-w-0">
                      <span className="w-full sm:flex-1 text-[11px] sm:text-xs text-muted-foreground font-mono select-all break-words overflow-wrap-anywhere">
                        {inviteUrl}
                      </span>
                      <Button
                        onClick={copyLink}
                        variant="outline"
                        className="w-full sm:w-auto rounded-lg text-xs gap-1.5 shrink-0"
                      >
                        {copied ? (
                          <>
                            <Check size={12} className="text-green-500" weight="bold" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Copy</span>
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      This link expires in 24 hours. Your partner will need their own account.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="invite-partner-dialog-footer bg-muted/30 px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 border-t shrink-0">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  You can manage or revoke access anytime from <span className="text-foreground font-medium">Account Settings</span>.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </m.div>
    )
  }

  return (
    <m.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="dashboard-flo-theme relative overflow-hidden min-h-screen"
    >
      <main ref={mainRef} className="flo-main-container pb-32 relative z-10">
        <div className="flo-content-inner">
          
          <m.div variants={itemVariants} className="flo-dashboard-top mb-6 md:mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="max-w-xl">
                <h1 className="text-2xl sm:text-3xl font-normal tracking-tight text-[var(--mf-text-strong)] leading-[1.1]">
                  Partner Sync & <br />
                  <span className="text-[var(--mf-accent)]">Empathy Hub</span>
                </h1>
                <p className="text-sm text-[var(--mf-muted)] mt-2 leading-relaxed max-w-lg">
                  Strengthen your relationship with real-time status pings, hormone decoding translators, and empathetic task sheets aligned with her cycle.
                </p>
                {partnerStatus?.partner && (
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-full bg-[var(--mf-accent-soft)] flex items-center justify-center overflow-hidden border border-[var(--mf-border)] shrink-0">
                        {partnerStatus.partner.avatar ? (
                          <img loading="lazy" src={resolveAssetUrl(partnerStatus.partner.avatar)} alt="" className="size-full object-cover" />
                        ) : (
                          <img loading="lazy" src="/images/girl.jpg" alt="" className="size-full object-cover" />
                        )}
                      </div>
                      <span className="text-xs font-medium text-[var(--mf-text-strong)]">
                        {partnerStatus.partner.name}
                      </span>
                    </div>
                    <div className="h-4 w-px bg-[var(--mf-border)]" />
                    <PresenceBadge lastActive={partnerStatus.partner.lastActive} partnerName={partnerStatus.partner.name} />
                  </div>
                )}
              </div>
              <div className="hidden md:block shrink-0">
                <img loading="lazy" src="/images/lady.jpg" alt="Empathy Hub Illustration" className="h-28 lg:h-32 object-cover rounded-full opacity-95" />
              </div>
            </div>
          </m.div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(380px,480px)_minmax(320px,1fr)] gap-6 lg:gap-8 xl:gap-10 items-start">
            
            {/* Left Column: Real-Time Ping Card */}
            <m.section variants={itemVariants} className="flex flex-col gap-6 self-start">
              <div className="flo-card p-5 relative overflow-hidden transition-all duration-300">
                
                <div className="flex flex-col items-center text-center">
                  <m.div 
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="mb-3 size-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500"
                  >
                    <img loading="lazy" src="/images/heart.png" alt="" className="size-6 object-contain" />
                  </m.div>

                  <h2 className="text-base font-normal tracking-tight text-[var(--mf-text-strong)]">
                    {user?.role === 'partner' ? 'Send supportive update' : 'Send Real-Time Check-In'}
                  </h2>
                  <p className="text-[11px] text-[var(--mf-muted)] mt-1.5 max-w-xs leading-relaxed">
                    {user?.role === 'partner' 
                      ? 'Let your partner know how you are supporting her today.'
                      : 'Let your partner know how your body feels today.'}
                  </p>
                </div>

                {sent ? (
                  <m.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-6 flex flex-col items-center text-center py-6 bg-[var(--mf-composer-bg)] border border-[var(--mf-border)] rounded-2xl"
                  >
                    <div className="mb-3">
                      <Sparkle size={40} weight="fill" className="text-pink-400" />
                    </div>
                    <h3 className="text-sm font-medium text-[var(--mf-text-strong)]">
                      {user?.role === 'partner' ? 'Support Update Sent!' : 'Check-in Sent!'}
                    </h3>
                    <p className="text-[11px] text-[var(--mf-muted)] mt-1 max-w-xs px-4 leading-relaxed">
                      {user?.role === 'partner'
                        ? 'Your partner has been notified. Keep up the supportive gestures!'
                        : 'Your partner has been notified.'}
                    </p>
                    <Button
                      onClick={() => { setSent(false); setSelected(null); }}
                      variant="link"
                      className="mt-5 text-xs text-[var(--mf-accent)]"
                    >
                      Send another update
                    </Button>
                  </m.div>
                ) : (
                  <div className="mt-5 space-y-4">
                    <div className="space-y-2.5">
                      <span className="text-[10px] font-normal text-[var(--mf-text-strong)] uppercase tracking-wider block">
                        {user?.role === 'partner' ? 'Choose Your Supportive Action:' : 'Choose Your Current Feeling:'}
                      </span>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {options.map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => setSelected(opt.id)}
                            type="button"
                            className={cn(
                              "relative overflow-hidden aspect-[4/3] rounded-xl border text-left p-2.5 transition-all flex flex-col justify-between outline-none group cursor-pointer",
                              selected === opt.id
                                ? "border-[var(--mf-accent)] ring-1 ring-[var(--mf-accent)]"
                                : "border-[var(--mf-border)] hover:border-[var(--mf-accent-border)]"
                            )}
                          >
                            <div className="absolute inset-0 bg-black/45 group-hover:bg-black/50 transition-colors z-10" />
                            <img loading="lazy" src={opt.image} alt={opt.label} className="absolute inset-0 size-full object-cover z-0 transition-transform duration-700 group-hover:scale-110" />
                            
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
                          </button>
                        ))}
                      </div>
                    </div>

                    <Button
                      onClick={handleSendPing}
                      disabled={!selected || isSending}
                      className="w-full h-12 bg-[var(--mf-accent)] hover:bg-[var(--mf-accent)]/90 text-white rounded-2xl text-xs"
                    >
                      {isSending ? (
                        <span className="flex items-center gap-2">
                          <m.div 
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Sparkle size={16} weight="bold" />
                          </m.div>
                          Sending Check-in…
                        </span>
                      ) : (
                        <>
                          <PaperPlaneTilt size={16} weight="bold" />
                          Send Instant Ping
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </m.section>

            {/* Right Column: Partner Chat & Support History */}
            <m.section variants={itemVariants} className="flex flex-col gap-6 lg:gap-8 self-start min-w-0">
              {partnerStatus?.paired && <PartnerChat />}
              <SupportHistory />
            </m.section>

          </div>
        </div>

        {/* Invite Partner Dialog */}
        <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
          <DialogContent className="invite-partner-dialog-content w-[calc(100vw-1rem)] max-w-[480px] sm:w-[calc(100vw-2rem)] max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] p-0 overflow-hidden border border-border rounded-2xl sm:rounded-3xl bg-background flex flex-col">
            <div className="invite-partner-dialog-body p-4 sm:p-6 md:p-8 overflow-y-auto min-h-0">
              <DialogHeader className="mb-4">
                <div className="size-12 rounded-xl bg-[var(--mf-accent-soft)] flex items-center justify-center text-[var(--mf-accent)] mb-3">
                  <ShareNetwork size={24} weight="duotone" />
                </div>
                <DialogTitle className="text-lg sm:text-xl font-semibold tracking-tight">Invite your partner</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground pt-1.5 leading-relaxed">
                  Shared access allows your partner to see your cycle phases, symptoms, and daily insights.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5">
                <div className="space-y-2.5">
                  <label 
                    htmlFor="partner-email-paired"
                    className="text-xs sm:text-sm font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    Partner's Email
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input 
                      id="partner-email-paired"
                      type="email" 
                      placeholder="email@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSendInvite() }}
                      disabled={isInviting}
                      className="flex-1 h-12 px-4 rounded-xl bg-muted/50 border border-border focus:border-[var(--mf-accent-border)] focus:bg-background transition-all outline-none text-sm"
                    />
                    <button type="button" 
                      onClick={handleSendInvite}
                      disabled={isInviting || !inviteEmail.trim()}
                      className="h-12 px-6 bg-[var(--mf-accent)] text-white rounded-xl text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                      {isInviting ? 'Inviting...' : 'Invite'}
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs tracking-widest uppercase">
                    <span className="bg-background px-4 text-muted-foreground font-medium">Or use a link</span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-xl bg-muted/30 border transition-colors min-w-0 invite-link-box">
                    <span className="w-full sm:flex-1 truncate text-xs sm:text-sm text-muted-foreground font-mono select-all">
                      {inviteUrl}
                    </span>
                    <button type="button" 
                      onClick={copyLink}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 bg-background border rounded-lg text-xs font-medium hover:bg-muted transition-colors shrink-0"
                    >
                      {copied ? (
                        <>
                          <Check size={12} className="text-green-500" weight="bold" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    This link expires in 24 hours. Your partner will need their own account.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="invite-partner-dialog-footer bg-muted/30 px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 border-t shrink-0">
              <p className="text-xs text-muted-foreground leading-relaxed">
                You can manage or revoke access anytime from <span className="text-foreground font-medium">Account Settings</span>.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </m.div>
  )
}
