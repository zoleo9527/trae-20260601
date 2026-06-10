import request from './index'

export function getArrivals(params?: Record<string, any>) {
  return request.get('/arrivals', { params })
}

export function getArrival(id: number) {
  return request.get(`/arrivals/${id}`)
}

export function createArrival(data: Record<string, any>) {
  return request.post('/arrivals', data)
}

export function confirmArrival(id: number, data: Record<string, any>) {
  return request.patch(`/arrivals/${id}/confirm`, data)
}
