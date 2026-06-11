import request from '@/utils/request'

export const getUsers = (params) => {
  return request({
    url: '/users',
    method: 'get',
    params
  })
}

export const getUsersByRole = (role) => {
  return request({
    url: `/users/role/${role}`,
    method: 'get'
  })
}

export const getUserById = (id) => {
  return request({
    url: `/users/${id}`,
    method: 'get'
  })
}
