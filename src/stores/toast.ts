import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ToastMessage } from '@/types'

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<ToastMessage[]>([])

  function addToast(payload: Omit<ToastMessage, 'id'>) {
    const toast: ToastMessage = {
      id: `toast-${Date.now()}`,
      ...payload,
    }
    toasts.value.unshift(toast)
    if (payload.duration !== 0) {
      setTimeout(() => {
        removeToast(toast.id)
      }, payload.duration || 4000)
    }
  }

  function removeToast(id: string) {
    const idx = toasts.value.findIndex((t) => t.id === id)
    if (idx > -1) toasts.value.splice(idx, 1)
  }

  return {
    toasts,
    addToast,
    removeToast,
  }
})
