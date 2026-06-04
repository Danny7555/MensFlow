import { useEffect, useRef, useState } from 'react'
import {
  CaretDown,
  GearSix,
  Ghost,
  SidebarSimple,
  SignOut,
  UserCircle,
  CaretLeft,
} from '@phosphor-icons/react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

type HeaderProps = {
  isAuthenticated: boolean
  onToggleSidebar: () => void
  sidebarExpanded: boolean
  sidebarToggleLabel: string
  onOpenAuth: () => void
  temporaryChat?: boolean
  onToggleTemporaryChat?: () => void
  onLogout?: () => void
  isMobile?: boolean
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
  isMobile,
}: HeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false)
  const profileWrapRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (!profileOpen) return
    const close = (e: MouseEvent) => {
      if (!profileWrapRef.current?.contains(e.target as Node))
        setProfileOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [profileOpen])

  const getPageTitle = (pathname: string, search: string) => {
    if (pathname === '/settings') {
      const params = new URLSearchParams(search)
      const section = params.get('section')
      switch (section) {
        case 'general': return 'General'
        case 'notifications': return 'Notifications'
        case 'personalization': return 'Personalization'
        case 'apps': return 'Apps'
        case 'data_controls': return 'Data Controls'
        case 'security': return 'Security'
        case 'parental': return 'Parental Controls'
        case 'account': return 'Account'
        default: return 'Settings'
      }
    }

    switch (pathname) {
      case '/dashboard':
        return 'Home'
      case '/ask':
        return 'Ask AI'
      case '/insights':
      case '/health-insights':
        return 'Insights'
      case '/tips':
      case '/wellness-tips':
        return 'Wellness'
      case '/notifications':
        return 'Alerts'
      case '/settings':
        return 'Settings'
      case '/calendar':
        return 'Calendar'
      case '/tracker':
        return 'Tracker'
      case '/symptoms':
        return 'Symptoms'
      case '/education':
        return 'Education'
      case '/sync':
        return 'Partner Sync'
      case '/locked-chats':
        return 'Locked Chats'
      default:
        return 'MensFlow'
    }
  }

  const params = new URLSearchParams(location.search)
  const hasSettingsSection = location.pathname === '/settings' && params.has('section')
  const showBackButton = isMobile && (
    hasSettingsSection || 
    !['/dashboard', '/insights', '/tips', '/notifications', '/settings', '/education', '/ask', '/'].includes(location.pathname)
  )

  const handleBack = () => {
    if (location.pathname === '/settings' && params.has('section')) {
      navigate('/settings')
    } else {
      navigate(-1)
    }
  }

  return (
    <header className="top-header">
      {isMobile ? (
        <>
          <div className="top-header-left">
            {showBackButton ? (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-0.5 text-[var(--mf-accent)] active:opacity-60 transition-opacity border-none bg-transparent cursor-pointer p-0"
              >
                <CaretLeft size={22} weight="bold" />
                <span className="text-[15px] font-normal">Back</span>
              </button>
            ) : (
              (!isAuthenticated && !sidebarExpanded) && (
                <button
                  type="button"
                  className="icon-btn top-header-menu"
                  aria-label={sidebarToggleLabel}
                  aria-expanded={sidebarExpanded}
                  onClick={onToggleSidebar}
                >
                  <SidebarSimple size={22} aria-hidden />
                </button>
              )
            )}
          </div>

          <div className="top-header-title">
            {getPageTitle(location.pathname, location.search)}
          </div>

          <div className="top-header-actions">
            {!isAuthenticated ? (
              <button type="button" className="btn btn-ghost text-xs px-2" onClick={onOpenAuth}>
                Login
              </button>
            ) : (
              <div className="profile-menu-wrap" ref={profileWrapRef}>
                <button
                  type="button"
                  className="icon-btn profile-btn"
                  aria-expanded={profileOpen}
                  aria-haspopup="menu"
                  aria-label="Open account menu"
                  onClick={() => setProfileOpen((o) => !o)}
                >
                  <UserCircle size={24} weight="duotone" aria-hidden />
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
            )}
          </div>
        </>
      ) : (
        <>
          <div className="top-header-left">
            {(isMobile && !sidebarExpanded) && (
              <button
                type="button"
                className="icon-btn top-header-menu"
                aria-label={sidebarToggleLabel}
                aria-expanded={sidebarExpanded}
                onClick={onToggleSidebar}
              >
                <SidebarSimple size={22} aria-hidden />
              </button>
            )}
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
                  Sign up
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
                        <span className="hidden sm:inline">Temporary chat</span>
                        <span className="sm:hidden inline">Temporary</span>
                      </>
                    ) : (
                      <>
                        <span className="chat-mode-dot" aria-hidden />
                        <span className="hidden sm:inline">Saved chat</span>
                        <span className="sm:hidden inline">Saved</span>
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
        </>
      )}
    </header>
  )
}

