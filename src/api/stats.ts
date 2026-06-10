import request from './index'

export function getStats() {
  return request.get('/stats')
}
