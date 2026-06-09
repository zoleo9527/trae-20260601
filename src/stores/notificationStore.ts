import { create } from 'zustand'

export interface Notification {
  id: number
  user_id: number
  title: string
  content: string
  read: boolean
  created_at: string
  [key: string]: unknown
}

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  fetchNotifications: (userId: number) => Promise<void>
  markRead: (id: number) => Promise<void>
  markAllRead: (userId: number) => Promise<void>
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  fetchNotifications: async (userId) => {
    const res = await fetch(`/api/notifications?user_id=${userId}`)
    if (!res.ok) throw new Error('获取通知失败')
    const data = await res.json()
    const notifications: Notification[] = data.data ?? data
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    })
  },

  markRead: async (id) => {
    const res = await fetch(`/api/notifications/${id}/read`, {
      method: 'PUT',
    })
    if (!res.ok) throw new Error('标记已读失败')
    const { notifications } = get()
    set({
      notifications: notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: notifications.filter((n) => (n.id === id ? true : !n.read)).length,
    })
  },

  markAllRead: async (userId) => {
    const res = await fetch(`/api/notifications/read-all?user_id=${userId}`, {
      method: 'PUT',
    })
    if (!res.ok) throw new Error('全部标记已读失败')
    const { notifications } = get()
    set({
      notifications: notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })
  },
}))
