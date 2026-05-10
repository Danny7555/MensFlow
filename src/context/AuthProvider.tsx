import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setAuthenticated] = useState(() => {
    return localStorage.getItem('mf_auth') === 'true'
  })

  const login = useCallback(() => {
    setAuthenticated(true)
    localStorage.setItem('mf_auth', 'true')
  }, [])
  const logout = useCallback(() => {
    setAuthenticated(false)
    localStorage.removeItem('mf_auth')
  }, [])

  const value = useMemo(
    () => ({ isAuthenticated, login, logout }),
    [isAuthenticated, login, logout],
  )

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  )
}
