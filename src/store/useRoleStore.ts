import { create } from 'zustand'
import type { Role, ToastMessage } from '@/types'

interface RoleState {
  currentRole: Role
  setRole: (role: Role) => void
  toasts: ToastMessage[]
  addToast: (type: ToastMessage['type'], message: string) => void
  removeToast: (id: string) => void
}

export const useRoleStore = create<RoleState>((set) => ({
  currentRole: 'nurse',
  setRole: (role) => set({ currentRole: role }),
  toasts: [],
  addToast: (type, message) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    set((state) => ({ toasts: [...state.toasts, { id, type, message, createdAt: Date.now() }] }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, 3500)
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))
