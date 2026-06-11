/* eslint-disable */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AuthContext } from './auth-context'
import { AuthModal } from '../components/AuthModal'
import { authApi } from '../services/authService'
import { userApi, type ApiUser, type ApiSettings, type ApiDashboard, userKeys } from '../services/userService'
import { chatKeys } from '../services/chatService'
import { setToken, clearToken, isLoggedIn } from '../lib/auth-token'
import { useStore } from '../store/useStore'
import { queryClient } from '../lib/queryClient'


const getLocalOnboarding = () => sessionStorage.getItem('mf_onboarding') === 'true'
const getLocalPartnerCode = () => sessionStorage.getItem('mf_partner_code')

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { hydrate, resetStore } = useStore()

  // Capture partner code from URL query parameters (e.g. from an invite link)
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const code = params.get('code')
    if (code) {
      sessionStorage.setItem('mf_partner_code', code.toUpperCase())
      console.log('[AuthProvider] Captured partner code from URL:', code.toUpperCase())
    }
  }, [location.search])

  const [state, setState] = useState({
    isAuthenticated: isLoggedIn(),
    onboardingCompleted: getLocalOnboarding(),
    user: null as ApiUser | null,
    isLoading: false,
    isRehydrating: isLoggedIn(),
  })
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalLocked, setAuthModalLocked] = useState(false)
  const [initialAuthMode, setInitialAuthMode] = useState<'login' | 'register'>('login')
  // OTP flow state
  const [otpPending, setOtpPending] = useState(false)
  const otpTokenRef = useRef<string | null>(null)
  const [otpEmail, setOtpEmail] = useState('')
  // Remember where the user was when they opened the auth modal,
  // so we can return them there after login/register instead of always /dashboard.
  const [returnTo, setReturnTo] = useState<string | null>(null)
  // Incrementing key forces AuthModal to fully remount every time it opens,
  // preventing stale internal state (mode, form fields) from persisting.
  const [modalKey, setModalKey] = useState(0)
  // Reset-password flow state
  const resetTokenRef = useRef<string | null>(null)
  const passwordResetTokenRef = useRef<string | null>(null)
  const [resetPending, setResetPending] = useState<false | 'otp' | 'new-password'>(false)

  // ── Rehydrate store from API on mount if token exists ──────────────────────
  useEffect(() => {
    let cancelled = false

    if (!isLoggedIn()) {
      const t = setTimeout(() => setState(prev => ({ ...prev, isRehydrating: false })), 0)
      return () => clearTimeout(t)
    }

    async function rehydrate() {
      try {
        const { user: u, settings, dashboard } = await userApi.getProfile()
        if (cancelled) return

        if (u.role && typeof window !== 'undefined') {
          localStorage.setItem('mensflow_user_role', u.role)
        }
        setState(prev => ({
          ...prev,
          user: u,
          onboardingCompleted: u.isOnboarded,
        }))
        hydrate({ user: u, settings, dashboard })

        const store = useStore.getState()
        await Promise.all([
          store.fetchCustomSymptoms(),
          store.fetchLoginHistory(),
        ]).catch((err) => console.error('Failed to load user data', err))

        // Invalidate only the data queries that depend on the freshly-loaded profile
        void queryClient.invalidateQueries({ queryKey: userKeys.profile })
        void queryClient.invalidateQueries({ queryKey: chatKeys.sessions })
      } catch (err) {
        // Only log out on explicit 401 (token expired/invalid).
        // Network errors, timeouts, or server downtime should NOT
        // log the user out — the JWT in localStorage is still valid.
        if (err instanceof Error && 'status' in err && (err as { status: number }).status === 401) {
          clearToken()
          if (!cancelled) {
            setState(prev => ({ ...prev, isAuthenticated: false }))
          }
        } else {
          console.warn('[AuthProvider] Rehydration failed (network/server issue) — keeping session alive', err)
          // User stays authenticated with whatever stale data they had;
          // background sync interval will retry automatically.
        }
      } finally {
        if (!cancelled) {
          setState(prev => ({ ...prev, isRehydrating: false }))
        }
      }
    }

    void rehydrate()

    return () => {
      cancelled = true
    }
  }, [hydrate])

  // ── Auto-logout on token expiry (fired by apiClient on 401) ────────────────
  useEffect(() => {
    const handleAuthExpired = () => {
      console.warn('[AuthProvider] Session expired — logging out')
      clearToken()
      sessionStorage.removeItem('mf_onboarding')
      if (typeof window !== 'undefined') {
        localStorage.removeItem('mensflow_user_role')
      }
      setState(prev => ({ ...prev, isAuthenticated: false, user: null, onboardingCompleted: false }))
      resetStore()
      queryClient.clear()
      navigate('/')
    }
    window.addEventListener('mf:auth:expired', handleAuthExpired)
    return () => window.removeEventListener('mf:auth:expired', handleAuthExpired)
  }, [navigate, resetStore])

  // Background synchronization is now managed reactively by the useReactQuerySync hook.

  // ── Post-auth hydration helper ─────────────────────────────────────────────
  // ── Post-auth hydration helper ─────────────────────────────────────────────
  const completeAuthFlow = useCallback(async (token: string, u: ApiUser, settings?: ApiSettings, dashboard?: ApiDashboard) => {
    setToken(token)
    if (u.role && typeof window !== 'undefined') {
      localStorage.setItem('mensflow_user_role', u.role)
    }
    const localOnboarding = getLocalOnboarding()
    const isOnboarded = u.isOnboarded || localOnboarding
    setState(prev => ({ ...prev, user: u, onboardingCompleted: isOnboarded, isAuthenticated: true }))
    
    // Set the Zustand store user state immediately to avoid UI flickering/role lag
    useStore.setState({
      user: {
        id: u.id,
        email: u.email,
        name: u.name,
        avatar: u.avatar,
        accessLevel: u.accessLevel,
        isOnboarded: u.isOnboarded,
        role: u.role,
        onboardingData: u.onboardingData || {},
        partnerCode: u.partnerCode,
        partnerId: u.partnerId,
        xp: u.xp || 0,
        quizLastCompletedAt: u.quizLastCompletedAt || '',
        quizCountToday: u.quizCountToday || 0,
      }
    })
 
    if (settings && dashboard) {
      hydrate({
        user: u,
        settings,
        dashboard,
      })
    }

    setAuthModalOpen(false)
    setAuthModalLocked(false)
    setOtpPending(false)
    otpTokenRef.current = null
    setOtpEmail('')

    if (localOnboarding && !u.isOnboarded) {
      const storeUser = useStore.getState().user
      const patch: Partial<ApiUser> = { isOnboarded: true }
      if (storeUser.name) patch.name = storeUser.name
      if (storeUser.role) patch.role = storeUser.role
      if (storeUser.accessLevel) patch.accessLevel = storeUser.accessLevel
      if (storeUser.onboardingData && Object.keys(storeUser.onboardingData).length > 0) {
        patch.onboardingData = storeUser.onboardingData
      }
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

      const storeSettings = useStore.getState().settings
      await userApi.updateSettings({
        cycleAvgLengthDays: storeSettings.cycleAvgLengthDays,
      }).catch(err => console.error('Failed to sync guest settings', err))
    }

    // Only load profile from API if settings/dashboard were not already received in login response
    let userIsOnboarded = u.isOnboarded
    if (!settings || !dashboard) {
      const fetched = await userApi.getProfile()
      userIsOnboarded = fetched.user.isOnboarded
      setState(prev => ({ ...prev, onboardingCompleted: fetched.user.isOnboarded }))
      hydrate({ user: fetched.user, settings: fetched.settings, dashboard: fetched.dashboard })
    } else {
      setState(prev => ({ ...prev, onboardingCompleted: u.isOnboarded }))
    }

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
      store.fetchCustomSymptoms(),
      store.fetchLoginHistory(),
    ]).catch(err => console.error('Failed to load user data', err))

    // If user opened auth from a specific page (e.g. /sync), return there.
    // Otherwise default to the standard post-auth landing.
    const storeUser = useStore.getState().user
    if (userIsOnboarded) {
      const target = returnTo && returnTo !== '/' && returnTo !== '/onboarding' 
        ? returnTo 
        : (storeUser.accessLevel === 'educational' ? '/education' : '/dashboard')
      setReturnTo(null)
      navigate(target)
    } else {
      setReturnTo(null)
      navigate('/onboarding')
    }
  }, [navigate, hydrate, returnTo])

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (username: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true }))
    try {
      const result = await authApi.login(username, password)
      if (result.requiresOtp && result.otpToken) {
        // OTP required — store temp token and show OTP step
        otpTokenRef.current = result.otpToken
        setOtpEmail(username)
        setOtpPending(true)
        return
      }
      if (!result.token) throw new Error('No token received')
      await completeAuthFlow(result.token, result.user, result.settings, result.dashboard)
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
        otpTokenRef.current = result.otpToken
        setOtpEmail(email)       // show the real email in the OTP modal
        setOtpPending(true)
        return
      }
      if (!result.token) throw new Error('No token received')
      await completeAuthFlow(result.token, result.user, result.settings, result.dashboard)
    } catch (err) {
      setState(prev => ({ ...prev, isLoading: false }))
      throw err
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [completeAuthFlow])

  // ── Verify OTP ─────────────────────────────────────────────────────────────
  const verifyOtp = useCallback(async (code: string) => {
    if (!otpTokenRef.current) return
    setState(prev => ({ ...prev, isLoading: true }))
    try {
      const result = await authApi.verifyOtp(otpTokenRef.current, code)
      await completeAuthFlow(result.token!, result.user, result.settings, result.dashboard)
    } catch (err) {
      setState(prev => ({ ...prev, isLoading: false }))
      throw err
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [completeAuthFlow])

  // ── Resend OTP ─────────────────────────────────────────────────────────────
  const resendOtp = useCallback(async () => {
    if (!otpTokenRef.current) return
    const result = await authApi.resendOtp(otpTokenRef.current)
    otpTokenRef.current = result.otpToken
  }, [])

  // ── Reset Password ─────────────────────────────────────────────────────────
  const forgotPassword = useCallback(async (email: string) => {
    setState(prev => ({ ...prev, isLoading: true }))
    try {
      const result = await authApi.forgotPassword(email)
      // Store the resetToken (may be undefined if email not registered — that's fine)
      resetTokenRef.current = result.resetToken ?? null
      setResetPending('otp')
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [])

  const verifyResetOtp = useCallback(async (code: string) => {
    if (!resetTokenRef.current) return
    setState(prev => ({ ...prev, isLoading: true }))
    try {
      const result = await authApi.verifyResetOtp(resetTokenRef.current, code)
      passwordResetTokenRef.current = result.passwordResetToken
      resetTokenRef.current = null
      setResetPending('new-password')
    } catch (err) {
      setState(prev => ({ ...prev, isLoading: false }))
      throw err
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [])

  const resetPassword = useCallback(async (newPassword: string) => {
    if (!passwordResetTokenRef.current) return
    setState(prev => ({ ...prev, isLoading: true }))
    try {
      await authApi.resetPassword(passwordResetTokenRef.current, newPassword)
      passwordResetTokenRef.current = null
      setResetPending(false)
      // Close the modal and show the login step so the user can sign in
      setAuthModalOpen(false)
      setAuthModalLocked(false)
      setModalKey(k => k + 1)
    } catch (err) {
      setState(prev => ({ ...prev, isLoading: false }))
      throw err
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [])

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    clearToken()
    sessionStorage.removeItem('mf_onboarding')
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mensflow_user_role')
    }
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

  const openAuthModal = useCallback((initialMode: 'login' | 'register' = 'login', options?: { lockClose?: boolean }) => {
    const mode = initialMode === 'register' ? 'register' : 'login'
    setInitialAuthMode(mode)
    setAuthModalLocked(Boolean(options?.lockClose))
    // Remember where the user is so we can return them after auth
    setReturnTo(window.location.pathname)
    // Reset any stale OTP/reset state from a previous abandoned flow
    setOtpPending(false)
    otpTokenRef.current = null
    setOtpEmail('')
    setResetPending(false)
    resetTokenRef.current = null
    passwordResetTokenRef.current = null
    setModalKey(k => k + 1)
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
      forgotPassword,
      verifyResetOtp,
      resetPassword,
    }),
    [state.isAuthenticated, state.onboardingCompleted, state.isLoading, state.isRehydrating, state.user, login, register, logout, openAuthModal, completeOnboarding, forgotPassword, verifyResetOtp, resetPassword]
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthModal
        key={modalKey}
        open={authModalOpen}
        canClose={!authModalLocked}
        isLoading={state.isLoading}
        initialMode={initialAuthMode}
        preFillName={
          initialAuthMode === 'register'
            ? (
                useStore.getState().user.name ||
                String(useStore.getState().user.onboardingData?.name ?? '')
              )
            : ''
        }
        onClose={() => {
          if (authModalLocked) return
          setAuthModalOpen(false)
          setAuthModalLocked(false)
          setOtpPending(false)
          otpTokenRef.current = null
          setOtpEmail('')
          setResetPending(false)
          resetTokenRef.current = null
          passwordResetTokenRef.current = null
        }}
        onLogin={login}
        onRegister={register}
        onVerifyOtp={verifyOtp}
        onResendOtp={resendOtp}
        otpMode={otpPending}
        otpEmail={otpEmail}
        onForgotPassword={forgotPassword}
        onVerifyResetOtp={verifyResetOtp}
        onResetPassword={resetPassword}
        resetMode={resetPending}
      />
    </AuthContext.Provider>
  )
}
