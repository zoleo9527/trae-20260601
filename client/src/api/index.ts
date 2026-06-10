import request from './request'
import type { User, Fruit, Reception, GuideTask, WarehouseTransfer, Attachment, AuditLog, PageResult, Notification } from '@/types'

export const userApi = {
  getCurrent: () => request.get<any, User>('/users/current'),
  getList: (role?: string) => request.get<any, User[]>('/users', { params: { role } }),
  getGuides: () => request.get<any, User[]>('/users/guides')
}

export const fruitApi = {
  getList: () => request.get<any, Fruit[]>('/fruits'),
  getAll: () => request.get<any, Fruit[]>('/fruits/all')
}

export const receptionApi = {
  getList: (params?: any) => request.get<any, PageResult<Reception>>('/receptions', { params }),
  getDetail: (id: number) => request.get<any, Reception>(`/receptions/${id}`),
  create: (data: any) => request.post<any, Reception>('/receptions', data),
  update: (id: number, data: any) => request.put<any, Reception>(`/receptions/${id}`, data),
  assignGuide: (id: number, data: any) => request.post<any, GuideTask>(`/receptions/${id}/assign-guide`, data),
  batchStatus: (data: any) => request.post<any, any>('/receptions/batch-status', data),
  remove: (id: number) => request.delete<any, any>(`/receptions/${id}`),
  export: (params?: any) => request.get<any, any>('/receptions/export', { params, responseType: 'blob' })
}

export const guideTaskApi = {
  getList: (params?: any) => request.get<any, PageResult<GuideTask>>('/guide-tasks', { params }),
  getDetail: (id: number) => request.get<any, GuideTask>(`/guide-tasks/${id}`),
  start: (id: number) => request.post<any, GuideTask>(`/guide-tasks/${id}/start`),
  complete: (id: number, data: any) => request.post<any, GuideTask>(`/guide-tasks/${id}/complete`, data),
  batchComplete: (data: any) => request.post<any, any>('/guide-tasks/batch-complete', data)
}

export const warehouseTransferApi = {
  getList: (params?: any) => request.get<any, PageResult<WarehouseTransfer>>('/warehouse-transfers', { params }),
  getDetail: (id: number) => request.get<any, WarehouseTransfer>(`/warehouse-transfers/${id}`),
  receive: (id: number, data?: any) => request.post<any, WarehouseTransfer>(`/warehouse-transfers/${id}/receive`, data),
  store: (id: number, data?: any) => request.post<any, WarehouseTransfer>(`/warehouse-transfers/${id}/store`, data),
  batchReceive: (data: any) => request.post<any, any>('/warehouse-transfers/batch-receive', data)
}

export const attachmentApi = {
  getList: (bizType: string, bizId: number) => request.get<any, Attachment[]>('/attachments', { params: { biz_type: bizType, biz_id: bizId } }),
  upload: (formData: FormData) => request.post<any, Attachment>('/attachments/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  placeholder: (data: any) => request.post<any, Attachment>('/attachments/placeholder', data),
  remove: (id: number) => request.delete<any, any>(`/attachments/${id}`)
}

export const auditLogApi = {
  getList: (params?: any) => request.get<any, PageResult<AuditLog>>('/audit-logs', { params })
}

export const notificationApi = {
  getList: (params?: any) => request.get<any, PageResult<Notification>>('/notifications', { params }),
  getUnreadCount: () => request.get<any, { count: number }>('/notifications/unread-count'),
  markRead: (id: number) => request.post<any, any>(`/notifications/${id}/read`),
  markAllRead: () => request.post<any, any>('/notifications/read-all')
}
