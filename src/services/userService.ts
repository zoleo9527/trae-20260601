import api from './api'
import type {
  ApiResponse,
  SafeUser,
  PaginatedResponse,
  CreateUserRequest,
  UpdateUserRequest,
  PaginationParams,
} from '@/types/types'

export const userService = {
  getUsers: async (params: PaginationParams): Promise<ApiResponse<PaginatedResponse<SafeUser>>> => {
    return api.get('/users', { params })
  },

  getUser: async (id: string): Promise<ApiResponse<SafeUser>> => {
    return api.get(`/users/${id}`)
  },

  createUser: async (data: CreateUserRequest): Promise<ApiResponse<SafeUser>> => {
    return api.post('/users', data)
  },

  updateUser: async (id: string, data: UpdateUserRequest): Promise<ApiResponse<SafeUser>> => {
    return api.put(`/users/${id}`, data)
  },

  deleteUser: async (id: string): Promise<ApiResponse<void>> => {
    return api.delete(`/users/${id}`)
  },

  getAllUsers: async (): Promise<ApiResponse<PaginatedResponse<SafeUser>>> => {
    return api.get('/users', { params: { page: 1, pageSize: 1000 } })
  },

  getHandoverableUsers: async (role: 'accountant' | 'manager'): Promise<ApiResponse<SafeUser[]>> => {
    return api.get('/users/handoverable', { params: { role } })
  },
}

export default userService