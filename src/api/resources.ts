import api from './index'
import type {
  User, FruitBatch, GradingRecord, InventoryItem,
  InventoryChangeLog, Reservation, Complaint, PickingLoss,
  ProcessingLog, DashboardStats, PendingBatch,
} from '../types'

export const authApi = {
  login: (username: string) => api.post<User>('/auth/login', { username }),
  getDemoAccounts: () => api.get<User[]>('/auth/demo-accounts'),
}

export const batchApi = {
  list: (params?: { status?: string; guide_name?: string }) => api.get<FruitBatch[]>('/batches/', { params }),
  get: (id: number) => api.get<FruitBatch>(`/batches/${id}`),
  create: (data: { fruit_type: string; picking_date: string; picking_area: string; quantity_picked: number; unit: string; guide_name: string }) => api.post<FruitBatch>('/batches/', data),
  updateStatus: (id: number, data: { status: string; operator_name: string; notes?: string }) => api.put<FruitBatch>(`/batches/${id}/status`, data),
}

export const gradingApi = {
  list: (params?: { status?: string }) => api.get<GradingRecord[]>('/grading/', { params }),
  get: (id: number) => api.get<GradingRecord>(`/grading/${id}`),
  create: (data: { batch_id: number; grade_a_qty: number; grade_b_qty: number; grade_c_qty: number; grade_d_qty: number; grading_notes?: string }) => api.post<GradingRecord>('/grading/', data),
  confirm: (id: number, data: { operator_name: string; notes?: string }) => api.put<GradingRecord>(`/grading/${id}/confirm`, data),
  getPendingBatches: () => api.get<PendingBatch[]>('/grading/pending-batches'),
}

export const inventoryApi = {
  list: (params?: { fruit_type?: string; grade?: string }) => api.get<InventoryItem[]>('/inventory/', { params }),
  getChangelog: (params?: { fruit_type?: string; batch_no?: string; limit?: number }) => api.get<InventoryChangeLog[]>('/inventory/changelog', { params }),
  adjust: (id: number, data: { change_amount: number; reason: string; operator_name: string; operator_role: string }) =>
    api.post<InventoryItem>(`/inventory/${id}/adjust`, null, { params: data }),
  confirmWarehousing: (batchId: number, operatorName: string) => api.post<InventoryItem>(`/inventory/warehousing/${batchId}`, null, { params: { operator_name: operatorName } }),
}

export const reservationApi = {
  list: (params?: { status?: string }) => api.get<Reservation[]>('/reservations/', { params }),
  get: (id: number) => api.get<Reservation>(`/reservations/${id}`),
  create: (data: { visitor_name: string; visitor_phone: string; reserved_date: string; fruit_type: string; reserved_qty: number; notes?: string }) => api.post<Reservation>('/reservations/', data),
  confirm: (id: number, handlerName: string, actualQty?: number, notes?: string) => api.put<Reservation>(`/reservations/${id}/confirm`, null, { params: { handler_name: handlerName, actual_qty: actualQty, notes: notes || '' } }),
  complete: (id: number, handlerName: string, actualQty: number, notes?: string) => api.put<Reservation>(`/reservations/${id}/complete`, null, { params: { handler_name: handlerName, actual_qty: actualQty, notes: notes || '' } }),
  getAvailableInventory: (fruitType: string) => api.get(`/reservations/available-inventory/${fruitType}`),
}

export const complaintApi = {
  list: (params?: { status?: string }) => api.get<Complaint[]>('/complaints/', { params }),
  get: (id: number) => api.get<Complaint>(`/complaints/${id}`),
  create: (data: { visitor_name: string; visitor_phone: string; content: string; category?: string; related_reservation_id?: number }) => api.post<Complaint>('/complaints/', data),
  handle: (id: number, handlerName: string) => api.put<Complaint>(`/complaints/${id}/handle`, null, { params: { handler_name: handlerName } }),
  reply: (id: number, data: { reply_content: string; handler_name: string }) => api.put<Complaint>(`/complaints/${id}/reply`, data),
  getRelatedReservation: (id: number) => api.get(`/complaints/${id}/related-reservation`),
  getTimeoutWarnings: (hours?: number) => api.get('/complaints/timeout-warnings/list', { params: { hours: hours || 2 } }),
}

export const pickingLossApi = {
  list: (params?: { batch_id?: number }) => api.get<PickingLoss[]>('/picking-loss/', { params }),
  create: (data: { batch_id: number; expected_qty: number; actual_qty: number; loss_reason?: string }, reporterName?: string) =>
    api.post<PickingLoss>('/picking-loss/', data, { params: { reporter_name: reporterName } }),
}

export const logsApi = {
  list: (params?: { entity_type?: string; entity_id?: number; batch_id?: number; limit?: number }) => api.get<ProcessingLog[]>('/logs/', { params }),
  getByBatch: (batchId: number) => api.get<ProcessingLog[]>(`/logs/batch/${batchId}`),
}

export const systemApi = {
  getStats: () => api.get<DashboardStats>('/system/stats'),
  resetData: () => api.post('/system/reset'),
}
