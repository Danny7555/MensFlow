import type { ComponentType, ReactNode } from 'react'
import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { SettingsSkeleton } from '../components/skeletons/SettingsSkeleton'
import {
  ArrowCounterClockwise,
  Bell,
  Database,
  DownloadSimple,
  GearSix,
  ShieldCheck,
  Sparkle,
  SquaresFour,
  Trash,
  TreeStructure,
  UsersThree,
  UserCircle,
  CaretRight,
  Lock,
  LockKey
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useQueryState, parseAsStringLiteral } from 'nuqs'
import type {
  AccentPreset,
  ContrastMode,
  MensFlowSettings,
  ThemeMode,
} from '../context/settings-types'
import type { AppUser } from '../store/useStore'
import {
  CHAT_STORAGE_KEY,
  CLEAR_LOCAL_CHATS_EVENT,
  SETTINGS_STORAGE_KEY,
  SECURITY_QUESTIONS,
} from '../lib/constants'
import { getPasswordStrength } from '../lib/passwordStrength'

const SETTINGS_CATS = [
  'general',
  'notifications',
  'personalization',
  'apps',
  'data_controls',
  'security',
  'parental',
  'account',
] as const

type SettingsCategoryId = (typeof SETTINGS_CATS)[number]

const NAV: {
  id: SettingsCategoryId
  label: string
  Icon: ComponentType<{ size?: number; className?: string }>
}[] = [
    { id: 'general', label: 'General', Icon: GearSix },
    { id: 'notifications', label: 'Notifications', Icon: Bell },
    { id: 'personalization', label: 'Personalization', Icon: Sparkle },
    { id: 'apps', label: 'Apps', Icon: SquaresFour },
    { id: 'data_controls', label: 'Data controls', Icon: Database },
    { id: 'security', label: 'Security', Icon: ShieldCheck },
    { id: 'parental', label: 'Parental controls', Icon: UsersThree },
    { id: 'account', label: 'Account', Icon: UserCircle },
  ]

