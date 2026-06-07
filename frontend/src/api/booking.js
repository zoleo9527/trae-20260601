import request from '@/utils/request'

export function getBookingPage(params) {
  return request.get('/booking/page', { params })
}

export function getBooking(id) {
  return request.get(`/booking/${id}`)
}

export function getBookingByNo(bookingNo) {
  return request.get(`/booking/no/${bookingNo}`)
}

export function createBooking(data) {
  return request.post('/booking', data)
}

export function updateBooking(data) {
  return request.put('/booking', data)
}
