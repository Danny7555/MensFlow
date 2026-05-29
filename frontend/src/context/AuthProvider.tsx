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

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (username: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true }))
    try {
      const { token, user: u } = await authApi.login(username, password)
      setToken(token)
      
      const localOnboarding = getLocalOnboarding()
      const isOnboarded = u.isOnboarded || localOnboarding
      
      setState(prev => ({
        ...prev,
        user: u,
        onboardingCompleted: isOnboarded,
        isAuthenticated: true,
      }))
      setAuthModalOpen(false)

      if (localOnboarding && !u.isOnboarded) {
        const storeUser = useStore.getState().user
        const patch: Partial<ApiUser> = { isOnboarded: true }
        if (storeUser.name) patch.name = storeUser.name
        if (storeUser.role) patch.role = storeUser.role
        if (storeUser.accessLevel) patch.accessLevel = storeUser.accessLevel
        await userApi.updateProfile(patch).catch((err) => {
          console.error('Failed to sync guest onboarding to backend during login', err)
        })

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
        }).catch((err) => {
          console.error('Failed to sync guest onboarding dashboard to backend during login', err)
        })
      }

      // Fetch full profile so the store is hydrated
      const profile = await userApi.getProfile()
      
      setState(prev => ({
        ...prev,
        onboardingCompleted: profile.user.isOnboarded,
      }))
      hydrate({ user: profile.user, settings: profile.settings, dashboard: profile.dashboard })

      // Auto-pair if a partner code was entered during guest onboarding
      const localPartnerCode = getLocalPartnerCode()
      if (localPartnerCode) {
        const store = useStore.getState()
        await store.pairPartner(localPartnerCode).catch((err) => {
          console.error('Failed to auto-pair partner code during login setup', err)
        })
        sessionStorage.removeItem('mf_partner_code')
      }

      // Invalidate only the affected data queries (targeted, not a full cache wipe)
      void queryClient.invalidateQueries({ queryKey: userKeys.profile })
      void queryClient.invalidateQueries({ queryKey: chatKeys.sessions })

      // Fetch logs, custom symptoms, and partner status from backend database
      const store = useStore.getState()
      await Promise.all([
        store.fetchLogs(),
        store.fetchCustomSymptoms(),
        store.fetchPartnerStatus()
      ]).catch((err) => console.error('Failed to load user logs/status', err))

      navigate(profile.user.isOnboarded ? '/dashboard' : '/onboarding')
    } catch (err) {
      setState(prev => ({ ...prev, isLoading: false }))
      throw err
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [navigate, hydrate])

  // ── Register ───────────────────────────────────────────────────────────────
  const register = useCallback(async (username: string, password: string, name: string) => {
    setState(prev => ({ ...prev, isLoading: true }))
    try {
      const { token, user: u } = await authApi.register(username, password, name)
      setToken(token)
      
      const localOnboarding = getLocalOnboarding()
      const isOnboarded = u.isOnboarded || localOnboarding
      
      setState(prev => ({
        ...prev,
        user: u,
        onboardingCompleted: isOnboarded,
        isAuthenticated: true,
      }))
      setAuthModalOpen(false)

      if (localOnboarding && !u.isOnboarded) {
        const storeUser = useStore.getState().user
        const patch: Partial<ApiUser> = { isOnboarded: true }
        if (storeUser.name) patch.name = storeUser.name
        if (storeUser.role) patch.role = storeUser.role
        if (storeUser.accessLevel) patch.accessLevel = storeUser.accessLevel
        await userApi.updateProfile(patch).catch((err) => {
          console.error('Failed to sync guest onboarding to backend during registration', err)
        })

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
        }).catch((err) => {
          console.error('Failed to sync guest onboarding dashboard to backend during registration', err)
        })
      }

      const profile = await userApi.getProfile()
      
      setState(prev => ({
        ...prev,
        onboardingCompleted: profile.user.isOnboarded,
      }))
      hydrate({ user: profile.user, settings: profile.settings, dashboard: profile.dashboard })

      // Auto-pair if a partner code was entered during guest onboarding
      const localPartnerCode = getLocalPartnerCode()
      if (localPartnerCode) {
        const store = useStore.getState()
        await store.pairPartner(localPartnerCode).catch((err) => {
          console.error('Failed to auto-pair partner code during registration setup', err)
        })
        sessionStorage.removeItem('mf_partner_code')
      }

      // Invalidate only the affected data queries (targeted, not a full cache wipe)
      void queryClient.invalidateQueries({ queryKey: userKeys.profile })
      void queryClient.invalidateQueries({ queryKey: chatKeys.sessions })

      // Fetch logs, custom symptoms, and partner status from backend database
      const store = useStore.getState()
      await Promise.all([
        store.fetchLogs(),
        store.fetchCustomSymptoms(),
        store.fetchPartnerStatus()
      ]).catch((err) => console.error('Failed to load user logs/status', err))

      navigate(profile.user.isOnboarded ? '/dashboard' : '/onboarding')
    } catch (err) {
      setState(prev => ({ ...prev, isLoading: false }))
      throw err
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [navigate, hydrate])

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

  const openAuthModal = useCallback(() => setAuthModalOpen(true), [])

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
        onClose={() => setAuthModalOpen(false)}
        onLogin={login}
        onRegister={register}
      />
    </AuthContext.Provider>
  )
}
