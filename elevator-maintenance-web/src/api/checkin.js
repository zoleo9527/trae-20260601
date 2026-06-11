import request from '@/utils/request'

export const getCheckInRecords = (params) => {
  return request({
    url: '/check-in',
    method: 'get',
    params
  })
}

export const getCheckInById = (id) => {
  return request({
    url: `/check-in/${id}`,
    method: 'get'
  })
}

export const getActiveCheckIn = (planId) => {
  return request({
    url: `/check-in/current/${planId}`,
    method: 'get'
  })
}

export const checkIn = (data) => {
  return request({
    url: '/check-in',
    method: 'post',
    data
  })
}

export const checkOut = (data) => {
  return request({
    url: '/check-in/check-out',
    method: 'post',
    data
  })
}
