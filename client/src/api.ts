import axios from 'axios'
import type { LostItem, Staff, TodoItem, Role } from './types'

const api = axios.create({ baseURL: '/api' })

export async function login(staffId: string, password: string): Promise<Staff> {
  const { data } = await api.post('/staff/login', { id: staffId, password })
  return data
}

export async function fetchStaff(): Promise<Staff[]> {
  const { data } = await api.get('/staff')
  return data
}

export async function fetchItems(params: { role?: Role; status?: string; staff_id?: string }): Promise<LostItem[]> {
  const { data } = await api.get('/items', { params })
  return data
}

export async function fetchItem(id: string): Promise<LostItem> {
  const { data } = await api.get(`/items/${id}`)
  return data
}

export async function fetchTodos(params: { role: Role; staff_id?: string }): Promise<TodoItem[]> {
  const { data } = await api.get('/items/todos', { params })
  return data
}

export async function createItem(payload: Partial<LostItem>): Promise<LostItem> {
  const { data } = await api.post('/items', payload)
  return data
}

export async function claimItem(id: string, payload: {
  claimant_name: string
  claimant_id_type: string
  claimant_id_number: string
  contact_phone?: string
  verified_by?: string
  supplementary_notes?: string
}): Promise<LostItem> {
  const { data } = await api.patch(`/items/${id}/claim`, payload)
  return data
}

export async function handleItem(id: string, payload: {
  return_reason?: string
  supplementary_notes?: string
  handled_by?: string
  new_status?: string
}): Promise<LostItem> {
  const { data } = await api.patch(`/items/${id}/handle`, payload)
  return data
}

export async function markException(id: string, payload: {
  exception_type: string
  exception_note?: string
}): Promise<LostItem> {
  const { data } = await api.patch(`/items/${id}/exception`, payload)
  return data
}

export async function deleteItem(id: string): Promise<void> {
  await api.delete(`/items/${id}`)
}

export async function resetData(): Promise<void> {
  await api.post('/reset')
}
