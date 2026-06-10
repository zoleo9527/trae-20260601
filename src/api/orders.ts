import request from './index'

export function getOrders(params?: Record<string, any>) {
  return request.get('/orders', { params })
}

export function getOrder(id: number) {
  return request.get(`/orders/${id}`)
}

export function createOrder(data: Record<string, any>) {
  return request.post('/orders', data)
}

export function updateOrder(id: number, data: Record<string, any>) {
  return request.put(`/orders/${id}`, data)
}

export function updateOrderStatus(id: number, status: string) {
  return request.patch(`/orders/${id}/status`, { status })
}
