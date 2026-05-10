import { useEffect, useRef, useState } from 'react'
import {
  CaretDown,
  GearSix,
  Ghost,
  List,
  SignOut,
  UserCircle,
} from '@phosphor-icons/react'
import { Link } from 'react-router-dom'

type HeaderProps = {
  isAuthenticated: boolean
  onToggleSidebar: () => void
  sidebarExpanded: boolean
  sidebarToggleLabel: string
  onOpenAuth: () => void
  temporaryChat?: boolean
  onToggleTemporaryChat?: () => void
  onLogout?: () => void
}

export function Header({
  isAuthenticated,
  onToggleSidebar,
  sidebarExpanded,
  sidebarToggleLabel,
  onOpenAuth,
  temporaryChat,
  onToggleTemporaryChat,
  onLogout,
}: HeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false)
  const profileWrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!profileOpen) return
    const close = (e: MouseEvent) => {
      if (!profileWrapRef.current?.contains(e.target as Node))
        setProfileOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [profileOpen])

  return (
    <header className="top-header">
      <div className="top-header-left">
        <button
          type="button"
          className="icon-btn top-header-menu"
          aria-label={sidebarToggleLabel}
          aria-expanded={sidebarExpanded}
          onClick={onToggleSidebar}
        >
          <List size={22} aria-hidden />
        </button>
        <Link to={isAuthenticated ? "/dashboard" : "/ask"} className="top-header-logo">
          MensFlow
        </Link>
      </div>

      <div className="top-header-actions">
        {!isAuthenticated ? (
          <>
            <button type="button" className="btn btn-ghost" onClick={onOpenAuth}>
              Login
            </button>
            <button type="button" className="btn btn-primary" onClick={onOpenAuth}>
              Sign up - free
            </button>
          </>
        ) : (
          <>
            {onToggleTemporaryChat !== undefined && (
              <button
                type="button"
                className={`chat-mode-chip ${temporaryChat ? 'chat-mode-chip--temp' : ''}`}
                onClick={onToggleTemporaryChat}
                aria-pressed={temporaryChat}
                title={
                  temporaryChat
                    ? 'Temporary chat: not saved - click for saved chat'
                    : 'Saved chat - click for temporary chat (like ChatGPT)'
                }
              >
                {temporaryChat ? (
                  <>
                    <Ghost size={15} weight="duotone" className="chat-mode-chip-icon" aria-hidden />
                    Temporary chat
                  </>
                ) : (
                  <>
                    <span className="chat-mode-dot" aria-hidden />
                    Saved chat
                  </>
                )}
              </button>
            )}
            <div className="profile-menu-wrap" ref={profileWrapRef}>
              <button
                type="button"
                className="icon-btn profile-btn profile-btn--with-caret"
                aria-expanded={profileOpen}
                aria-haspopup="menu"
                aria-label="Open account menu"
                onClick={() => setProfileOpen((o) => !o)}
              >
                <UserCircle size={22} weight="duotone" aria-hidden />
                <CaretDown size={12} weight="bold" className="profile-caret" aria-hidden />
              </button>
              {profileOpen && (
                <div className="profile-dropdown" role="menu">
                  <Link
                    to="/settings"
                    className="profile-dropdown-item"
                    role="menuitem"
                    onClick={() => setProfileOpen(false)}
                  >
                    <GearSix size={18} aria-hidden />
                    Settings
                  </Link>
                  <button
                    type="button"
                    className="profile-dropdown-item profile-dropdown-item--danger"
                    role="menuitem"
                    onClick={() => {
                      onLogout?.()
                      setProfileOpen(false)
                    }}
                  >
                    <SignOut size={18} aria-hidden />
                    Log out
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  )
}
