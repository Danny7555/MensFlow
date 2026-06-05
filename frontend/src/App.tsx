/* eslint-disable */
import { useCallback, useState, useMemo, lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { LazyMotion, domAnimation, AnimatePresence } from 'framer-motion'
import { cn } from './lib/utils'
import { ThemeSync } from './components/ThemeSync'
import { Toaster } from 'sonner'
import { AuthProvider } from './context/AuthProvider'
import { ChatSessionContext } from './context/chat-session-context'
import { useAuth } from './context/useAuth'
import { useStore } from './store/useStore'
import { useReactQuerySync } from './hooks/useReactQuerySync'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { House, Target, Heartbeat, Bell, UserCircle, BookOpen, ChatCircle, Lock, LockKey, ShieldCheck, WarningCircle, CheckCircle, Sparkle } from '@phosphor-icons/react'
import { useMediaQuery } from './hooks/useMediaQuery'
import { useSmartPushNotifications } from './hooks/useSmartPushNotifications'
import { useNotificationsListener } from './hooks/useNotificationsListener'
import { PageLoader } from './components/skeletons/PageLoader'
import { ScrollToTop } from './components/ScrollToTop'
import { AccessGate } from './components/AccessGate'
import { Button } from './components/ui/button'
import { SECURITY_QUESTIONS } from './lib/constants'
import { getPasswordStrength } from './lib/passwordStrength'
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


function ChatLockGate({ children }: { children: React.ReactNode }) {
  const settings = useStore((s) => s.settings)
  const location = useLocation()
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [mode, setMode] = useState<'unlock' | 'reset-security' | 'reset-password'>('unlock')
  const [securityAnswer, setSecurityAnswer] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const activeQuestion = SECURITY_QUESTIONS.find(q => q.id === settings.privacyLockChatsSecurityQuestion)
  const strengthResult = getPasswordStrength(newPassword)
  const isStrong = strengthResult ? strengthResult.isStrong : false

  // If privacy lock is off, or already on the locked-chats dedicated page, render children normally
  if (!settings.privacyLockChats || location.pathname === '/locked-chats') {
    return <>{children}</>
  }

  // Privacy lock is on — show the passcode gate
  if (!isUnlocked) {
    if (mode === 'reset-security') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
          <div className="size-20 rounded-full bg-[var(--mf-accent-soft)] flex items-center justify-center text-[var(--mf-accent)] mb-6 shadow-sm">
            <ShieldCheck size={40} weight="duotone" />
          </div>
          <h2 className="text-2xl font-medium tracking-tight mb-2 text-foreground">Security Question</h2>
          <p className="text-muted-foreground max-w-sm mb-8 text-sm">
            {activeQuestion ? activeQuestion.label : 'Answer your security question to reset your password.'}
          </p>
          
          <form 
            className="w-full max-w-xs space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (securityAnswer.trim().toLowerCase() === settings.privacyLockChatsSecurityAnswer) {
                setMode('reset-password')
                setError(false)
                setSecurityAnswer('')
              } else {
                setError(true)
              }
            }}
          >
            <div className="space-y-2 text-left">
              {activeQuestion?.type === 'select' ? (
                <select 
                  className={`w-full h-12 px-4 rounded-xl bg-muted border ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-border focus:border-[var(--mf-accent-border)] focus:ring-[var(--mf-accent)]'} focus:ring-1 transition-all outline-none text-base`}
                  value={securityAnswer}
                  onChange={(e) => {
                    setSecurityAnswer(e.target.value)
                    setError(false)
                  }}
                >
                  <option value="" disabled>Select an answer…</option>
                  {activeQuestion.options?.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input 
                  type="text" 
                  placeholder="Enter your answer"
                  value={securityAnswer}
                  onChange={(e) => {
                    setSecurityAnswer(e.target.value)
                    setError(false)
                  }}
                  className={`w-full h-12 px-4 rounded-xl bg-muted border ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-border focus:border-[var(--mf-accent-border)] focus:ring-[var(--mf-accent)]'} focus:ring-1 transition-all outline-none text-base`}
                  aria-label="Security answer"
                />
              )}
            </div>
            {error && <p className="text-xs text-red-500 text-left px-1 animate-in slide-in-from-top-1">Incorrect answer. Please try again.</p>}
            <Button type="submit" disabled={!securityAnswer.trim()} className="w-full rounded-xl h-12 font-medium">
              Verify
            </Button>
            <Button type="button" variant="ghost" className="w-full rounded-xl text-sm" onClick={() => { setMode('unlock'); setError(false); }}>
              Cancel
            </Button>
          </form>
        </div>
      )
    }

    if (mode === 'reset-password') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
          <div className="size-20 rounded-full bg-[var(--mf-accent-soft)] flex items-center justify-center text-[var(--mf-accent)] mb-6 shadow-sm">
            <Lock size={40} weight="duotone" />
          </div>
          <h2 className="text-2xl font-medium tracking-tight mb-2 text-foreground">New Password</h2>
          <p className="text-muted-foreground max-w-sm mb-8 text-sm">
            Create a new password to protect your hidden conversations.
          </p>
          
          <form 
            className="w-full max-w-xs space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (isStrong) {
                useStore.getState().updateSettings({ privacyLockChatsPassword: newPassword })
                setIsUnlocked(true)
                setMode('unlock')
                setPassword('')
                setNewPassword('')
                setFailedAttempts(0)
              }
            }}
          >
            <div className="relative text-left">
              <LockKey size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="password" 
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full h-12 pl-10 pr-4 rounded-xl bg-muted border border-border focus:border-[var(--mf-accent-border)] focus:ring-[var(--mf-accent)] focus:ring-1 transition-all outline-none text-base"
                aria-label="New password"
              />
              {newPassword && (
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
                    <p className="text-[10px] text-muted-foreground leading-normal text-left flex items-center gap-2">
                      <WarningCircle size={14} aria-hidden="true" className="text-rose-500" />
                      <span>Make it at least 8 characters with numbers or special symbols.</span>
                    </p>
                  )}
                  {strengthResult?.label === 'Good' && (
                    <p className="text-[10px] text-muted-foreground leading-normal text-left flex items-center gap-2">
                      <CheckCircle size={14} aria-hidden="true" className="text-amber-500" />
                      <span>Good! Add uppercase letters and symbols for maximum security.</span>
                    </p>
                  )}
                  {strengthResult?.label === 'Excellent' && (
                    <p className="text-[10px] leading-normal font-medium text-emerald-500 dark:text-emerald-400 text-left flex items-center gap-2">
                      <Sparkle size={14} aria-hidden="true" className="text-emerald-500" />
                      <span>Excellent! Your privacy is highly secure.</span>
                    </p>
                  )}
                </div>
              )}
            </div>
            <Button type="submit" disabled={!isStrong} className="w-full rounded-xl h-12 font-medium">
              Update & Unlock
            </Button>
          </form>
        </div>
      )
    }

    // Default: passcode entry
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
        <div className="size-20 rounded-full bg-[var(--mf-accent-soft)] flex items-center justify-center text-[var(--mf-accent)] mb-6 shadow-sm">
          <Lock size={40} weight="duotone" />
        </div>
        <h2 className="text-2xl font-medium tracking-tight mb-2 text-foreground">Privacy Lock</h2>
        <p className="text-muted-foreground max-w-sm mb-8 text-sm">
          Enter your privacy password to access your conversations.
        </p>
        
        <form 
          className="w-full max-w-xs space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (password === settings.privacyLockChatsPassword) {
              setIsUnlocked(true)
              setError(false)
              setFailedAttempts(0)
            } else {
              setError(true)
              setFailedAttempts(f => f + 1)
            }
          }}
        >
          <div className="relative">
            <LockKey size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="password" 
              placeholder="Enter password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError(false)
              }}
              className={`w-full h-12 pl-10 pr-4 rounded-xl bg-muted border ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-border focus:border-[var(--mf-accent-border)] focus:ring-[var(--mf-accent)]'} focus:ring-1 transition-all outline-none text-base`}
              aria-label="Privacy password"
            />
          </div>
          {error && <p className="text-xs text-red-500 text-left px-1 animate-in slide-in-from-top-1">Incorrect password. Please try again.</p>}
          <Button type="submit" className="w-full rounded-xl h-12 font-medium">
            Unlock
          </Button>
          {failedAttempts >= 3 && settings.privacyLockChatsSecurityQuestion && (
            <div className="pt-2 animate-in fade-in duration-500">
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full text-sm text-[var(--mf-accent)] hover:bg-[var(--mf-accent-soft)]"
                onClick={() => {
                  setMode('reset-security')
                  setError(false)
                  setSecurityAnswer('')
                }}
              >
                Forgot Password?
              </Button>
            </div>
          )}
        </form>
      </div>
    )
  }

  // Unlocked — render the actual chat page with a re-lock button in the header area
  return (
    <div className="flex flex-col h-full w-full">
      {/* Re-lock bar */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Lock size={16} weight="fill" className="text-[var(--mf-accent)]" />
          <span className="text-xs font-medium text-muted-foreground">Chats unlocked</span>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="rounded-lg h-8 text-xs font-medium"
          onClick={() => {
            setIsUnlocked(false)
            setPassword('')
            setError(false)
            setFailedAttempts(0)
            setMode('unlock')
          }}
        >
          Lock Now
        </Button>
      </div>
      <div className="flex-1 flex flex-col relative overflow-hidden bg-background">
        {children}
      </div>
    </div>
  )
}


