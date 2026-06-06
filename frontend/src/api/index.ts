import request from '@/utils/request'
import type { Key, Student, BorrowRecord, LostRecord, OperationLog, DashboardStats, RiskItem } from '@/types'

export const getKeys = (params?: { building?: string; room?: string; status?: string }) => {
  return request.get<Key[]>('/keys', { params })
}

export const getKey = (id: number) => {
  return request.get<Key>(`/keys/${id}`)
}

export const getStudents = (params?: { building?: string; room?: string }) => {
  return request.get<Student[]>('/students', { params })
}

export const borrowKey = (data: { key_id: number; student_id: string; operator: string; remark?: string }) => {
  return request.post<BorrowRecord>('/borrow', data)
}

export const returnKey = (data: { key_id: number; operator: string; remark?: string }) => {
  return request.post<BorrowRecord>('/return', data)
}

export const reportLost = (data: { key_id: number; student_name: string; lost_reason: string; replace_fee?: number; operator: string }) => {
  return request.post<LostRecord>('/lost', data)
}

export const replaceKey = (data: { lost_record_id: number; new_key_number: string; building: string; room: string; key_type?: string; operator: string; replace_fee?: number }) => {
  return request.post<Key>('/replace', data)
}

export const getDashboardStats = () => {
  return request.get<DashboardStats>('/dashboard/stats')
}

export const getRiskItems = () => {
  return request.get<RiskItem[]>('/dashboard/risks')
}

export const getOperationLogs = (params?: { action?: string; operator?: string; key_id?: number; limit?: number }) => {
  return request.get<OperationLog[]>('/records', { params })
}

export const resetSystem = () => {
  return request.post('/system/reset')
}
