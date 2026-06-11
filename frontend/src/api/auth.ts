import api from './index'

export const login = (username: string, password: string) => {
  const formData = new FormData()
  formData.append('username', username)
  formData.append('password', password)
  return api.post('/auth/login', formData)
}

export const getMe = () => api.get('/auth/me')
