import type { StateCreator } from 'zustand'
import type { AppState, UserSlice, AppUser } from '../types'
import { isLoggedIn } from '../../lib/auth-token'
import { userApi } from '../../services/userService'
import { toast } from 'sonner'

function getDefaultUser(): AppUser {
  return {
    id: undefined,
    email: null,
    name: '',
    avatar: null,
    accessLevel: 'full',
    isOnboarded: false,
    role: (typeof window !== 'undefined'
      ? (localStorage.getItem('mensflow_user_role') as 'lady' | 'partner' | null)
      : null) || 'lady',
    onboardingData: {},
    partnerCode: '',
    partnerId: null,
    xp: 0,
    quizLastCompletedAt: '',
    quizCountToday: 0,
  }
}

export { getDefaultUser }

export const createUserSlice: StateCreator<AppState, [], [], UserSlice> = (set) => ({
  user: getDefaultUser(),

  updateUser: async (patch) => {
    set({ isSaving: true })
    try {
      if (isLoggedIn()) {
        const { user: updated } = await userApi.updateProfile(patch)
        set((state) => ({
          user: {
            ...state.user,
            email: updated.email,
            name: updated.name,
            avatar: updated.avatar,
            accessLevel: updated.accessLevel,
            isOnboarded: updated.isOnboarded,
            role: updated.role,
            onboardingData: updated.onboardingData || {},
            partnerCode: updated.partnerCode,
            partnerId: updated.partnerId,
            xp: updated.xp || 0,
            quizLastCompletedAt: updated.quizLastCompletedAt || '',
            quizCountToday: updated.quizCountToday || 0,
          },
        }))
        if (updated.role && typeof window !== 'undefined') {
          localStorage.setItem('mensflow_user_role', updated.role)
        }
      } else {
        set((state) => {
          const nextUser = { ...state.user, ...patch }
          if (patch.role && typeof window !== 'undefined') {
            localStorage.setItem('mensflow_user_role', patch.role)
          }
          return { user: nextUser }
        })
      }
    } finally {
      set({ isSaving: false })
    }
  },

  submitQuizAttemptAction: async (date, correct) => {
    set({ isSaving: true })
    try {
      if (isLoggedIn()) {
        const result = await userApi.submitQuizAttempt(date, correct)
        set((state) => ({
          user: {
            ...state.user,
            xp: result.user.xp,
            quizLastCompletedAt: result.user.quizLastCompletedAt,
            quizCountToday: result.user.quizCountToday,
          },
        }))
      } else {
        set((state) => {
          let count = state.user.quizCountToday || 0
          if (state.user.quizLastCompletedAt !== date) count = 0
          if (count >= 2) return state
          const xpToAdd = correct ? 50 : 0
          return {
            user: {
              ...state.user,
              xp: (state.user.xp || 0) + xpToAdd,
              quizLastCompletedAt: date,
              quizCountToday: count + 1,
            },
          }
        })
      }
    } catch (err: unknown) {
      console.error('Failed to submit quiz attempt:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to submit quiz attempt')
    } finally {
      set({ isSaving: false })
    }
  },
})
