import { useCallback, useState } from 'react'
<<<<<<< HEAD
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { cn } from './lib/utils'
=======
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
>>>>>>> 7b2a41f (feat: implement comprehensive cycle tracking dashboard with new navigation, visualizations, and symptom logging components)
import { ThemeSync } from './components/ThemeSync'
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
<<<<<<< HEAD
import { Toaster } from 'sonner'
import { SymptomsView } from './views/SymptomsView'
import { EducationView } from './views/EducationView'
import { OnboardingView } from './views/OnboardingView'
import { NotificationsView } from './views/NotificationsView'
=======
import { SymptomsView } from './views/SymptomsView'
import { EducationView } from './views/EducationView'
>>>>>>> 7b2a41f (feat: implement comprehensive cycle tracking dashboard with new navigation, visualizations, and symptom logging components)
import { NotFoundView } from './views/NotFoundView'
import { AuthProvider } from './context/AuthProvider'
import { SettingsProvider } from './context/SettingsProvider'
import { ChatSessionContext } from './context/chat-session-context'
import { useAuth } from './context/useAuth'
import { useSettings } from './context/useSettings'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
<<<<<<< HEAD
import { House, Target, Heartbeat, Bell, UserCircle } from '@phosphor-icons/react'
=======

>>>>>>> 7b2a41f (feat: implement comprehensive cycle tracking dashboard with new navigation, visualizations, and symptom logging components)
import { useMediaQuery } from './hooks/useMediaQuery'
import './App.css'

