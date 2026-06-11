import request from '@/utils/request'

export const getElevators = (params) => {
  return request({
    url: '/elevators',
    method: 'get',
    params
  })
}

export const getElevatorById = (id) => {
  return request({
    url: `/elevators/${id}`,
    method: 'get'
  })
}
