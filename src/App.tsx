import { useCallback, useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
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
import { CalendarView } from './views/CalendarView'
import { TrackerView } from './views/TrackerView'
import { SymptomsView } from './views/SymptomsView'
import { EducationView } from './views/EducationView'
import { NotFoundView } from './views/NotFoundView'
import { AuthProvider } from './context/AuthProvider'
import { SettingsProvider } from './context/SettingsProvider'
import { ChatSessionContext } from './context/chat-session-context'
import { useAuth } from './context/useAuth'
import { useSettings } from './context/useSettings'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'

import { useMediaQuery } from './hooks/useMediaQuery'
import './App.css'

function MainShell() {
  const { isAuthenticated, login, logout } = useAuth()
  const { settings, updateSettings } = useSettings()
  const navigate = useNavigate()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [temporaryChat, setTemporaryChat] = useState(false)

  const openAuth = useCallback(() => setAuthModalOpen(true), [])

  const completeDemoSignIn = useCallback(
    (method: AuthMethod) => {
      void method
      login()
      setTemporaryChat(settings.privacyDefaultTemporaryChat)
      setAuthModalOpen(false)
    },
    [login, settings.privacyDefaultTemporaryChat],
  )

  const handleLogout = useCallback(() => {
    logout()
    setTemporaryChat(false)
  }, [logout])

  // goHome removed since NavLink manages it

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

  return (
    <ChatSessionContext.Provider
      value={{ temporaryChat, setTemporaryChat }}
    >
      <div className="app-shell">
        <Sidebar
          isAuthenticated={isAuthenticated}
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
            temporaryChat={isAuthenticated ? temporaryChat : undefined}
            onToggleTemporaryChat={
              isAuthenticated
                ? () => {
                    const next = !temporaryChat
                    setTemporaryChat(next)
                    if (next) {
                      navigate('/ask')
                    }
                  }
                : undefined
            }
            onLogout={handleLogout}
          />

          <main className="app-canvas">
            <Routes>
              {!isAuthenticated ? (
                <>
                  <Route path="/" element={<LandingView />} />
                  <Route path="/ask" element={<LandingView />} />
                  <Route path="/settings" element={<SettingsView isGuest onLogin={openAuth} />} />
                  <Route path="/calendar" element={<CalendarView />} />
                  <Route path="/tracker" element={<TrackerView />} />
                  <Route path="/health-insights" element={<InsightsView />} />
                  <Route path="/wellness-tips" element={<TipsView />} />
                  <Route path="/history" element={guestPlaceholder('History / logs', 'Chat and symptom history stays private to your account.')} />
                  <Route path="*" element={<NotFoundView />} />
                </>
              ) : (
                <>
                  <Route path="/" element={<Navigate to="/dashboard" />} />
                  <Route path="/dashboard" element={<DashboardView />} />
                  <Route path="/ask" element={<ChatView />} />
                  <Route path="/settings" element={<SettingsView onLogout={handleLogout} />} />
                  <Route path="/insights" element={<InsightsView />} />
                  <Route path="/tips" element={<TipsView />} />
                  <Route path="/calendar" element={<CalendarView />} />
                  <Route path="/tracker" element={<TrackerView />} />
                  <Route path="/symptoms" element={<SymptomsView />} />
                  <Route path="/education" element={<EducationView />} />
                  <Route path="*" element={<NotFoundView />} />
                </>
              )}
            </Routes>
          </main>
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
