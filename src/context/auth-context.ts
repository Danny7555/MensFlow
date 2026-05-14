import { createContext } from 'react'

export type AuthContextValue = {
  isAuthenticated: boolean
  onboardingCompleted: boolean
  isLoading: boolean
  login: () => void
  logout: () => void
  openAuthModal: () => void
<<<<<<< HEAD
  completeOnboarding: () => void
=======
>>>>>>> 7b2a41f (feat: implement comprehensive cycle tracking dashboard with new navigation, visualizations, and symptom logging components)
}

export const AuthContext = createContext<AuthContextValue | null>(null)
