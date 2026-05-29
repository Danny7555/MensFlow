import { useCallback, useState, lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { LazyMotion, domAnimation } from 'framer-motion'
import { cn } from './lib/utils'
import { ThemeSync } from './components/ThemeSync'
import { Toaster } from 'sonner'
import { AuthProvider } from './context/AuthProvider'
import { ChatSessionContext } from './context/chat-session-context'
import { useAuth } from './context/useAuth'
import { useStore } from './store/useStore'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { House, Target, Heartbeat, Bell, UserCircle } from '@phosphor-icons/react'
import { useMediaQuery } from './hooks/useMediaQuery'
import { PageLoader } from './components/skeletons/PageLoader'
import { AccessGate } from './components/AccessGate'
import './App.css'

// Asynchronously Lazy Loaded Page Components
const ChatView = lazy(() => import('./views/ChatView').then(m => ({ default: m.ChatView })))
const DashboardView = lazy(() => import('./views/DashboardView').then(m => ({ default: m.DashboardView })))
const InsightsView = lazy(() => import('./views/InsightsView').then(m => ({ default: m.InsightsView })))
const TipsView = lazy(() => import('./views/TipsView').then(m => ({ default: m.TipsView })))
const LandingView = lazy(() => import('./views/LandingView').then(m => ({ default: m.LandingView })))
const SettingsView = lazy(() => import('./views/SettingsView').then(m => ({ default: m.SettingsView })))
const CalendarView = lazy(() => import('./views/CalendarView').then(m => ({ default: m.CalendarView })))
const TrackerView = lazy(() => import('./views/TrackerView').then(m => ({ default: m.TrackerView })))
const SymptomsView = lazy(() => import('./views/SymptomsView').then(m => ({ default: m.SymptomsView })))
const EducationView = lazy(() => import('./views/EducationView').then(m => ({ default: m.EducationView })))
const OnboardingView = lazy(() => import('./views/OnboardingView').then(m => ({ default: m.OnboardingView })))
const NotificationsView = lazy(() => import('./views/NotificationsView').then(m => ({ default: m.NotificationsView })))
const SyncView = lazy(() => import('./views/SyncView').then(m => ({ default: m.SyncView })))
const LockedChatsView = lazy(() => import('./views/LockedChatsView').then(m => ({ default: m.LockedChatsView })))
const NotFoundView = lazy(() => import('./views/NotFoundView').then(m => ({ default: m.NotFoundView })))


function MainShell() {
  const { isAuthenticated, onboardingCompleted, logout, openAuthModal, isRehydrating } = useAuth()
  const { settings, updateSettings } = useStore()
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [temporaryChat, setTemporaryChat] = useState(false)

  const handleLogout = useCallback(() => {
    logout()
    setTemporaryChat(false)
    navigate('/')
  }, [logout, navigate])

  const toggleSidebar = useCallback(() => {
    if (isMobile) setSidebarOpen((o) => !o)
    else updateSettings({ sidebarCollapsed: !settings.sidebarCollapsed })
  }, [isMobile, settings.sidebarCollapsed, updateSettings])

  if (isRehydrating) {
    return <PageLoader />
  }

  const sidebarExpanded = isMobile ? sidebarOpen : !settings.sidebarCollapsed

  const sidebarToggleLabel = isMobile
    ? sidebarOpen
      ? 'Close navigation menu'
      : 'Open navigation menu'
    : settings.sidebarCollapsed
      ? 'Expand sidebar'
      : 'Collapse sidebar'



  return (
    <ChatSessionContext.Provider
      value={{ temporaryChat, setTemporaryChat }}
    >
      <div className="app-shell">
        <LazyMotion features={domAnimation}>
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
          />
        )}

        <div className={cn("app-main", location.pathname.startsWith('/onboarding') && "app-main--full")}>
          {!location.pathname.startsWith('/onboarding') && location.pathname !== '/dashboard' && location.pathname !== '/' && (
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

          <main className={cn("app-canvas", isAuthenticated && isMobile && !location.pathname.startsWith('/onboarding') && "pb-bottom-nav")}>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {!isAuthenticated ? (
                  <>
                    <Route path="/" element={<LandingView />} />
                    <Route path="/onboarding" element={<OnboardingView />} />
                    <Route path="/settings" element={<SettingsView isGuest onLogin={openAuthModal} />} />
                    <Route path="/education" element={<EducationView />} />
                    
                    {/* All other paths redirect to Landing Page */}
                    <Route path="/ask" element={<Navigate to="/" replace />} />
                    <Route path="/dashboard" element={<Navigate to="/" replace />} />
                    <Route path="/calendar" element={<Navigate to="/" replace />} />
                    <Route path="/tracker" element={<Navigate to="/" replace />} />
                    <Route path="/insights" element={<Navigate to="/" replace />} />
                    <Route path="/tips" element={<Navigate to="/" replace />} />
                    <Route path="/symptoms" element={<Navigate to="/" replace />} />
                    <Route path="/sync" element={<Navigate to="/" replace />} />
                    <Route path="/notifications" element={<Navigate to="/" replace />} />
                    <Route path="/locked-chats" element={<Navigate to="/" replace />} />
                    <Route path="/history" element={<Navigate to="/" replace />} />
                    <Route path="*" element={<NotFoundView />} />
                  </>
                ) : (
                  <>
                    <Route 
                      path="/" 
                      element={!onboardingCompleted ? <Navigate to="/onboarding" replace /> : <Navigate to="/dashboard" replace />} 
                    />
                    <Route path="/onboarding" element={<OnboardingView />} />
                    <Route path="/dashboard" element={<AccessGate><DashboardView /></AccessGate>} />
                    <Route path="/ask" element={<ChatView />} />
                    <Route path="/settings" element={<SettingsView onLogout={handleLogout} />} />
                    <Route path="/insights" element={<AccessGate><InsightsView /></AccessGate>} />
                    <Route path="/health-insights" element={<Navigate to="/insights" replace />} />
                    <Route path="/tips" element={<AccessGate><TipsView /></AccessGate>} />
                    <Route path="/wellness-tips" element={<Navigate to="/tips" replace />} />
                    <Route path="/calendar" element={<AccessGate><CalendarView /></AccessGate>} />
                    <Route path="/notifications" element={<AccessGate><NotificationsView /></AccessGate>} />
                    <Route path="/tracker" element={<AccessGate><TrackerView /></AccessGate>} />
                    <Route path="/symptoms" element={<AccessGate><SymptomsView /></AccessGate>} />
                    <Route path="/education" element={<EducationView />} />
                    <Route path="/sync" element={<AccessGate><SyncView /></AccessGate>} />
                    <Route path="/locked-chats" element={<LockedChatsView />} />
                    <Route path="*" element={<NotFoundView />} />
                  </>
                )}
              </Routes>
            </Suspense>
          </main>
        </div>
        </LazyMotion>
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

import { resolveEffectiveTheme } from './lib/theme'

function DynamicToaster() {
  const themeMode = useStore((state) => state.settings.themeMode)
  const resolved = resolveEffectiveTheme(themeMode)
  return <Toaster position="top-right" richColors theme={resolved} className="mt-14" />
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeSync />
      <MainShell />
      <DynamicToaster />
    </AuthProvider>
  )
}
