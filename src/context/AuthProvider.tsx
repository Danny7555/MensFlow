import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setAuthenticated] = useState(false)

  const login = useCallback(() => setAuthenticated(true), [])
  const logout = useCallback(() => setAuthenticated(false), [])

  const value = useMemo(
    () => ({ isAuthenticated, login, logout }),
    [isAuthenticated, login, logout],
  )

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  )
}