function MainShell() {
<<<<<<< HEAD
  const { isAuthenticated, onboardingCompleted, logout, openAuthModal } = useAuth()
  const { settings, updateSettings } = useSettings()
  const navigate = useNavigate()
  const location = useLocation()
=======
  const { isAuthenticated, logout, openAuthModal } = useAuth()
  const { settings, updateSettings } = useSettings()
  const navigate = useNavigate()
>>>>>>> 7b2a41f (feat: implement comprehensive cycle tracking dashboard with new navigation, visualizations, and symptom logging components)
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [temporaryChat, setTemporaryChat] = useState(false)

  const handleLogout = useCallback(() => {
    logout()
    setTemporaryChat(false)
    navigate('/')
  }, [logout, navigate])

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
      onAction={openAuthModal}
    />
  )

  return (
    <ChatSessionContext.Provider
      value={{ temporaryChat, setTemporaryChat }}
    >
      <div className="app-shell">
<<<<<<< HEAD
        {!location.pathname.startsWith('/onboarding') && (!isMobile || location.pathname !== '/dashboard') && (
          <Sidebar
            isAuthenticated={isAuthenticated}
            mobileOpen={sidebarOpen}
            onCloseMobile={() => setSidebarOpen(false)}
            onLogin={openAuthModal}
            isMobile={isMobile}
            desktopCollapsed={settings.sidebarCollapsed}
            onToggleDesktopCollapse={() =>
              updateSettings({ sidebarCollapsed: !settings.sidebarCollapsed })
            }
=======
        <Sidebar
          isAuthenticated={isAuthenticated}
          mobileOpen={sidebarOpen}
          onCloseMobile={() => setSidebarOpen(false)}
          onLogin={openAuthModal}
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
            onOpenAuth={openAuthModal}
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
            isMobile={isMobile}
>>>>>>> 7b2a41f (feat: implement comprehensive cycle tracking dashboard with new navigation, visualizations, and symptom logging components)
          />
        )}

        <div className={cn("app-main", location.pathname.startsWith('/onboarding') && "app-main--full")}>
          {!location.pathname.startsWith('/onboarding') && location.pathname !== '/dashboard' && (
            <Header
              isAuthenticated={isAuthenticated}
              onToggleSidebar={toggleSidebar}
              sidebarExpanded={sidebarExpanded}
              sidebarToggleLabel={sidebarToggleLabel}
              onOpenAuth={openAuthModal}
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
              isMobile={isMobile}
            />
          )}

          <main className="app-canvas">
            <Routes>
              {!isAuthenticated ? (
                <>
                  <Route 
                    path="/" 
                    element={!onboardingCompleted ? <Navigate to="/onboarding" replace /> : <LandingView />} 
                  />
                  <Route path="/onboarding" element={<OnboardingView />} />
                  <Route path="/ask" element={<LandingView />} />
                  <Route path="/settings" element={<SettingsView isGuest onLogin={openAuthModal} />} />
                  <Route path="/calendar" element={<CalendarView />} />
                  <Route path="/tracker" element={<TrackerView />} />
                  <Route path="/health-insights" element={<InsightsView />} />
                  <Route path="/wellness-tips" element={<TipsView />} />
                  <Route path="/dashboard" element={<Navigate to="/" replace />} />
                  <Route path="/insights" element={<Navigate to="/health-insights" replace />} />
                  <Route path="/tips" element={<Navigate to="/wellness-tips" replace />} />
                  <Route path="/symptoms" element={<Navigate to="/tracker" replace />} />
                  <Route path="/education" element={<Navigate to="/" replace />} />
                  <Route path="/history" element={guestPlaceholder('History / logs', 'Chat and symptom history stays private to your account.')} />
                  <Route path="*" element={<NotFoundView />} />
                </>
              ) : (
                <>
                  <Route 
                    path="/" 
                    element={!onboardingCompleted ? <Navigate to="/onboarding" replace /> : <Navigate to="/dashboard" replace />} 
                  />
                  <Route path="/onboarding" element={<OnboardingView />} />
                  <Route path="/dashboard" element={<DashboardView />} />
                  <Route path="/ask" element={<ChatView />} />
                  <Route path="/settings" element={<SettingsView onLogout={handleLogout} />} />
                  <Route path="/insights" element={<InsightsView />} />
                  <Route path="/health-insights" element={<Navigate to="/insights" replace />} />
                  <Route path="/tips" element={<TipsView />} />
                  <Route path="/wellness-tips" element={<Navigate to="/tips" replace />} />
                  <Route path="/calendar" element={<CalendarView />} />
<<<<<<< HEAD
                  <Route path="/notifications" element={<NotificationsView />} />
=======
>>>>>>> 7b2a41f (feat: implement comprehensive cycle tracking dashboard with new navigation, visualizations, and symptom logging components)
                  <Route path="/tracker" element={<TrackerView />} />
                  <Route path="/symptoms" element={<SymptomsView />} />
                  <Route path="/education" element={<EducationView />} />
                  <Route path="*" element={<NotFoundView />} />
                </>
              )}
            </Routes>
          </main>
        </div>
        {!location.pathname.startsWith('/onboarding') && isAuthenticated && isMobile && (
          <nav className="flo-bottom-nav">
            <button 
              className={cn("flo-nav-item", location.pathname === '/dashboard' && "flo-nav-item--active")}
              onClick={() => navigate('/dashboard')}
            >
              <House size={24} weight={location.pathname === '/dashboard' ? "fill" : "regular"} />
              <span className="flo-nav-label">Home</span>
            </button>
            <button className="flo-nav-item" onClick={() => navigate('/insights')}>
              <Target size={24} />
              <span className="flo-nav-label">Insights</span>
            </button>
            <button 
              className={cn("flo-nav-item", location.pathname === '/wellness-tips' && "flo-nav-item--active")}
              onClick={() => navigate('/wellness-tips')}
            >
              <Heartbeat size={24} weight={location.pathname === '/wellness-tips' ? "fill" : "light"} />
              <span className="flo-nav-label">Wellness</span>
            </button>
            <button 
              className={cn("flo-nav-item", location.pathname === '/notifications' && "flo-nav-item--active")}
              onClick={() => navigate('/notifications')}
            >
              <Bell size={24} weight={location.pathname === '/notifications' ? "fill" : "light"} />
              <span className="flo-nav-label">Alerts</span>
            </button>
            <button 
              className={cn("flo-nav-item", location.pathname === '/settings' && "flo-nav-item--active")}
              onClick={() => navigate('/settings')}
            >
              <UserCircle size={24} weight={location.pathname === '/settings' ? "fill" : "light"} />
              <span className="flo-nav-label">Profile</span>
            </button>
          </nav>
        )}
      </div>
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
          <Toaster position="top-right" richColors theme="light" className="mt-14" />
        </DashboardDataProvider>
      </SettingsProvider>
    </AuthProvider>
  )
}
