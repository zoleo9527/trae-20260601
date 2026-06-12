import api from './api'
import type { ApiResponse, LoginRequest, LoginResponse, SafeUser } from '@/types/types'

export const authService = {
  login: async (data: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    return api.post('/auth/login', data)
  },

  logout: async (): Promise<ApiResponse<void>> => {
    return api.post('/auth/logout')
  },

  getCurrentUser: async (): Promise<ApiResponse<SafeUser>> => {
    return api.get('/auth/me')
  },
}

export default authService