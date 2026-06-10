import request from './request'

export function getUsers(params) {
  return request.get('/users', { params })
}

export function getRoles() {
  return request.get('/users/roles')
}

export function getUserById(id) {
  return request.get(`/users/${id}`)
}
