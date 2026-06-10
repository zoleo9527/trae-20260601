import { ref } from 'vue'

const unreadCount = ref(0)

export function useUnreadCount() {
  async function refreshUnread() {
    try {
      const { default: request } = await import('@/api/index')
      const res = await request.get('/notifications/unread-count')
      unreadCount.value = res.data.count
    } catch {}
  }

  return { unreadCount, refreshUnread }
}
