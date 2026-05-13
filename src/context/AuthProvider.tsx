import {
  useCallback,
  useMemo,
  useState,
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

  const login = useCallback(() => {
    setAuthenticated(true)
    localStorage.setItem('mf_auth', 'true')
    setAuthModalOpen(false)
  }, [])

  const logout = useCallback(() => {
    setAuthenticated(false)
    localStorage.removeItem('mf_auth')
  }, [])

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
      login,
      logout,
      openAuthModal,
      completeOnboarding,
    }),
    [isAuthenticated, onboardingCompleted, login, logout, openAuthModal, completeOnboarding],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onContinue={completeDemoSignIn}
      />
    </AuthContext.Provider>
  )
}
