import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { AuthContext } from './auth-context'
import { AuthModal, type AuthMethod } from '../components/AuthModal'

export function AuthProvider({ children }: { children: ReactNode }) {
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
  }, [])

  const openAuthModal = useCallback(() => {
    setAuthModalOpen(true)
  }, [])

  const completeDemoSignIn = useCallback((method: AuthMethod) => {
    void method
    login()
  }, [login])

  const value = useMemo(
    () => ({ isAuthenticated, login, logout, openAuthModal }),
    [isAuthenticated, login, logout, openAuthModal],
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
