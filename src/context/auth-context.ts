import { createContext } from 'react'

export type AuthContextValue = {
  isAuthenticated: boolean
  onboardingCompleted: boolean
  login: () => void
  logout: () => void
  openAuthModal: () => void
  completeOnboarding: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
