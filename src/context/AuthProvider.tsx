import {
  useCallback,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from './auth-context'
import { AuthModal, type AuthMethod } from '../components/AuthModal'

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [isAuthenticated, setAuthenticated] = useState(() => {
    return localStorage.getItem('mf_auth') === 'true'
  })
  const [onboardingCompleted, setOnboardingCompleted] = useState(() => {
    return localStorage.getItem('mf_onboarding') === 'true'
  })
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const login = useCallback(async () => {
    startTransition(async () => {

      await new Promise(resolve => setTimeout(resolve, 1200))
      setAuthenticated(true)
      localStorage.setItem('mf_auth', 'true')
      setAuthModalOpen(false)
    })
  }, [])

  const logout = useCallback(() => {
    startTransition(async () => {
      await new Promise(resolve => setTimeout(resolve, 800))
      setAuthenticated(false)
      localStorage.removeItem('mf_auth')
    })
  }, [startTransition])

  const completeOnboarding = useCallback(() => {
    setOnboardingCompleted(true)
    localStorage.setItem('mf_onboarding', 'true')
  }, [])

  const openAuthModal = useCallback(() => {
    setAuthModalOpen(true)
  }, [])

  const completeDemoSignIn = useCallback((method: AuthMethod) => {
    void method
    login()
    navigate('/dashboard')
  }, [login, navigate])

  const value = useMemo(
    () => ({
      isAuthenticated,
      onboardingCompleted,
      isLoading: isPending,
      login,
      logout,
      openAuthModal,
      completeOnboarding,
    }),
    [isAuthenticated, onboardingCompleted, isPending, login, logout, openAuthModal, completeOnboarding],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthModal
        open={authModalOpen}
        isLoading={isPending}
        onClose={() => setAuthModalOpen(false)}
        onContinue={completeDemoSignIn}
      />
    </AuthContext.Provider>
  )
}
