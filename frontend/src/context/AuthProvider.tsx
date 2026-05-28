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
import { authApi, userApi, type ApiUser } from '../lib/api'
import { setToken, clearToken, isLoggedIn } from '../lib/auth-token'
import { useStore } from '../store/useStore'

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { hydrate, resetStore } = useStore()

  const [isAuthenticated, setAuthenticated] = useState(isLoggedIn)
  const [onboardingCompleted, setOnboardingCompleted] = useState(
    () => sessionStorage.getItem('mf_onboarding') === 'true'
  )
  const [user, setUser] = useState<ApiUser | null>(null)
  const [isLoading, setLoading] = useState(false)
  const [isRehydrating, setRehydrating] = useState(() => isLoggedIn())
  const [authModalOpen, setAuthModalOpen] = useState(false)

  // ── Rehydrate store from API on mount if token exists ──────────────────────
  useEffect(() => {
    if (!isLoggedIn()) {
      setRehydrating(false)
      return
    }

    userApi.getProfile()
      .then(({ user: u, settings, dashboard }) => {
        setUser(u)
        setOnboardingCompleted(u.isOnboarded)
        hydrate({ user: u, settings, dashboard })
        
        // Fetch logs, custom symptoms, and partner status from backend database
        const store = useStore.getState()
        store.fetchLogs().catch((err) => console.error('Failed to load logs', err))
        store.fetchCustomSymptoms().catch((err) => console.error('Failed to load custom symptoms', err))
        store.fetchPartnerStatus().catch((err) => console.error('Failed to load partner status', err))
      })
      .catch(() => {
        // Token expired or invalid — clear it
        clearToken()
        setAuthenticated(false)
      })
      .finally(() => {
        setRehydrating(false)
      })
  }, [hydrate])

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (username: string, password: string) => {
    setLoading(true)
    try {
      const { token, user: u } = await authApi.login(username, password)
      setToken(token)
      setUser(u)
      
      const localOnboarding = sessionStorage.getItem('mf_onboarding') === 'true'
      const isOnboarded = u.isOnboarded || localOnboarding
      setOnboardingCompleted(isOnboarded)
      setAuthenticated(true)
      setAuthModalOpen(false)

      if (localOnboarding && !u.isOnboarded) {
        const storeUser = useStore.getState().user
        const patch: any = { isOnboarded: true }
        if (storeUser.name) patch.name = storeUser.name
        if (storeUser.role) patch.role = storeUser.role
        if (storeUser.accessLevel) patch.accessLevel = storeUser.accessLevel
        await userApi.updateProfile(patch).catch((err) => {
          console.error('Failed to sync guest onboarding to backend during login', err)
        })
      }

      // Fetch full profile so the store is hydrated
      const profile = await userApi.getProfile()
      setOnboardingCompleted(profile.user.isOnboarded)
      hydrate({ user: profile.user, settings: profile.settings, dashboard: profile.dashboard })

      // Auto-pair if a partner code was entered during guest onboarding
      const localPartnerCode = sessionStorage.getItem('mf_partner_code')
      if (localPartnerCode) {
        const store = useStore.getState()
        await store.pairPartner(localPartnerCode).catch((err) => {
          console.error('Failed to auto-pair partner code during login setup', err)
        })
        sessionStorage.removeItem('mf_partner_code')
      }

      // Fetch logs, custom symptoms, and partner status from backend database
      const store = useStore.getState()
      await Promise.all([
        store.fetchLogs(),
        store.fetchCustomSymptoms(),
        store.fetchPartnerStatus()
      ]).catch((err) => console.error('Failed to load user logs/status', err))

      navigate(profile.user.isOnboarded ? '/dashboard' : '/onboarding')
    } finally {
      setLoading(false)
    }
  }, [navigate, hydrate])

  // ── Register ───────────────────────────────────────────────────────────────
  const register = useCallback(async (username: string, password: string, name: string) => {
    setLoading(true)
    try {
      const { token, user: u } = await authApi.register(username, password, name)
      setToken(token)
      setUser(u)
      
      const localOnboarding = sessionStorage.getItem('mf_onboarding') === 'true'
      const isOnboarded = u.isOnboarded || localOnboarding
      setOnboardingCompleted(isOnboarded)
      setAuthenticated(true)
      setAuthModalOpen(false)

      if (localOnboarding && !u.isOnboarded) {
        const storeUser = useStore.getState().user
        const patch: any = { isOnboarded: true }
        if (storeUser.name) patch.name = storeUser.name
        if (storeUser.role) patch.role = storeUser.role
        if (storeUser.accessLevel) patch.accessLevel = storeUser.accessLevel
        await userApi.updateProfile(patch).catch((err) => {
          console.error('Failed to sync guest onboarding to backend during registration', err)
        })
      }

      const profile = await userApi.getProfile()
      setOnboardingCompleted(profile.user.isOnboarded)
      hydrate({ user: profile.user, settings: profile.settings, dashboard: profile.dashboard })

      // Auto-pair if a partner code was entered during guest onboarding
      const localPartnerCode = sessionStorage.getItem('mf_partner_code')
      if (localPartnerCode) {
        const store = useStore.getState()
        await store.pairPartner(localPartnerCode).catch((err) => {
          console.error('Failed to auto-pair partner code during registration setup', err)
        })
        sessionStorage.removeItem('mf_partner_code')
      }

      // Fetch logs, custom symptoms, and partner status from backend database
      const store = useStore.getState()
      await Promise.all([
        store.fetchLogs(),
        store.fetchCustomSymptoms(),
        store.fetchPartnerStatus()
      ]).catch((err) => console.error('Failed to load user logs/status', err))

      navigate(profile.user.isOnboarded ? '/dashboard' : '/onboarding')
    } finally {
      setLoading(false)
    }
  }, [navigate, hydrate])

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    clearToken()
    setOnboardingCompleted(false)
    sessionStorage.removeItem('mf_onboarding')
    setAuthenticated(false)
    setUser(null)
    resetStore()
    navigate('/')
  }, [navigate, resetStore])

  // ── Onboarding ─────────────────────────────────────────────────────────────
  const completeOnboarding = useCallback(() => {
    setOnboardingCompleted(true)
    sessionStorage.setItem('mf_onboarding', 'true')
    if (isLoggedIn()) {
      userApi.updateProfile({ isOnboarded: true }).catch((err) => {
        console.error('Failed to update onboarding state in backend', err)
      })
    }
  }, [])

  const openAuthModal = useCallback(() => setAuthModalOpen(true), [])

  const value = useMemo(
    () => ({
      isAuthenticated,
      onboardingCompleted,
      isLoading,
      isRehydrating,
      user,
      login,
      register,
      logout,
      openAuthModal,
      completeOnboarding,
    }),
    [isAuthenticated, onboardingCompleted, isLoading, isRehydrating, user, login, register, logout, openAuthModal, completeOnboarding]
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthModal
        open={authModalOpen}
        isLoading={isLoading}
        onClose={() => setAuthModalOpen(false)}
        onLogin={login}
        onRegister={register}
      />
    </AuthContext.Provider>
  )
}
