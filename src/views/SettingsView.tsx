import type { ComponentType, ReactNode } from 'react'
import { useState } from 'react'
import { useStore } from '../store/useStore'
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
} from '@phosphor-icons/react'
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
import { useQueryState, parseAsStringLiteral } from 'nuqs'
import { useSettings } from '../context/useSettings'
import type {
  AccentPreset,
  ContrastMode,
  ThemeMode,
} from '../context/settings-types'
import {
  CHAT_STORAGE_KEY,
  CLEAR_LOCAL_CHATS_EVENT,
  SETTINGS_STORAGE_KEY,
} from '../lib/constants'

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
      <select
        className="settings-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
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
                Continue
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
                  Done
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
  const { settings, updateSettings, resetSettings } = useSettings()
  const { resetStore } = useStore()

  const confirmResetApp = () => {
    if (window.confirm('Delete all symptom logs, cycle data, and health settings? This cannot be undone.')) {
      resetStore()
      resetSettings()
      localStorage.removeItem(CHAT_STORAGE_KEY)
      window.dispatchEvent(new Event(CLEAR_LOCAL_CHATS_EVENT))
      if (onLogout) onLogout()
      window.location.reload()
    }
  }

  const setTheme = (themeMode: ThemeMode) => updateSettings({ themeMode })

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
    if (
      window.confirm(
        'Reset all MensFlow preferences to defaults? This cannot be undone.',
      )
    ) {
      resetSettings()
    }
  }

  const confirmClearChats = () => {
    if (
      window.confirm(
        'Delete locally saved chat messages on this device?',
      )
    ) {
      localStorage.removeItem(CHAT_STORAGE_KEY)
      window.dispatchEvent(new Event(CLEAR_LOCAL_CHATS_EVENT))
    }
  }

  const confirmWipeLocalData = () => {
    if (
      window.confirm(
        'Remove settings export cache and chat transcripts from this browser?',
      )
    ) {
      localStorage.removeItem(CHAT_STORAGE_KEY)
      localStorage.removeItem(SETTINGS_STORAGE_KEY)
      window.dispatchEvent(new Event(CLEAR_LOCAL_CHATS_EVENT))
      window.location.reload()
    }
  }

  const panelTitle =
    NAV.find((n) => n.id === cat)?.label ?? 'Settings'

  let panel: ReactNode

  switch (cat) {
    case 'general':
      panel = (
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
            description="Use a slim icon rail — expand anytime with the header menu."
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
        </>
      )
      break
    case 'notifications':
      panel = (
        <>
          <p className="settings-panel-intro">
            Preferences only — connect push/email providers when your backend is ready.
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
      break
    case 'personalization':
      panel = (
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
        </>
      )
      break
    case 'apps':
      panel = (
        <div className="settings-placeholder-block">
          <TreeStructure size={40} weight="duotone" aria-hidden />
          <p className="settings-placeholder-title">Apps & connectors</p>
          <p className="settings-placeholder-desc">
            Calendar sync, wearables, and health exports will plug in here — same pattern as ChatGPT&apos;s Apps tab.
          </p>
        </div>
      )
      break
    case 'data_controls':
      panel = (
        <>
          <ToggleRow
            label="Share anonymous analytics"
            description="Help improve MensFlow with crash and usage metrics."
            checked={settings.privacyShareAnalytics}
            onChange={(v) => updateSettings({ privacyShareAnalytics: v })}
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
        </>
      )
      break
    case 'security':
      panel = (
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
          <div className="settings-placeholder-block opacity-60">
            <ShieldCheck size={40} weight="duotone" aria-hidden />
            <p className="settings-placeholder-title">Login history</p>
            <p className="settings-placeholder-desc">
              Active sessions and device history will be visible here once your account is connected to the cloud.
            </p>
          </div>
        </>
      )
      break
    case 'parental':
      panel = (
        <div className="settings-placeholder-block">
          <UsersThree size={40} weight="duotone" aria-hidden />
          <p className="settings-placeholder-title">Parental controls</p>
          <p className="settings-placeholder-desc">
            Age gates and guardian-managed accounts can be enforced here for younger users.
          </p>
        </div>
      )
      break
    case 'account':
      panel = (
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
              <div className="settings-account-summary">
                <UserCircle size={36} weight="duotone" aria-hidden />
                <div>
                  <p className="settings-account-name">Demo user</p>
                  <p className="settings-account-email">session@mensflow.local</p>
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
      break
    default:
      panel = null
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
