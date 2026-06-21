import type { StateCreator } from 'zustand'
import type { AppState, PartnerSlice } from '../types'
import { isLoggedIn } from '../../lib/auth-token'
import { partnerApi } from '../../services/partnerService'
import { userKeys } from '../../services/userService'
import { queryClient } from '../../lib/queryClient'
import { toast } from 'sonner'

export const createPartnerSlice: StateCreator<AppState, [], [], PartnerSlice> = (set, get) => ({
  partnerStatus: null,
  completedActions: [],
  supportStreak: 0,
  lastActionDate: '',

  toggleSupportAction: async (actionId) => {
    if (isLoggedIn()) {
      const result = await partnerApi.toggleAction(actionId)
      set({
        completedActions: result.completedActions,
        supportStreak: result.supportStreak,
        lastActionDate: result.lastActionDate,
      })
      queryClient.invalidateQueries({ queryKey: ['partnerStatus'] })
      queryClient.invalidateQueries({ queryKey: ['monthInReview'] })
    } else {
      set((state) => {
        const completed = state.completedActions.includes(actionId)
          ? state.completedActions.filter(id => id !== actionId)
          : [...state.completedActions, actionId]
        return {
          completedActions: completed,
          lastActionDate: new Date().toISOString().split('T')[0],
        }
      })
    }
  },

  checkAndResetDailyActions: () => {
    const todayStr = new Date().toISOString().split('T')[0]
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    const state = get()
    if (state.lastActionDate && state.lastActionDate !== todayStr) {
      const patch: Partial<AppState> = { completedActions: [] }
      if (state.lastActionDate !== yesterdayStr) {
        patch.supportStreak = 0
      }
      set(patch)
    }
  },

  fetchPartnerStatus: async () => {
    try {
      const status = await partnerApi.getStatus()
      set({
        partnerStatus: status,
        completedActions: status.support?.completedActions ?? [],
        supportStreak: status.support?.supportStreak ?? 0,
        lastActionDate: status.support?.lastActionDate ?? '',
      })
    } catch (err) {
      console.error('Failed to fetch partner status:', err)
    }
  },

  pairPartner: async (partnerCode) => {
    set({ isSaving: true })
    try {
      const result = await partnerApi.pair(partnerCode)
      queryClient.invalidateQueries({ queryKey: userKeys.profile })
      queryClient.invalidateQueries({ queryKey: ['partnerStatus'] })
      toast.success(`Successfully paired with ${result.partner.name}!`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to pair with partner')
    } finally {
      set({ isSaving: false })
    }
  },

  invitePartner: async (email) => {
    set({ isSaving: true })
    try {
      const result = await partnerApi.invite(email) as { partnerFound: boolean; emailSent?: boolean; name?: string }
      if (result.partnerFound) {
        queryClient.invalidateQueries({ queryKey: userKeys.profile })
        queryClient.invalidateQueries({ queryKey: ['partnerStatus'] })
        toast.success(`Partner found! Successfully paired with ${result.name}!`)
      } else if (result.emailSent) {
        toast.success(`Invitation email sent to ${email}!`, {
          description: `Once they sign up, they can pair with you using your partner code: ${get().user?.partnerCode || ''}`,
        })
      } else {
        toast.error(`No MensFlow account found for "${email}". We've sent them an invite if it's an email address.`)
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send invitation')
    } finally {
      set({ isSaving: false })
    }
  },

  disconnectPartnerAction: async () => {
    set({ isSaving: true })
    try {
      await partnerApi.disconnect()
      queryClient.invalidateQueries({ queryKey: userKeys.profile })
      queryClient.invalidateQueries({ queryKey: ['partnerStatus'] })
      set({ partnerStatus: null })
      toast.success('Successfully disconnected from partner')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to disconnect from partner')
    } finally {
      set({ isSaving: false })
    }
  },

  requestDetailedAccessAction: async (requestedFields = ['symptoms', 'insights', 'tracker', 'calendar']) => {
    if (isLoggedIn()) {
      set({ isSaving: true })
      try {
        const result = await partnerApi.requestAccess(requestedFields)
        toast.success(result.alreadyPending ? 'Access request already pending.' : 'Access request sent!', {
          description: result.emailQueued
            ? 'Your partner received an in-app notification and an email.'
            : 'Your partner received an in-app notification to review your request.',
        })
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Failed to send access request')
      } finally {
        set({ isSaving: false })
      }
    } else {
      localStorage.setItem('mensflow_guest_pending_access_request', 'true')
      window.dispatchEvent(new Event('storage'))
      toast.success('Access request sent! Your partner will receive a notification to enable detailed sharing.')
    }
  },
})