function SelectRow({
  label,
  description,
  value,
  onChange,
  options,
}: {
  label: string
  description?: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="settings-field-row">
      <div className="settings-field-text">
        <span className="settings-field-label">{label}</span>
        {description && (
          <p className="settings-field-desc">{description}</p>
        )}
      </div>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="settings-select flex items-center justify-between bg-none shadow-none min-w-[150px] h-9 pr-2 pl-3 cursor-pointer">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-xl border border-border bg-card">
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className={`settings-field-row ${disabled ? 'settings-field-row--muted' : ''}`}>
      <div className="settings-field-text">
        <span className="settings-field-label">{label}</span>
        {description && (
          <p className="settings-field-desc">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        className={`switch ${checked ? 'switch--on' : ''}`}
        onClick={() => !disabled && onChange(!checked)}
      >
        <span className="switch-thumb" aria-hidden />
      </button>
    </div>
  )
}

function MfaSetupModal({ trigger }: { trigger: ReactNode }) {
  const [step, setStep] = useState<'choice' | 'setup' | 'verify' | 'success'>('choice')
  const [method, setMethod] = useState<'app' | 'sms' | null>(null)
  const [code, setCode] = useState('')

  const reset = () => {
    setStep('choice')
    setMethod(null)
    setCode('')
  }

  return (
    <Dialog onOpenChange={(open) => !open && reset()}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px] bg-card border-border p-0 overflow-hidden">
        <div className="p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-medium tracking-tight">
              {step === 'choice' && 'Set up two-step verification'}
              {step === 'setup' && (method === 'app' ? 'Scan QR Code' : 'Enter phone number')}
              {step === 'verify' && 'Enter verification code'}
              {step === 'success' && 'MFA is now active'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {step === 'choice' && 'Add an extra layer of security to your MensFlow account.'}
              {step === 'setup' && (method === 'app'
                ? 'Open your authenticator app (like Google Authenticator or Authy) and scan the code below.'
                : 'We will send a 6-digit code to your mobile device.')}
              {step === 'verify' && 'We sent a code to your device. Please enter it below to confirm.'}
              {step === 'success' && 'Your account is now protected with two-step verification.'}
            </DialogDescription>
          </DialogHeader>

          {step === 'choice' && (
            <div className="grid gap-3">
              <button
                onClick={() => { setMethod('app'); setStep('setup'); }}
                className="flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors text-left group"
              >
                <div className="size-10 rounded-full bg-[var(--mf-accent-soft)] flex items-center justify-center text-[var(--mf-accent)] shrink-0">
                  <ShieldCheck size={24} weight="duotone" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Authenticator App</p>
                  <p className="text-xs text-muted-foreground">Use an app to generate codes (Recommended)</p>
                </div>
                <CaretRight size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <button
                onClick={() => { setMethod('sms'); setStep('setup'); }}
                className="flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors text-left group"
              >
                <div className="size-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                  <Bell size={24} weight="duotone" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Text Message (SMS)</p>
                  <p className="text-xs text-muted-foreground">Receive codes via your mobile phone</p>
                </div>
                <CaretRight size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          )}

          {step === 'setup' && (
            <div className="flex flex-col items-center gap-6 py-4">
              {method === 'app' ? (
                <div className="size-48 bg-white p-3 rounded-xl border border-border flex items-center justify-center relative group">
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=MensFlowDemo&bgcolor=ffffff&color=1a4d57&margin=10"
                    alt="MFA QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-full space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="mfa-phone" className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Phone number</label>
                    <input
                      id="mfa-phone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      className="w-full bg-muted border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--mf-accent)] outline-none"
                    />
                  </div>
                </div>
              )}
              <Button className="w-full rounded-xl py-6" onClick={() => setStep('verify')}>
                Continue to verification
              </Button>
            </div>
          )}

          {step === 'verify' && (
            <div className="flex flex-col items-center gap-6 py-4">
              <div className="flex gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="size-12 rounded-xl border-2 border-border bg-muted flex items-center justify-center text-xl font-medium focus-within:border-[var(--mf-accent)] transition-colors">
                    {code[i] || ''}
                  </div>
                ))}
              </div>
              <div className="w-full space-y-2">
                <input
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="sr-only"
                />
                <Button
                  className="w-full rounded-xl py-6"
                  disabled={code.length < 6}
                  onClick={() => setStep('success')}
                >
                  Verify code
                </Button>
                <button className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-2">
                  Didn't receive a code? Resend
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center gap-6 py-4 text-center">
              <div className="size-20 rounded-full bg-[var(--mf-accent-soft)] flex items-center justify-center text-[var(--mf-accent)] animate-in zoom-in duration-500">
                <ShieldCheck size={48} weight="duotone" />
              </div>
              <div className="space-y-2">
                <p className="font-medium text-lg">You're all set!</p>
                <p className="text-sm text-muted-foreground">
                  Your account is much more secure. Keep your backup codes in a safe place.
                </p>
              </div>
              <DialogFooter className="w-full mt-4">
                <Button className="w-full rounded-xl py-6" variant="outline">
                  Finish setup
                </Button>
              </DialogFooter>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function MfaBanner() {
  const [hidden, setHidden] = useState(
    () => sessionStorage.getItem('mensflow-mfa-dismiss') === '1',
  )
  if (hidden) return null
  return (
    <div className="settings-mfa-banner mb-8">
      <div className="settings-mfa-banner-main">
        <ShieldCheck size={28} weight="duotone" className="settings-mfa-icon" aria-hidden />
        <div>
          <p className="settings-mfa-title">Secure your account</p>
          <p className="settings-mfa-text">
            Add multi-factor authentication (MFA) to protect your health data and sign-in history.
          </p>
          <MfaSetupModal
            trigger={
              <button type="button" className="btn btn-mfa mt-3">
                Set up MFA
              </button>
            }
          />
        </div>
      </div>
      <button
        type="button"
        className="settings-mfa-dismiss icon-btn"
        aria-label="Dismiss"
        onClick={() => {
          sessionStorage.setItem('mensflow-mfa-dismiss', '1')
          setHidden(true)
        }}
      >
        ×
      </button>
    </div>
  )
}

function GeneralPanel({
  isGuest,
  settings,
  updateSettings,
}: {
  isGuest: boolean
  settings: MensFlowSettings
  updateSettings: (patch: Partial<MensFlowSettings>) => void
}) {
  const setTheme = (themeMode: ThemeMode) => updateSettings({ themeMode })
  const { user, partnerStatus, pairPartner, disconnectPartnerAction } = useStore()
  const [partnerCodeInput, setPartnerCodeInput] = useState('')
  const [isPairing, setIsPairing] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  const handlePair = async () => {
    if (!partnerCodeInput.trim()) return
    setIsPairing(true)
    await pairPartner(partnerCodeInput.trim())
    setPartnerCodeInput('')
    setIsPairing(false)
  }

  const handleDisconnect = async () => {
    setIsDisconnecting(true)
    await disconnectPartnerAction()
    setIsDisconnecting(false)
  }

  return (
    <>
      {!isGuest && <MfaBanner />}
      <SelectRow
        label="Appearance"
        value={settings.themeMode}
        onChange={(v) => setTheme(v as ThemeMode)}
        options={[
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
          { value: 'system', label: 'System' },
        ]}
      />
      <SelectRow
        label="Contrast"
        value={settings.contrastMode}
        onChange={(v) => updateSettings({ contrastMode: v as ContrastMode })}
        options={[
          { value: 'system', label: 'System' },
          { value: 'standard', label: 'Standard' },
        ]}
      />
      <SelectRow
        label="Accent color"
        value={settings.accentPreset}
        onChange={(v) => updateSettings({ accentPreset: v as AccentPreset })}
        options={[
          { value: 'default', label: 'Default' },
          { value: 'orchid', label: 'Orchid' },
          { value: 'ocean', label: 'Ocean' },
        ]}
      />
      <SelectRow
        label="Language"
        value={settings.languageUi}
        onChange={(v) =>
          updateSettings({ languageUi: v as 'auto' | 'en' })
        }
        options={[
          { value: 'auto', label: 'Auto-detect' },
          { value: 'en', label: 'English' },
        ]}
      />
      <ToggleRow
        label="Enable dictation"
        description="Use dictation in the chat composer."
        checked={settings.enableDictation}
        onChange={(v) => updateSettings({ enableDictation: v })}
      />
      <SelectRow
        label="Spoken language"
        value={settings.spokenLanguage}
        onChange={(v) =>
          updateSettings({ spokenLanguage: v as 'auto' | 'en-US' })
        }
        options={[
          { value: 'auto', label: 'Auto-detect' },
          { value: 'en-US', label: 'English (US)' },
        ]}
      />
      <ToggleRow
        label="Collapsed sidebar (desktop)"
        description="Use a slim icon rail, expand anytime with the header menu."
        checked={settings.sidebarCollapsed}
        onChange={(v) => updateSettings({ sidebarCollapsed: v })}
      />
      <ToggleRow
        label="Enter sends message"
        description="Off uses ⌘/Ctrl+Enter to send and Enter for a new line."
        checked={settings.chatEnterToSend}
        onChange={(v) => updateSettings({ chatEnterToSend: v })}
      />
      <ToggleRow
        label="Remember chats on this device"
        description="Stores transcripts in your browser when not in a temporary chat."
        checked={settings.chatPersistLocal}
        onChange={(v) => updateSettings({ chatPersistLocal: v })}
      />
      <ToggleRow
        label="Show timestamps"
        checked={settings.chatShowTimestamps}
        onChange={(v) => updateSettings({ chatShowTimestamps: v })}
      />
      <ToggleRow
        label="New sessions start as temporary chat"
        description="When on, signing in opens ephemeral chats until you switch to saved chat in the header."
        checked={settings.privacyDefaultTemporaryChat}
        onChange={(v) => updateSettings({ privacyDefaultTemporaryChat: v })}
      />
      <ToggleRow
        label="Disable Proactive AI Chatbot Suggestions"
        description="Turns off automated pop-up questions and upsell prompts from the AI helper."
        checked={settings.disableAIPopups}
        onChange={(v) => updateSettings({ disableAIPopups: v })}
      />
      <ToggleRow
        label="Hide Daily Stories & Education"
        description="Simplifies your dashboard layout by completely hiding educational playbooks and content cards."
        checked={settings.hideDailyStoriesAndTips}
        onChange={(v) => updateSettings({ hideDailyStoriesAndTips: v })}
      />

      {/* Partner Connection Settings */}
      {!isGuest && (
        <div className="mt-8 pt-6 border-t border-[var(--mf-border)] space-y-6">
          <div>
            <span className="text-xs font-semibold text-[var(--mf-text-strong)] uppercase tracking-wider block mb-1">Partner Connection</span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              MensFlow lets you sync your cycle dashboard with a partner. Share your code to let them see predictions, or enter theirs to pair.
            </p>
          </div>

          {user?.role === 'lady' && (
            <ToggleRow
              label="Share Detailed Cycle Metrics"
              description="Allow your partner to see your cycle tracker wheel, daily water/weight tracking, and logged symptoms. When disabled, they only see phase support checklists and empathy translators."
              checked={settings.privacyShareCycleDetails}
              onChange={(v) => {
                updateSettings({ 
                  privacyShareCycleDetails: v, 
                  ...(v ? { privacyPendingAccessRequest: false } : {}) 
                })
              }}
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left side: Your pairing code */}
            <div className="p-4 rounded-2xl bg-[var(--mf-composer-bg)] border border-[var(--mf-border)] space-y-3">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground block">Your Pairing Code</span>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-mono font-bold tracking-wider text-[var(--mf-text-strong)] bg-white dark:bg-white/5 px-4 py-2 rounded-xl border border-[var(--mf-border)] select-all">
                  {user?.partnerCode ?? '------'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (user?.partnerCode) {
                      navigator.clipboard.writeText(user.partnerCode)
                      toast.success("Pairing code copied!", {
                        description: "Send this code to your partner so they can pair with you."
                      })
                    }
                  }}
                  className="flex items-center justify-center gap-2 text-xs font-medium bg-[var(--mf-accent)] text-white hover:opacity-90 py-2.5 px-4 rounded-xl transition-all duration-300 active:scale-95"
                >
                  Copy Code
                </button>
              </div>
            </div>

            {/* Right side: Pair status or input */}
            <div className="p-4 rounded-2xl bg-[var(--mf-composer-bg)] border border-[var(--mf-border)] flex flex-col justify-between min-h-[120px]">
              {partnerStatus?.paired ? (
                <div className="space-y-4">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground block">Connected Partner</span>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-[var(--mf-accent-soft)] flex items-center justify-center overflow-hidden border border-[var(--mf-border)]">
                        {partnerStatus.partner?.avatar ? (
                          <img src={partnerStatus.partner.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-base font-semibold text-[var(--mf-accent)]">
                            {partnerStatus.partner?.name?.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-[var(--mf-text-strong)]">{partnerStatus.partner?.name}</span>
                        <span className="text-[10px] text-muted-foreground capitalize">{partnerStatus.partner?.accessLevel} access</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={isDisconnecting}
                      onClick={handleDisconnect}
                      className="text-xs font-semibold text-rose-500 hover:text-rose-600 hover:underline px-3 py-1.5 rounded-lg border border-rose-500/20 hover:bg-rose-500/5 transition-all"
                    >
                      {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 flex-1 flex flex-col justify-center">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground block">Enter Partner Code</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. XY82HA"
                      value={partnerCodeInput}
                      onChange={(e) => setPartnerCodeInput(e.target.value.toUpperCase())}
                      className="bg-white dark:bg-white/5 border border-[var(--mf-border)] rounded-xl px-4 py-2 text-sm font-mono tracking-wider focus:outline-none focus:ring-1 focus:ring-[var(--mf-accent)] w-full uppercase"
                    />
                    <button
                      type="button"
                      disabled={isPairing || !partnerCodeInput.trim()}
                      onClick={handlePair}
                      className="flex items-center justify-center gap-2 text-xs font-semibold bg-[var(--mf-accent)] text-white hover:opacity-90 py-2 px-4 rounded-xl transition-all duration-300 active:scale-95 disabled:opacity-50 shrink-0"
                    >
                      {isPairing ? 'Pairing...' : 'Connect'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function NotificationsPanel({
  settings,
  updateSettings,
}: {
  settings: MensFlowSettings
  updateSettings: (patch: Partial<MensFlowSettings>) => void
}) {
  return (
    <>
      <p className="settings-panel-intro">
        Preferences only, connect push/email providers when your backend is ready.
      </p>
      <ToggleRow
        label="Cycle & wellness reminders"
        checked={settings.notificationsCycleReminders}
        onChange={(v) => updateSettings({ notificationsCycleReminders: v })}
      />
      <ToggleRow
        label="Push-style alerts (device)"
        checked={settings.notificationsPush}
        onChange={(v) => updateSettings({ notificationsPush: v })}
      />
      <ToggleRow
        label="Email digest"
        checked={settings.notificationsEmail}
        onChange={(v) => updateSettings({ notificationsEmail: v })}
      />
      <ToggleRow
        label="Product tips & surveys"
        checked={settings.notificationsProduct}
        onChange={(v) => updateSettings({ notificationsProduct: v })}
      />
    </>
  )
}

function PersonalizationPanel({
  settings,
  updateSettings,
}: {
  settings: MensFlowSettings
  updateSettings: (patch: Partial<MensFlowSettings>) => void
}) {
  return (
    <>
      <p className="settings-panel-intro">
        Cycle modeling used for insights until your tracker has enough history.
      </p>
      <div className="settings-slider-row">
        <label htmlFor="cycle-length" className="settings-field-label">
          Average cycle length
        </label>
        <div className="settings-slider-val">{settings.cycleAvgLengthDays} days</div>
        <input
          id="cycle-length"
          type="range"
          min={21}
          max={45}
          value={settings.cycleAvgLengthDays}
          onChange={(e) =>
            updateSettings({ cycleAvgLengthDays: Number(e.target.value) })
          }
          className="settings-range"
        />
      </div>
      <ToggleRow
        label="Show fertile window hints"
        checked={settings.cycleShowFertileWindow}
        onChange={(v) => updateSettings({ cycleShowFertileWindow: v })}
      />
      <SelectRow
        label="Condition Optimization Profile"
        description="Tailor cycle modeling, predictions, and tips for specific conditions (PCOS, Endometriosis, or Perimenopause)."
        value={settings.conditionOptimization}
        onChange={(v) => updateSettings({ conditionOptimization: v as any })}
        options={[
          { value: 'none', label: 'None (Standard predictions)' },
          { value: 'pcos', label: 'PCOS Optimization' },
          { value: 'endometriosis', label: 'Endometriosis Optimization' },
          { value: 'perimenopause', label: 'Perimenopause Transition' },
        ]}
      />
    </>
  )
}

function AppsPanel() {
  return (
    <div className="settings-placeholder-block">
      <TreeStructure size={40} weight="duotone" aria-hidden />
      <p className="settings-placeholder-title">Apps & connectors</p>
      <p className="settings-placeholder-desc">
        Calendar sync, wearables, and health exports will plug in here, same pattern as ChatGPT's Apps tab.
      </p>
    </div>
  )
}

function DataControlsPanel({
  settings,
  updateSettings,
  exportBundle,
  confirmClearChats,
  confirmResetSettings,
  confirmResetApp,
  confirmWipeLocalData,
}: {
  settings: MensFlowSettings
  updateSettings: (patch: Partial<MensFlowSettings>) => void
  exportBundle: () => void
  confirmClearChats: () => void
  confirmResetSettings: () => void
  confirmResetApp: () => void
  confirmWipeLocalData: () => void
}) {
  return (
    <>
      <ToggleRow
        label="Share anonymous analytics"
        description="Help improve MensFlow with crash and usage metrics."
        checked={settings.privacyShareAnalytics}
        onChange={(v) => updateSettings({ privacyShareAnalytics: v })}
      />
      <ToggleRow
        label="Strict Local-Only Storage (Offline Mode)"
        description="Disable all cloud database synchronizations. Your cycle metrics, daily logs, and preferences will remain strictly inside this browser/device."
        checked={settings.privacyStrictLocalOnly}
        onChange={(v) => {
          updateSettings({ privacyStrictLocalOnly: v })
          if (v) {
            toast.warning("Local-Only Mode Enabled", {
              description: "Your health records are now saved strictly on this device and won't sync to the cloud database.",
              duration: 5000,
            })
          } else {
            toast.success("Database Sync Restored", {
              description: "Future updates will sync with your account cloud profile.",
              duration: 4000,
            })
          }
        }}
      />
      <p className="settings-panel-intro">
        Export or delete data stored locally in this browser.
      </p>
      <div className="settings-actions settings-actions--stack">
        <button type="button" className="btn btn-secondary" onClick={exportBundle}>
          <DownloadSimple size={18} aria-hidden />
          Export JSON
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={confirmClearChats}
        >
          <Trash size={18} aria-hidden />
          Clear local chats
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={confirmResetSettings}
        >
          <ArrowCounterClockwise size={18} aria-hidden />
          Reset preferences
        </button>
        <button
          type="button"
          className="btn btn-ghost danger"
          onClick={confirmResetApp}
        >
          Erase all MensFlow health data
        </button>
        <button
          type="button"
          className="btn btn-ghost danger"
          onClick={confirmWipeLocalData}
        >
          Erase local MensFlow data
        </button>
      </div>
      <div className="mt-8 p-6 rounded-3xl bg-[var(--mf-accent-soft)]/20 border border-[var(--mf-accent-border)] space-y-3">
        <h4 className="text-sm font-semibold text-[var(--mf-text-strong)] flex items-center gap-2">
          <ShieldCheck size={18} className="text-[var(--mf-accent)]" />
          <span>Ironclad Data Privacy Pledge</span>
        </h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          MensFlow is a privacy-first, 100% free period tracker. We strictly avoid third-party data sharing, do not sell user health data to advertisers, and employ no tracking cookies. Your cycle information remains secure under your absolute control.
        </p>
      </div>
    </>
  )
}




function LockChatSetupModal({
  trigger,
  updateSettings,
}: {
  trigger: ReactNode
  updateSettings: (patch: Partial<MensFlowSettings>) => void
}) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [password, setPassword] = useState('')
  const [questionId, setQuestionId] = useState(SECURITY_QUESTIONS[0].id)
  const [answer, setAnswer] = useState('')

  const activeQuestion = SECURITY_QUESTIONS.find(q => q.id === questionId)!

  const strengthResult = getPasswordStrength(password)
  const isStrong = strengthResult ? strengthResult.isStrong : false

  return (
    <Dialog open={open} onOpenChange={(o) => {
      setOpen(o)
      if (!o) {
        setTimeout(() => {
          setStep(1)
          setPassword('')
          setQuestionId(SECURITY_QUESTIONS[0].id)
          setAnswer('')
        }, 200)
      }
    }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[420px] bg-card border-border p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-medium tracking-tight flex items-center gap-2">
            <Lock size={24} className="text-[var(--mf-accent)]" /> {step === 1 ? 'Setup Locked Chats' : 'Security Question'}
          </DialogTitle>
          <DialogDescription>
            {step === 1 
              ? 'Create a password to protect your hidden conversations.'
              : 'Choose a security question. This will be used to reset your password if you forget it.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {step === 1 ? (
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase text-muted-foreground">Privacy Password</label>
              <div className="relative">
                <LockKey size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input 
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-muted border border-border focus:border-[var(--mf-accent-border)] focus:ring-1 focus:ring-[var(--mf-accent)] outline-none text-sm"
                  autoFocus
                />
              </div>
              {password && (
                <div className="w-full mt-3 space-y-2 animate-in fade-in slide-in-from-top-1 duration-300">
                  <div className="flex justify-between items-center text-[10.5px] font-medium tracking-wide">
                    <span className="text-muted-foreground uppercase">Password Strength</span>
                    {strengthResult && (
                      <span className={strengthResult.textClass}>
                        {strengthResult.label}
                      </span>
                    )}
                  </div>
                  <div className="h-1.5 w-full bg-muted/30 dark:bg-muted/10 rounded-full overflow-hidden flex gap-1">
                    {strengthResult && (
                      <>
                        <div className={`h-full rounded-full transition-all duration-500 flex-1 ${
                          strengthResult.percent >= 33 
                            ? strengthResult.label === 'Bad' 
                              ? 'bg-rose-500' 
                              : strengthResult.label === 'Good' 
                                ? 'bg-amber-500' 
                                : 'bg-emerald-500'
                            : 'bg-transparent'
                        }`} />
                        <div className={`h-full rounded-full transition-all duration-500 flex-1 ${
                          strengthResult.percent >= 66 
                            ? strengthResult.label === 'Good' 
                              ? 'bg-amber-500' 
                              : 'bg-emerald-500'
                            : 'bg-muted/10'
                        }`} />
                        <div className={`h-full rounded-full transition-all duration-500 flex-1 ${
                          strengthResult.percent >= 100 
                            ? 'bg-emerald-500' 
                            : 'bg-muted/10'
                        }`} />
                      </>
                    )}
                  </div>
                  {strengthResult?.label === 'Bad' && (
                    <p className="text-[10px] text-muted-foreground leading-normal text-left">
                      ⚠️ Make it at least 8 characters with numbers or special symbols.
                    </p>
                  )}
                  {strengthResult?.label === 'Good' && (
                    <p className="text-[10px] text-muted-foreground leading-normal text-left">
                      👍 Good! Add uppercase letters and symbols for maximum security.
                    </p>
                  )}
                  {strengthResult?.label === 'Excellent' && (
                    <p className="text-[10px] leading-normal font-medium text-emerald-500 dark:text-emerald-400 text-left">
                      ✨ Excellent! Your privacy is highly secure.
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase text-muted-foreground">Select a question</label>
                <Select
                  value={questionId}
                  onValueChange={(val) => {
                    setQuestionId(val)
                    setAnswer('')
                  }}
                >
                  <SelectTrigger className="w-full h-11 px-3 rounded-xl bg-muted border border-border focus:border-[var(--mf-accent-border)] focus:ring-1 focus:ring-[var(--mf-accent)] outline-none text-sm text-left flex items-center justify-between">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border border-border bg-card">
                    {SECURITY_QUESTIONS.map(q => (
                      <SelectItem key={q.id} value={q.id}>{q.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase text-muted-foreground">Your Answer</label>
                {activeQuestion.type === 'select' ? (
                  <Select
                    value={answer}
                    onValueChange={setAnswer}
                  >
                    <SelectTrigger className="w-full h-11 px-3 rounded-xl bg-muted border border-border focus:border-[var(--mf-accent-border)] focus:ring-1 focus:ring-[var(--mf-accent)] outline-none text-sm text-left flex items-center justify-between">
                      <SelectValue placeholder="Select an answer..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border border-border bg-card">
                      {activeQuestion.options?.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <input 
                    type="text"
                    placeholder="Enter your answer"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-muted border border-border focus:border-[var(--mf-accent-border)] focus:ring-1 focus:ring-[var(--mf-accent)] outline-none text-sm"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 1 ? (
            <>
              <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">Cancel</Button>
              <Button 
                disabled={!isStrong}
                className="rounded-xl"
                onClick={() => setStep(2)}
              >
                Continue
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep(1)} className="rounded-xl">Back</Button>
              <Button 
                disabled={!answer.trim()}
                className="rounded-xl"
                onClick={() => {
                  updateSettings({ 
                    privacyLockChats: true, 
                    privacyLockChatsPassword: password,
                    privacyLockChatsSecurityQuestion: questionId,
                    privacyLockChatsSecurityAnswer: answer.trim().toLowerCase()
                  })
                  setOpen(false)
                  toast.success("Locked chats enabled!")
                }}
              >
                Enable Lock
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DeleteLockChatModal({
  trigger,
  updateSettings,
}: {
  trigger: ReactNode
  updateSettings: (patch: Partial<MensFlowSettings>) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[420px] bg-card border-border p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-medium tracking-tight text-red-500 flex items-center gap-2">
            <Trash size={24} /> Delete Locked Chats
          </DialogTitle>
          <DialogDescription>
            This will permanently delete all your hidden conversations and disable the locked chats feature. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6 gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">Cancel</Button>
          <Button 
            variant="destructive"
            className="rounded-xl"
            onClick={() => {
              updateSettings({ privacyLockChats: false, privacyLockChatsPassword: null })
              setOpen(false)
              toast.success("Locked chats deleted and feature disabled.")
            }}
          >
            Delete & Disable
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SecurityPanel({
  settings,
  updateSettings,
}: {
  settings: MensFlowSettings
  updateSettings: (patch: Partial<MensFlowSettings>) => void
}) {
  return (
    <>
      <div className="settings-field-row border-b border-border/50 pb-6 mb-6">
        <div className="settings-field-text">
          <span className="settings-field-label">Multi-factor authentication (MFA)</span>
          <p className="settings-field-desc">
            Require a second step to sign in to your MensFlow account.
          </p>
        </div>
        <MfaSetupModal
          trigger={
            <Button variant="outline" className="rounded-xl">
              Set up
            </Button>
          }
        />
      </div>

      <div className="settings-field-row border-b border-border/50 pb-6 mb-6">
        <div className="settings-field-text">
          <span className="settings-field-label">Hidden / Locked Chats</span>
          <p className="settings-field-desc">
            Lock specific conversations behind a password so they don't appear in your main chat history.
          </p>
        </div>
        {!settings.privacyLockChats ? (
          <LockChatSetupModal 
            updateSettings={updateSettings}
            trigger={
              <button
                type="button"
                role="switch"
                aria-checked={false}
                className="switch"
              >
                <span className="switch-thumb" aria-hidden />
              </button>
            }
          />
        ) : (
          <div className="flex items-center gap-3">
            <DeleteLockChatModal 
              updateSettings={updateSettings}
              trigger={
                <Button variant="outline" size="sm" className="rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50">
                  Delete Locked Chats
                </Button>
              }
            />
            <button
              type="button"
              role="switch"
              aria-checked={true}
              className="switch switch--on pointer-events-none opacity-80"
            >
              <span className="switch-thumb" aria-hidden />
            </button>
          </div>
        )}
      </div>

      <div className="settings-placeholder-block opacity-60">
        <ShieldCheck size={40} weight="duotone" aria-hidden />
        <p className="settings-placeholder-title">Login history</p>
        <p className="settings-placeholder-desc">
          Active sessions and device history will be visible here once your account is connected to the cloud.
        </p>
      </div>
    </>
  )
}

function ParentalPanel() {
  return (
    <div className="settings-placeholder-block">
      <UsersThree size={40} weight="duotone" aria-hidden />
      <p className="settings-placeholder-title">Parental controls</p>
      <p className="settings-placeholder-desc">
        Age gates and guardian-managed accounts can be enforced here for younger users.
      </p>
    </div>
  )
}

function AccountPanel({
  isGuest,
  user,
  updateUser,
  onLogin,
  onLogout,
}: {
  isGuest: boolean
  user: AppUser
  updateUser: (patch: Partial<AppUser>) => void
  onLogin?: () => void
  onLogout?: () => void
}) {
  return (
    <>
      {isGuest ? (
        <div className="settings-placeholder-block settings-placeholder-block--left">
          <UserCircle size={40} weight="duotone" aria-hidden />
          <p className="settings-placeholder-title">You&apos;re signed out</p>
          <p className="settings-placeholder-desc">
            Sign in to sync chats and trackers across devices when backend auth ships.
          </p>
          {onLogin && (
            <button type="button" className="btn btn-primary" onClick={onLogin}>
              Open sign in
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="settings-account-summary items-start">
            <div className="flex flex-col items-center gap-2 mr-4">
              <div className="size-20 rounded-full bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0 relative group">
                {user?.avatar ? (
                  <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <UserCircle size={48} weight="duotone" className="text-muted-foreground" aria-hidden />
                )}
                <div 
                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                >
                  <span className="text-white text-xs font-medium">Change</span>
                </div>
                <input 
                  id="avatar-upload" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onloadend = () => {
                        updateUser({ avatar: reader.result as string })
                      }
                      reader.readAsDataURL(file)
                    }
                  }} 
                />
              </div>
              <div className="flex gap-2 mt-1">
                <button 
                  type="button" 
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                  className="text-xs font-medium text-[var(--mf-accent)] hover:text-[var(--mf-accent-strong)] transition-colors"
                >
                  Upload
                </button>
                {user?.avatar && (
                  <>
                    <span className="text-muted-foreground text-xs">•</span>
                    <button 
                      type="button" 
                      onClick={() => updateUser({ avatar: null })}
                      className="text-xs font-medium text-destructive hover:text-destructive/80 transition-colors"
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="flex-1 w-full max-w-sm space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="user-name-input" className="text-xs font-medium uppercase tracking-widest text-muted-foreground ml-1">Your Name</label>
                <input
                  id="user-name-input"
                  type="text"
                  value={user?.name ?? ''}
                  onChange={(e) => updateUser({ name: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl bg-muted border border-border focus:border-[var(--mf-accent-border)] focus:ring-1 focus:ring-[var(--mf-accent)] transition-all outline-none text-base font-medium"
                  placeholder="Enter your name"
                />
              </div>
              <p className="settings-account-email ml-1">session@mensflow.local</p>
              
              <div className="mt-6 pt-4 border-t border-border/50">
                <SelectRow
                  label="Access Level"
                  description="Choose whether you want full tracking features or just educational content."
                  value={user?.accessLevel || 'full'}
                  onChange={(v) => updateUser({ accessLevel: v as 'full' | 'educational' })}
                  options={[
                    { value: 'full', label: 'Full Access (All features)' },
                    { value: 'educational', label: 'Educational Access (Learn & Chat only)' },
                  ]}
                />
              </div>

              <div className="mt-4 pt-4 border-t border-border/50">
                <SelectRow
                  label="Your App Role"
                  description="Switch between Lady view (self-tracking) and Partner view (supporting partner)."
                  value={user?.role || 'lady'}
                  onChange={(v) => updateUser({ role: v as 'lady' | 'partner' })}
                  options={[
                    { value: 'lady', label: 'Lady (Self-Tracking)' },
                    { value: 'partner', label: 'Partner (Supporting Partner)' },
                  ]}
                />
              </div>
            </div>
          </div>

          <div className="mb-8 pt-6 border-t border-border/50">
            <span className="text-xs font-semibold text-[var(--mf-text-strong)] uppercase tracking-wider block mb-2">System Avatars</span>
            <p className="text-xs text-muted-foreground mb-4">
              Choose a default avatar to represent the partner profile.
            </p>
            <div className="flex flex-wrap gap-4">
              {[
                { id: 'lotus', src: '/avatars/lotus.svg', label: 'Lotus' },
                { id: 'moon', src: '/avatars/moon.svg', label: 'Moon' },
                { id: 'drop', src: '/avatars/drop.svg', label: 'Drop' },
                { id: 'cat', src: '/avatars/cat.svg', label: 'Cat' },
                { id: 'coffee', src: '/avatars/coffee.svg', label: 'Coffee' },
                { id: 'star', src: '/avatars/star.svg', label: 'Star' },
                { id: 'sun', src: '/avatars/sun.svg', label: 'Sun' },
              ].map(avatar => (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => updateUser({ avatar: avatar.src })}
                  className={`size-16 rounded-full border-2 overflow-hidden transition-all hover:scale-105 active:scale-95 ${user?.avatar === avatar.src ? 'border-[var(--mf-accent)] ring-2 ring-[var(--mf-accent-soft)]' : 'border-transparent'}`}
                  title={avatar.label}
                >
                  <img src={avatar.src} alt={avatar.label} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <section className="settings-logout-card" aria-labelledby="logout-heading">
            <h3 id="logout-heading" className="settings-logout-title">
              Sign out
            </h3>
            <p className="settings-logout-desc">
              Ends this demo session on this device. Saved chats stay in the browser until you clear them under Data controls.
            </p>
            {onLogout && (
              <button type="button" className="btn btn-logout" onClick={onLogout}>
                Log out
              </button>
            )}
          </section>
        </>
      )}
    </>
  )
}

type SettingsViewProps = {
  isGuest?: boolean
  onLogin?: () => void
  onLogout?: () => void
}

export function SettingsView({
  isGuest,
  onLogin,
  onLogout,
}: SettingsViewProps) {
  const [cat, setCat] = useQueryState(
    'section',
    parseAsStringLiteral(SETTINGS_CATS)
      .withDefault('general')
      .withOptions({ shallow: false })
  )
  const { settings, updateSettings, resetSettings, user, updateUser, resetStore, showConfirm } = useStore()

  const handleRoleChange = async (newRole: 'lady' | 'partner') => {
    const toastId = toast.loading("Reconfiguring workspace perspective...")
    try {
      await updateUser({ role: newRole })
      // Artificial delay for smooth loading effect
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      toast.success(`Switched to ${newRole === 'lady' ? 'Lady' : 'Partner'} view`, {
        id: toastId,
        description: `Dashboard layout updated to ${newRole === 'lady' ? 'self-tracking' : 'partner support'}.`,
        duration: 3000
      })
    } catch (err) {
      toast.error("Failed to switch role.", { id: toastId })
    }
  }

  const confirmResetApp = () => {
    showConfirm({
      title: 'Reset Application',
      description: 'Delete all symptom logs, cycle data, and health settings? This cannot be undone.',
      onConfirm: () => {
        resetStore()
        resetSettings()
        localStorage.removeItem(CHAT_STORAGE_KEY)
        window.dispatchEvent(new Event(CLEAR_LOCAL_CHATS_EVENT))
        if (onLogout) onLogout()
        window.location.reload()
      }
    })
  }

  const exportBundle = () => {
    const readChatSnapshot = (): unknown => {
      try {
        const raw = localStorage.getItem(CHAT_STORAGE_KEY)
        return raw ? JSON.parse(raw) : null
      } catch {
        return null
      }
    }
    const chatSnapshot = readChatSnapshot()
    const blob = new Blob(
      [
        JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            app: 'MensFlow',
            settings,
            localChat: chatSnapshot,
          },
          null,
          2,
          ),
      ],
      { type: 'application/json' },
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mensflow-export-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const confirmResetSettings = () => {
    showConfirm({
      title: 'Reset Settings',
      description: 'Reset all MensFlow preferences to defaults? This cannot be undone.',
      onConfirm: () => {
        resetSettings()
      }
    })
  }

  const confirmClearChats = () => {
    showConfirm({
      title: 'Clear Chats',
      description: 'Delete locally saved chat messages on this device?',
      onConfirm: () => {
        localStorage.removeItem(CHAT_STORAGE_KEY)
        window.dispatchEvent(new Event(CLEAR_LOCAL_CHATS_EVENT))
      }
    })
  }

  const confirmWipeLocalData = () => {
    showConfirm({
      title: 'Wipe Local Data',
      description: 'Remove settings export cache and chat transcripts from this browser?',
      onConfirm: () => {
        localStorage.removeItem(CHAT_STORAGE_KEY)
        localStorage.removeItem(SETTINGS_STORAGE_KEY)
        window.dispatchEvent(new Event(CLEAR_LOCAL_CHATS_EVENT))
        window.location.reload()
      }
    })
  }

  const panelTitle =
    NAV.find((n) => n.id === cat)?.label ?? 'Settings'

  let panel: ReactNode

  switch (cat) {
    case 'general':
      panel = (
        <GeneralPanel
          isGuest={!!isGuest}
          settings={settings}
          updateSettings={updateSettings}
        />
      )
      break
    case 'notifications':
      panel = (
        <NotificationsPanel
          settings={settings}
          updateSettings={updateSettings}
        />
      )
      break
    case 'personalization':
      panel = (
        <PersonalizationPanel
          settings={settings}
          updateSettings={updateSettings}
        />
      )
      break
    case 'apps':
      panel = <AppsPanel />
      break
    case 'data_controls':
      panel = (
        <DataControlsPanel
          settings={settings}
          updateSettings={updateSettings}
          exportBundle={exportBundle}
          confirmClearChats={confirmClearChats}
          confirmResetSettings={confirmResetSettings}
          confirmResetApp={confirmResetApp}
          confirmWipeLocalData={confirmWipeLocalData}
        />
      )
      break
    case 'security':
      panel = (
        <SecurityPanel
          settings={settings}
          updateSettings={updateSettings}
        />
      )
      break
    case 'parental':
      panel = <ParentalPanel />
      break
    case 'account':
      panel = (
        <AccountPanel
          isGuest={!!isGuest}
          user={user}
          updateUser={async (patch) => {
            if (patch.role !== undefined && patch.role !== user.role) {
              await handleRoleChange(patch.role)
            } else {
              await updateUser(patch)
            }
          }}
          onLogin={onLogin}
          onLogout={onLogout}
        />
      )
      break
    default:
      panel = null
  }

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return <SettingsSkeleton />
  }

  return (
    <div className="settings-shell">
      <aside className="settings-shell-nav" aria-label="Settings sections">
        {NAV.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className={`settings-nav-item ${cat === id ? 'settings-nav-item--active' : ''}`}
            onClick={() => setCat(id)}
          >
            <Icon size={20} aria-hidden />
            <span>{label}</span>
          </button>
        ))}
      </aside>
      <div className="settings-shell-main">
        <h2 className="settings-panel-heading">{panelTitle}</h2>
        <div className="settings-panel-body">{panel}</div>
      </div>
    </div>
  )
}
