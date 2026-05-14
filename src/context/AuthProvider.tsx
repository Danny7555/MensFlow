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
<<<<<<< HEAD
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
=======
  const [isAuthenticated, setAuthenticated] = useState(() => {
    return localStorage.getItem('mf_auth') === 'true'
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
>>>>>>> 7b2a41f (feat: implement comprehensive cycle tracking dashboard with new navigation, visualizations, and symptom logging components)
  }, [])

  const openAuthModal = useCallback(() => {
    setAuthModalOpen(true)
  }, [])

  const completeDemoSignIn = useCallback((method: AuthMethod) => {
    void method
    login()
<<<<<<< HEAD
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
=======
  }, [login])

  const value = useMemo(
    () => ({ isAuthenticated, login, logout, openAuthModal }),
    [isAuthenticated, login, logout, openAuthModal],
>>>>>>> 7b2a41f (feat: implement comprehensive cycle tracking dashboard with new navigation, visualizations, and symptom logging components)
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthModal
        open={authModalOpen}
<<<<<<< HEAD
        isLoading={isPending}
=======
>>>>>>> 7b2a41f (feat: implement comprehensive cycle tracking dashboard with new navigation, visualizations, and symptom logging components)
        onClose={() => setAuthModalOpen(false)}
        onContinue={completeDemoSignIn}
      />
    </AuthContext.Provider>
  )
}
