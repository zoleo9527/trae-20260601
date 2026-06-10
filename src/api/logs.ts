import request from './index'

export function getLogs(params?: Record<string, any>) {
  return request.get('/logs', { params })
}
