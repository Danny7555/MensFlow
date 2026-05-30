import { createContext } from 'react'
import type { ApiUser } from '../services/userService'

export type AuthContextValue = {
  isAuthenticated: boolean
  onboardingCompleted: boolean
  isLoading: boolean
  isRehydrating: boolean
  user: ApiUser | null
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string, name: string) => Promise<void>
  logout: () => void
  openAuthModal: () => void
  completeOnboarding: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
