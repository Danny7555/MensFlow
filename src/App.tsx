import { useCallback, useState, type ReactNode } from 'react'
import { ThemeSync } from './components/ThemeSync'
import { AuthModal, type AuthMethod } from './components/AuthModal'
import { ChatView } from './views/ChatView'
import { DashboardDataProvider } from './context/DashboardDataProvider'
import { DashboardView } from './views/DashboardView'
import { InsightsView } from './views/InsightsView'
import { TipsView } from './views/TipsView'
import { LandingView } from './views/LandingView'
import { PlaceholderView } from './views/PlaceholderView'
import { SettingsView } from './views/SettingsView'
import { AuthProvider } from './context/AuthProvider'
import { SettingsProvider } from './context/SettingsProvider'
import { ChatSessionContext } from './context/chat-session-context'
import { useAuth } from './context/useAuth'
import { useSettings } from './context/useSettings'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import type { SectionId } from './types/nav'
import { useMediaQuery } from './hooks/useMediaQuery'
import './App.css'

function MainShell() {
  const { isAuthenticated, login, logout } = useAuth()
  const { settings, updateSettings } = useSettings()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [section, setSection] = useState<SectionId>('ask')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [temporaryChat, setTemporaryChat] = useState(false)

  const openAuth = useCallback(() => setAuthModalOpen(true), [])

  const completeDemoSignIn = useCallback(
    (method: AuthMethod) => {
      void method
      login()
      setTemporaryChat(settings.privacyDefaultTemporaryChat)
      setSection('dashboard')
      setAuthModalOpen(false)
    },
    [login, settings.privacyDefaultTemporaryChat],
  )

  const handleLogout = useCallback(() => {
    logout()
    setTemporaryChat(false)
    setSection('ask')
  }, [logout])

  const goHome = useCallback(() => {
    if (isAuthenticated) setSection('dashboard')
    else setSection('ask')
  }, [isAuthenticated])

  const toggleSidebar = useCallback(() => {
    if (isMobile) setSidebarOpen((o) => !o)
    else updateSettings({ sidebarCollapsed: !settings.sidebarCollapsed })
  }, [isMobile, settings.sidebarCollapsed, updateSettings])

  const sidebarExpanded = isMobile ? sidebarOpen : !settings.sidebarCollapsed

  const sidebarToggleLabel = isMobile
    ? sidebarOpen
      ? 'Close navigation menu'
      : 'Open navigation menu'
    : settings.sidebarCollapsed
      ? 'Expand sidebar'
      : 'Collapse sidebar'

  const guestPlaceholder = (title: string, body: string) => (
    <PlaceholderView
      title={title}
      description={body}
      actionLabel="Log in"
      onAction={openAuth}
    />
  )

  let main: ReactNode

  if (!isAuthenticated) {
    if (section === 'ask' || section === 'new-chat') {
      main = <LandingView />
    } else if (section === 'settings') {
      main = <SettingsView isGuest onLogin={openAuth} />
    } else if (section === 'calendar') {
      main = guestPlaceholder(
        'Calendar',
        'Log in to use your cycle calendar and predictions.',
      )
    } else if (section === 'health-insights') {
      main = <InsightsView />
    } else if (section === 'wellness-tips') {
      main = <TipsView />
    } else if (section === 'history') {
      main = guestPlaceholder(
        'History / logs',
        'Chat and symptom history stays private to your account.',
      )
    } else {
      main = <LandingView />
    }
  } else if (section === 'dashboard') {
    main = <DashboardView />
  } else if (section === 'ask') {
    main = <ChatView />
  } else if (section === 'settings') {
    main = <SettingsView onLogout={handleLogout} />
  } else if (section === 'insights') {
    main = <InsightsView />
  } else if (section === 'tips') {
    main = <TipsView />
  } else if (
    section === 'symptoms' ||
    section === 'education' ||
    section === 'tracker'
  ) {
    const copy: Record<string, { title: string; description: string }> = {
      symptoms: {
        title: 'Symptoms',
        description:
          'Daily symptom logging with gentle charts — implementation next.',
      },
      education: {
        title: 'Education',
        description:
          'Structured guides on hormones, phases, and when to seek care.',
      },
      tracker: {
        title: 'Tracker',
        description:
          'Period dates, flow, notes, and optional fertile-window hints.',
      },
    }
    const s = copy[section]
    main = (
      <PlaceholderView title={s.title} description={s.description} />
    )
  } else {
    main = <DashboardView />
  }

  const sidebarActive: SectionId | null =
    isAuthenticated && section === 'dashboard' ? null : section

  return (
    <ChatSessionContext.Provider
      value={{ temporaryChat, setTemporaryChat }}
    >
      <div className="app-shell">
        <Sidebar
          isAuthenticated={isAuthenticated}
          active={sidebarActive}
          onNavigate={setSection}
          mobileOpen={sidebarOpen}
          onCloseMobile={() => setSidebarOpen(false)}
          onLogin={openAuth}
          isMobile={isMobile}
          desktopCollapsed={settings.sidebarCollapsed}
          onToggleDesktopCollapse={() =>
            updateSettings({ sidebarCollapsed: !settings.sidebarCollapsed })
          }
        />

        <div className="app-main">
          <Header
            isAuthenticated={isAuthenticated}
            onToggleSidebar={toggleSidebar}
            sidebarExpanded={sidebarExpanded}
            sidebarToggleLabel={sidebarToggleLabel}
            onOpenAuth={openAuth}
            onGoHome={goHome}
            temporaryChat={isAuthenticated ? temporaryChat : undefined}
            onToggleTemporaryChat={
              isAuthenticated
                ? () => setTemporaryChat((t) => !t)
                : undefined
            }
            onLogout={handleLogout}
            onOpenSettings={() => {
              setSection('settings')
              setSidebarOpen(false)
            }}
          />

          <main className="app-canvas">{main}</main>
        </div>
      </div>

      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onContinue={completeDemoSignIn}
      />
    </ChatSessionContext.Provider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <DashboardDataProvider>
          <ThemeSync />
          <MainShell />
        </DashboardDataProvider>
      </SettingsProvider>
    </AuthProvider>
  )
}
