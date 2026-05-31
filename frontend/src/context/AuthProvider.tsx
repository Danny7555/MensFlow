import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from './auth-context'
import { AuthModal } from '../components/AuthModal'
import { authApi } from '../services/authService'
import { userApi, type ApiUser, userKeys } from '../services/userService'
import { chatKeys } from '../services/chatService'
import { setToken, clearToken, isLoggedIn } from '../lib/auth-token'
import { useStore } from '../store/useStore'
import { queryClient } from '../lib/queryClient'


const getLocalOnboarding = () => sessionStorage.getItem('mf_onboarding') === 'true'
const getLocalPartnerCode = () => sessionStorage.getItem('mf_partner_code')

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { hydrate, resetStore } = useStore()

  const [state, setState] = useState({
    isAuthenticated: isLoggedIn(),
    onboardingCompleted: getLocalOnboarding(),
    user: null as ApiUser | null,
    isLoading: false,
    isRehydrating: isLoggedIn(),
  })
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [initialAuthMode, setInitialAuthMode] = useState<'login' | 'register'>('login')
  // OTP flow state
  const [otpPending, setOtpPending] = useState(false)
  const [otpToken, setOtpToken] = useState<string | null>(null)
  const [otpEmail, setOtpEmail] = useState('')

  // ── Rehydrate store from API on mount if token exists ──────────────────────
  useEffect(() => {
    if (!isLoggedIn()) {
      const t = setTimeout(() => setState(prev => ({ ...prev, isRehydrating: false })), 0)
      return () => clearTimeout(t)
    }

    userApi.getProfile()
      .then(({ user: u, settings, dashboard }) => {
        setState(prev => ({
          ...prev,
          user: u,
          onboardingCompleted: u.isOnboarded,
        }))
        hydrate({ user: u, settings, dashboard })
        
        // Fetch logs, custom symptoms, and partner status from backend database
        const store = useStore.getState()
        store.fetchLogs().catch((err) => console.error('Failed to load logs', err))
        store.fetchCustomSymptoms().catch((err) => console.error('Failed to load custom symptoms', err))
        store.fetchPartnerStatus().catch((err) => console.error('Failed to load partner status', err))

        // Invalidate only the data queries that depend on the freshly-loaded profile
        void queryClient.invalidateQueries({ queryKey: userKeys.profile })
        void queryClient.invalidateQueries({ queryKey: chatKeys.sessions })
      })
      .catch(() => {
        // Token expired or invalid — clear it
        clearToken()
        setState(prev => ({ ...prev, isAuthenticated: false }))
      })
      .finally(() => {
        setState(prev => ({ ...prev, isRehydrating: false }))
      })
  }, [hydrate])

  // ── Auto-logout on token expiry (fired by apiClient on 401) ────────────────
  useEffect(() => {
    const handleAuthExpired = () => {
      console.warn('[AuthProvider] Session expired — logging out')
      clearToken()
      sessionStorage.removeItem('mf_onboarding')
      setState(prev => ({ ...prev, isAuthenticated: false, user: null, onboardingCompleted: false }))
      resetStore()
      queryClient.clear()
      navigate('/')
    }
    window.addEventListener('mf:auth:expired', handleAuthExpired)
    return () => window.removeEventListener('mf:auth:expired', handleAuthExpired)
  }, [navigate, resetStore])

  // ── Global Background Real-Time Synchronization (every 10s) ────────────────
  useEffect(() => {
    if (!state.isAuthenticated) return

    const syncInterval = setInterval(() => {
      const store = useStore.getState()
      store.fetchPartnerStatus().catch((err) => console.error('Failed to sync partner status in background', err))
      store.fetchLogs().catch((err) => console.error('Failed to sync daily logs in background', err))
    }, 10000)

    return () => clearInterval(syncInterval)
  }, [state.isAuthenticated])

  // ── Post-auth hydration helper ─────────────────────────────────────────────
  const completeAuthFlow = useCallback(async (token: string, u: ApiUser) => {
    setToken(token)
    const localOnboarding = getLocalOnboarding()
    const isOnboarded = u.isOnboarded || localOnboarding
    setState(prev => ({ ...prev, user: u, onboardingCompleted: isOnboarded, isAuthenticated: true }))
    setAuthModalOpen(false)
    setOtpPending(false)
    setOtpToken(null)
    setOtpEmail('')

    if (localOnboarding && !u.isOnboarded) {
      const storeUser = useStore.getState().user
      const patch: Partial<ApiUser> = { isOnboarded: true }
      if (storeUser.name) patch.name = storeUser.name
      if (storeUser.role) patch.role = storeUser.role
      if (storeUser.accessLevel) patch.accessLevel = storeUser.accessLevel
      await userApi.updateProfile(patch).catch(err => console.error('Failed to sync guest onboarding', err))

      const storeDashboard = useStore.getState().dashboard
      await userApi.updateDashboard({
        lastPeriodStart: storeDashboard.lastPeriodStart,
        typicalCycleDays: storeDashboard.typicalCycleDays,
        phaseLabel: storeDashboard.phaseLabel,
        hormoneTrend: storeDashboard.hormoneTrend,
        bodySignals: storeDashboard.bodySignals,
        guidanceLines: storeDashboard.guidanceLines,
        cycleNotes: storeDashboard.cycleNotes,
        cycleVariationDays: storeDashboard.cycleVariationDays,
        isAtypical: storeDashboard.isAtypical,
      }).catch(err => console.error('Failed to sync guest dashboard', err))
    }

    const profile = await userApi.getProfile()
    setState(prev => ({ ...prev, onboardingCompleted: profile.user.isOnboarded }))
    hydrate({ user: profile.user, settings: profile.settings, dashboard: profile.dashboard })

    const localPartnerCode = getLocalPartnerCode()
    if (localPartnerCode) {
      await useStore.getState().pairPartner(localPartnerCode).catch(err =>
        console.error('Failed to auto-pair partner code', err)
      )
      sessionStorage.removeItem('mf_partner_code')
    }

    void queryClient.invalidateQueries({ queryKey: userKeys.profile })
    void queryClient.invalidateQueries({ queryKey: chatKeys.sessions })

    const store = useStore.getState()
    await Promise.all([
      store.fetchLogs(),
      store.fetchCustomSymptoms(),
      store.fetchPartnerStatus()
    ]).catch(err => console.error('Failed to load user data', err))

    navigate(profile.user.isOnboarded
      ? (profile.user.accessLevel === 'educational' ? '/education' : '/dashboard')
      : '/onboarding'
    )
  }, [navigate, hydrate])

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (username: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true }))
    try {
      const result = await authApi.login(username, password)
      if (result.requiresOtp && result.otpToken) {
        // OTP required — store temp token and show OTP step
        setOtpToken(result.otpToken)
        setOtpEmail(username)
        setOtpPending(true)
        return
      }
      if (!result.token) throw new Error('No token received')
      await completeAuthFlow(result.token, result.user)
    } catch (err) {
      setState(prev => ({ ...prev, isLoading: false }))
      throw err
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [completeAuthFlow])

  // ── Register ───────────────────────────────────────────────────────────────
  const register = useCallback(async (username: string, email: string, password: string, name: string, role?: 'lady' | 'partner') => {
    setState(prev => ({ ...prev, isLoading: true }))
    try {
      const result = await authApi.register(username, email, password, name, role)
      if (result.requiresOtp && result.otpToken) {
        setOtpToken(result.otpToken)
        setOtpEmail(email)       // show the real email in the OTP modal
        setOtpPending(true)
        return
      }
      if (!result.token) throw new Error('No token received')
      await completeAuthFlow(result.token, result.user)
    } catch (err) {
      setState(prev => ({ ...prev, isLoading: false }))
      throw err
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [completeAuthFlow])

  // ── Verify OTP ─────────────────────────────────────────────────────────────
  const verifyOtp = useCallback(async (code: string) => {
    if (!otpToken) return
    setState(prev => ({ ...prev, isLoading: true }))
    try {
      const { token, user: u } = await authApi.verifyOtp(otpToken, code)
      await completeAuthFlow(token, u)
    } catch (err) {
      setState(prev => ({ ...prev, isLoading: false }))
      throw err
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [otpToken, completeAuthFlow])

  // ── Resend OTP ─────────────────────────────────────────────────────────────
  const resendOtp = useCallback(async () => {
    if (!otpToken) return
    const result = await authApi.resendOtp(otpToken)
    setOtpToken(result.otpToken)
  }, [otpToken])

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    clearToken()
    sessionStorage.removeItem('mf_onboarding')
    setState(prev => ({
      ...prev,
      onboardingCompleted: false,
      isAuthenticated: false,
      user: null,
    }))
    resetStore()
    queryClient.clear()
    navigate('/')
  }, [navigate, resetStore])

  // ── Onboarding ─────────────────────────────────────────────────────────────
  const completeOnboarding = useCallback(() => {
    sessionStorage.setItem('mf_onboarding', 'true')
    setState(prev => ({
      ...prev,
      onboardingCompleted: true,
    }))
    if (isLoggedIn()) {
      userApi.updateProfile({ isOnboarded: true }).catch((err) => {
        console.error('Failed to update onboarding state in backend', err)
      })
    }
  }, [])

  const openAuthModal = useCallback((initialMode: 'login' | 'register' = 'login') => {
    setInitialAuthMode(initialMode)
    setAuthModalOpen(true)
  }, [])

  const value = useMemo(
    () => ({
      isAuthenticated: state.isAuthenticated,
      onboardingCompleted: state.onboardingCompleted,
      isLoading: state.isLoading,
      isRehydrating: state.isRehydrating,
      user: state.user,
      login,
      register,
      logout,
      openAuthModal,
      completeOnboarding,
    }),
    [state.isAuthenticated, state.onboardingCompleted, state.isLoading, state.isRehydrating, state.user, login, register, logout, openAuthModal, completeOnboarding]
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthModal
        open={authModalOpen}
        isLoading={state.isLoading}
        initialMode={initialAuthMode}
        preFillName={initialAuthMode === 'register' ? (useStore.getState().user.name || '') : ''}
        onClose={() => {
          if (!otpPending) setAuthModalOpen(false)
        }}
        onLogin={login}
        onRegister={register}
        onVerifyOtp={verifyOtp}
        onResendOtp={resendOtp}
        otpMode={otpPending}
        otpEmail={otpEmail}
      />
    </AuthContext.Provider>
  )
}