function MainShell() {
  useReactQuerySync()
  const { isAuthenticated, onboardingCompleted, logout, openAuthModal, isRehydrating } = useAuth()
  const { settings, updateSettings, user, notificationCount } = useStore()
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [temporaryChat, setTemporaryChat] = useState(false)
  const contextValue = useMemo(() => ({ temporaryChat, setTemporaryChat }), [temporaryChat])

  // Fire smart browser push notifications based on real cycle data
  useSmartPushNotifications()
  // Globally listen for and process real-time notifications
  useNotificationsListener()

  const dashboardNotificationCount = notificationCount + (user?.role === 'lady' && settings.privacyPendingAccessRequest ? 1 : 0)

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
    return (
      <div className={cn("app-shell", user?.role === 'partner' && "partner-theme")}>
        <div className="app-main app-main--full">
          <main className="app-canvas">
            <PageLoader />
          </main>
        </div>
      </div>
    )
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
      value={contextValue}
    >
      <div className={cn("app-shell", user?.role === 'partner' && "partner-theme")}>
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

          <main className={cn(
            "app-canvas",
            isAuthenticated &&
            isMobile &&
            !location.pathname.startsWith('/onboarding') &&
            location.pathname !== '/dashboard' &&
            location.pathname !== '/sync' &&
            "pb-bottom-nav"
          )}>
            <Suspense fallback={<PageLoader />}>
              <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
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
                    <Route path="/history" element={<Navigate to="/" replace />} />
                    {/* locked-chats is available regardless of auth (LockedChatsView handles its own gating) */}
                    <Route path="/locked-chats" element={<LockedChatsView />} />
                    <Route path="*" element={<NotFoundView />} />
                  </>
                ) : (
                  <>
                    <Route 
                      path="/" 
                      element={
                        !onboardingCompleted 
                          ? <Navigate to="/onboarding" replace /> 
                          : (user?.accessLevel === 'educational' 
                              ? <Navigate to="/education" replace /> 
                              : <Navigate to="/dashboard" replace />)
                      } 
                    />
                    <Route path="/onboarding" element={<OnboardingView />} />
                    <Route path="/dashboard" element={<AccessGate><DashboardView /></AccessGate>} />
                    <Route path="/ask" element={<ChatLockGate><Suspense fallback={<PageLoader />}><ChatView /></Suspense></ChatLockGate>} />
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
              </AnimatePresence>
            </Suspense>
          </main>
        </div>
        </LazyMotion>
        {!location.pathname.startsWith('/onboarding') && isAuthenticated && isMobile && (
          <nav className="flo-bottom-nav">
            {user?.accessLevel === 'educational' ? (
              <>
                <button type="button" 
                  className={cn("flo-nav-item", location.pathname === '/education' && "flo-nav-item--active")}
                  onClick={() => navigate('/education')}
                >
                  <BookOpen size={24} weight={location.pathname === '/education' ? "fill" : "regular"} />
                  <span className="flo-nav-label">Education</span>
                </button>
                <button type="button" 
                  className={cn("flo-nav-item", location.pathname === '/ask' && "flo-nav-item--active")}
                  onClick={() => navigate('/ask')}
                >
                  <ChatCircle size={24} weight={location.pathname === '/ask' ? "fill" : "regular"} />
                  <span className="flo-nav-label">Ask AI</span>
                </button>
                <button type="button" 
                  className={cn("flo-nav-item", location.pathname === '/settings' && "flo-nav-item--active")}
                  onClick={() => navigate('/settings')}
                >
                  <UserCircle size={24} weight={location.pathname === '/settings' ? "fill" : "light"} />
                  <span className="flo-nav-label">Profile</span>
                </button>
              </>
            ) : (
              <>
                <button type="button" 
                  className={cn("flo-nav-item", location.pathname === '/dashboard' && "flo-nav-item--active")}
                  onClick={() => navigate('/dashboard')}
                >
                  <House size={24} weight={location.pathname === '/dashboard' ? "fill" : "regular"} />
                  <span className="flo-nav-label">Home</span>
                </button>
                <button type="button" 
                  className={cn("flo-nav-item", (location.pathname === '/insights' || location.pathname === '/health-insights') && "flo-nav-item--active")}
                  onClick={() => navigate('/insights')}
                >
                  <Target size={24} weight={(location.pathname === '/insights' || location.pathname === '/health-insights') ? "fill" : "regular"} />
                  <span className="flo-nav-label">Insights</span>
                </button>
                <button type="button" 
                  className={cn("flo-nav-item", (location.pathname === '/tips' || location.pathname === '/wellness-tips') && "flo-nav-item--active")}
                  onClick={() => navigate('/tips')}
                >
                  <Heartbeat size={24} weight={(location.pathname === '/tips' || location.pathname === '/wellness-tips') ? "fill" : "light"} />
                  <span className="flo-nav-label">Wellness</span>
                </button>
                <button type="button" 
                  className={cn("flo-nav-item", location.pathname === '/notifications' && "flo-nav-item--active")}
                  onClick={() => navigate('/notifications')}
                >
                  <div className="relative">
                    <Bell size={24} weight={location.pathname === '/notifications' ? "fill" : "light"} />
                    {dashboardNotificationCount > 0 && (
                      <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-[var(--mf-accent)] text-white text-[9px] font-bold flex items-center justify-center shadow-md animate-in fade-in zoom-in-95 duration-200">
                        {dashboardNotificationCount > 99 ? '99+' : dashboardNotificationCount}
                      </span>
                    )}
                  </div>
                  <span className="flo-nav-label">Alerts</span>
                </button>
                <button type="button" 
                  className={cn("flo-nav-item", location.pathname === '/settings' && "flo-nav-item--active")}
                  onClick={() => navigate('/settings')}
                >
                  <UserCircle size={24} weight={location.pathname === '/settings' ? "fill" : "light"} />
                  <span className="flo-nav-label">Profile</span>
                </button>
              </>
            )}
          </nav>
        )}
        <ScrollToTop />
      </div>
    </ChatSessionContext.Provider>
  )
}

import { resolveEffectiveTheme } from './lib/theme'

function DynamicToaster() {
  const themeMode = useStore((state) => state.settings.themeMode)
  const resolved = resolveEffectiveTheme(themeMode)
  return (
    <Toaster 
      position="top-center" 
      richColors 
      theme={resolved} 
      className="mt-14" 
      toastOptions={{
        style: {
          maxWidth: 'none',
          width: 'max-content',
          paddingTop: '8px',
          paddingBottom: '8px',
        }
      }}
    />
  )
}

import { GlobalModalContainer } from './components/GlobalModalContainer'

export default function App() {
  return (
    <AuthProvider>
      <ThemeSync />
      <MainShell />
      <DynamicToaster />
      <GlobalModalContainer />
    </AuthProvider>
  )
}