import type { ComponentType, ReactNode } from 'react'
import { useState } from 'react'
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
} from '@phosphor-icons/react'
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

type SettingsCategoryId =
  | 'general'
  | 'notifications'
  | 'personalization'
  | 'apps'
  | 'data_controls'
  | 'security'
  | 'parental'
  | 'account'

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

function MfaBanner() {
  const [hidden, setHidden] = useState(
    () => sessionStorage.getItem('mensflow-mfa-dismiss') === '1',
  )
  if (hidden) return null
  return (
    <div className="settings-mfa-banner">
      <div className="settings-mfa-banner-main">
        <ShieldCheck size={28} weight="duotone" className="settings-mfa-icon" aria-hidden />
        <div>
          <p className="settings-mfa-title">Secure your account</p>
          <p className="settings-mfa-text">
            Add multi-factor authentication (MFA), such as SMS or an authenticator app,
            to protect sign-in. Backend wiring comes next.
          </p>
          <button type="button" className="btn btn-mfa">
            Set up MFA
          </button>
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
  const [cat, setCat] = useState<SettingsCategoryId>('general')
  const { settings, updateSettings, resetSettings } = useSettings()

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
        <div className="settings-placeholder-block">
          <ShieldCheck size={40} weight="duotone" aria-hidden />
          <p className="settings-placeholder-title">Security</p>
          <p className="settings-placeholder-desc">
            Passkeys, active sessions, and login alerts will mirror ChatGPT&apos;s Security tab once authentication is backed by your API.
          </p>
        </div>
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
