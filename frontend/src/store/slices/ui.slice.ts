import type { StateCreator } from 'zustand'
import type { AppState, UISlice } from '../types'

export const createUISlice: StateCreator<AppState, [], [], UISlice> = (set) => ({
  isSaving: false,

  notificationCount: 0,
  incrementNotificationCount: () => set((state) => ({ notificationCount: state.notificationCount + 1 })),
  resetNotificationCount: () => set({ notificationCount: 0 }),

  confirmDialog: {
    isOpen: false,
    title: '',
    description: '',
    onConfirm: null,
    onCancel: null,
  },
  showConfirm: (options) => {
    set({
      confirmDialog: {
        isOpen: true,
        title: options.title,
        description: options.description,
        onConfirm: options.onConfirm,
        onCancel: options.onCancel || null,
      },
    })
  },
  closeConfirm: () => {
    set((state) => ({
      confirmDialog: {
        ...state.confirmDialog,
        isOpen: false,
      },
    }))
  },

  alertDialog: {
    isOpen: false,
    title: '',
    description: '',
  },
  showAlert: (options) => {
    set({
      alertDialog: {
        isOpen: true,
        title: options.title,
        description: options.description,
      },
    })
  },
  closeAlert: () => {
    set((state) => ({
      alertDialog: {
        ...state.alertDialog,
        isOpen: false,
      },
    }))
  },
})
