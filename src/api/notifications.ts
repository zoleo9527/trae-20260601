import request from './index'

export function getNotifications(params?: Record<string, any>) {
  return request.get('/notifications', { params })
}

export function getUnreadCount() {
  return request.get('/notifications/unread-count')
}

export function markAsRead(id: number) {
  return request.patch(`/notifications/${id}/read`)
}

export function markAllRead() {
  return request.post('/notifications/mark-all-read')
}
