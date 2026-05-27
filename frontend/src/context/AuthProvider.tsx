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
  const [authModalOpen, setAuthModalOpen] = useState(false)

  // ── Rehydrate store from API on mount if token exists ──────────────────────
  useEffect(() => {
    if (!isLoggedIn()) return

    userApi.getProfile()
      .then(({ user: u, settings, dashboard }) => {
        setUser(u)
        setOnboardingCompleted(u.isOnboarded)
        hydrate({ user: u, settings, dashboard })
        
        // Fetch logs and custom symptoms from backend database
        const store = useStore.getState()
        store.fetchLogs().catch((err) => console.error('Failed to load logs', err))
        store.fetchCustomSymptoms().catch((err) => console.error('Failed to load custom symptoms', err))
      })
      .catch(() => {
        // Token expired or invalid — clear it
        clearToken()
        setAuthenticated(false)
      })
  }, [hydrate])

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (username: string, password: string) => {
    setLoading(true)
    try {
      const { token, user: u } = await authApi.login(username, password)
      setToken(token)
      setUser(u)
      setOnboardingCompleted(u.isOnboarded)
      setAuthenticated(true)
      setAuthModalOpen(false)

      // Fetch full profile so the store is hydrated
      const profile = await userApi.getProfile()
      hydrate({ user: u, settings: profile.settings, dashboard: profile.dashboard })

      // Fetch logs and custom symptoms from backend database
      const store = useStore.getState()
      await Promise.all([
        store.fetchLogs(),
        store.fetchCustomSymptoms()
      ]).catch((err) => console.error('Failed to load user logs', err))

      navigate('/dashboard')
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
      setOnboardingCompleted(u.isOnboarded)
      setAuthenticated(true)
      setAuthModalOpen(false)

      const profile = await userApi.getProfile()
      hydrate({ user: u, settings: profile.settings, dashboard: profile.dashboard })

      // Fetch logs and custom symptoms from backend database
      const store = useStore.getState()
      await Promise.all([
        store.fetchLogs(),
        store.fetchCustomSymptoms()
      ]).catch((err) => console.error('Failed to load user logs', err))

      navigate('/onboarding')
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
      user,
      login,
      register,
      logout,
      openAuthModal,
      completeOnboarding,
    }),
    [isAuthenticated, onboardingCompleted, isLoading, user, login, register, logout, openAuthModal, completeOnboarding]
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
