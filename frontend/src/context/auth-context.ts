import { createContext } from 'react'
import type { ApiUser } from '../services/userService'

export type AuthContextValue = {
  isAuthenticated: boolean
  onboardingCompleted: boolean
  isLoading: boolean
  isRehydrating: boolean
  user: ApiUser | null
  login: (username: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string, name: string, role?: 'lady' | 'partner') => Promise<void>
  logout: () => void
  openAuthModal: (initialMode?: 'login' | 'register') => void
  completeOnboarding: () => void
  forgotPassword: (email: string) => Promise<void>
  verifyResetOtp: (code: string) => Promise<void>
  resetPassword: (newPassword: string) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

