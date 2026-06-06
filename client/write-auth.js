const fs = require('fs');
const content = `import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export const useAuth = () => {
  try {
    const context = useContext(AuthContext)
    if (!context) {
      console.warn('useAuth 必须在 AuthProvider 内使用')
      return { user: null, login: async () => ({ success: false }), logout: () => {}, loading: false, switchRole: () => {} }
    }
    return context
  } catch (e) {
    console.error('useAuth 错误:', e)
    return { user: null, login: async () => ({ success: false }), logout: () => {}, loading: false, switchRole: () => {} }
  }
}

const safeGetUser = () => {
  try {
    if (typeof localStorage === 'undefined') return null
    const saved = localStorage.getItem('user')
    if (!saved) return null
    const parsed = JSON.parse(saved)
    if (parsed && typeof parsed === 'object' && parsed.role) {
      return parsed
    }
    localStorage.removeItem('user')
    return null
  } catch (e) {
    console.error('解析用户数据失败:', e)
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('user')
      }
    } catch (e2) {}
    return null
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const savedUser = safeGetUser()
      if (savedUser) {
        setUser(savedUser)
      }
    } catch (e) {
      console.error('初始化用户数据失败:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  const login = async (username, password) => {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      if (data.success) {
        setUser(data.user)
        try {
          localStorage.setItem('user', JSON.stringify(data.user))
        } catch (e) {
          console.error('保存用户数据失败:', e)
        }
        return { success: true }
      }
      return { success: false, message: data.message || '登录失败' }
    } catch (e) {
      return { success: false, message: '网络错误' }
    }
  }

  const logout = () => {
    try {
      setUser(null)
      localStorage.removeItem('user')
    } catch (e) {
      console.error('退出登录失败:', e)
    }
  }

  const switchRole = (roleUser) => {
    try {
      setUser(roleUser)
      localStorage.setItem('user', JSON.stringify(roleUser))
    } catch (e) {
      console.error('切换角色失败:', e)
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, switchRole }}>
      {children}
    </AuthContext.Provider>
  )
}
`;
fs.writeFileSync('src/context/AuthContext.jsx', content, 'utf8');
console.log('AuthContext.jsx 写入成功');
