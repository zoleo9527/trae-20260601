import request from '@/utils/request'

export function getDrinkList() {
  return request.get('/drink/list')
}

export function getAvailableDrinks() {
  return request.get('/drink/available')
}

export function getDrink(id) {
  return request.get(`/drink/${id}`)
}

export function createDrink(data) {
  return request.post('/drink', data)
}

export function updateDrink(data) {
  return request.put('/drink', data)
}
