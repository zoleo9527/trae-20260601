import type { OrderFilter, HandoffAction, HandoffDetails, Order } from '@/types'

const BASE = '/api'

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

export async function fetchOrders(filters: OrderFilter): Promise<Order[]> {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.stage) params.set('stage', filters.stage)
  if (filters.anomalyType) params.set('anomalyType', filters.anomalyType)
  if (filters.customerName) params.set('customerName', filters.customerName)
  if (filters.handlerRole) params.set('handlerRole', filters.handlerRole)
  const qs = params.toString()
  const res = await fetch(`${BASE}/orders${qs ? `?${qs}` : ''}`)
  if (!res.ok) throw new Error(`fetchOrders failed: ${res.status}`)
  const json: ApiResponse<Order[]> = await res.json()
  return json.data
}

export async function fetchOrderDetail(id: string): Promise<Order> {
  const res = await fetch(`${BASE}/orders/${id}`)
  if (!res.ok) throw new Error(`fetchOrderDetail failed: ${res.status}`)
  const json: ApiResponse<Order> = await res.json()
  return json.data
}

export async function submitHandoff(
  orderId: string,
  data: { fromRole: string; toRole: string; action: HandoffAction; reason: string; details?: Partial<HandoffDetails> }
): Promise<void> {
  const res = await fetch(`${BASE}/orders/${orderId}/handoffs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error(json.error || `submitHandoff failed: ${res.status}`)
  }
}

export async function fetchProductionBoard(): Promise<{ date: string; count: number; orders: Order[] }[]> {
  const res = await fetch(`${BASE}/production/board`)
  if (!res.ok) throw new Error(`fetchProductionBoard failed: ${res.status}`)
  const json: ApiResponse<{ date: string; count: number; orders: Order[] }[]> = await res.json()
  return json.data
}

export async function updateSchedule(
  orderId: string,
  data: { deliveryDate?: string; productionLine?: string }
): Promise<void> {
  const res = await fetch(`${BASE}/production/schedule`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, ...data }),
  })
  if (!res.ok) throw new Error(`updateSchedule failed: ${res.status}`)
}
