import type {
  Inventory,
  Customer,
  PriceAdjustment,
  PriceLock,
  CustomerQuote,
  ApiResponse,
} from '@/types'

const API_BASE = '/api'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  })
  const data = (await res.json()) as ApiResponse<T>
  if (!data.success) {
    throw new Error(data.error || 'Request failed')
  }
  return data.data as T
}

export const inventoryApi = {
  list: () => request<Inventory[]>('/inventory'),
  get: (id: string) => request<Inventory>(`/inventory/${id}`),
}

export const customerApi = {
  list: () => request<Customer[]>('/customers'),
}

export const adjustmentsApi = {
  list: (status?: string) =>
    request<PriceAdjustment[]>(`/adjustments${status ? `?status=${status}` : ''}`),
  pending: () => request<PriceAdjustment[]>('/adjustments/pending'),
  reviewed: () => request<PriceAdjustment[]>('/adjustments/reviewed'),
  get: (id: string) => request<PriceAdjustment>(`/adjustments/${id}`),
  create: (payload: {
    inventory_id: string
    original_price: number
    new_price: number
    adjustment_type: string
    reason?: string
    requested_lock_days?: number
    customer_id: string
    applicant_name: string
  }) =>
    request<PriceAdjustment>('/adjustments', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  review: (
    id: string,
    payload: {
      action: 'approve' | 'reject'
      opinion?: string
      lockDays?: number
      reviewerName?: string
    },
  ) =>
    request<PriceAdjustment>(`/adjustments/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
}

export const priceLocksApi = {
  list: () => request<PriceLock[]>('/price-locks'),
  expiring: () => request<PriceLock[]>('/price-locks/expiring'),
  expire: (id: string) =>
    request<{ id: string; status: string }>(`/price-locks/${id}`, {
      method: 'DELETE',
    }),
}

export const quotesApi = {
  list: (customerId?: string) =>
    request<CustomerQuote[]>(`/quotes${customerId ? `?customerId=${customerId}` : ''}`),
  get: (id: string) => request<CustomerQuote>(`/quotes/${id}`),
}
