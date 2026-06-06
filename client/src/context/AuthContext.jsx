import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('user')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && typeof parsed === 'object') {
          setUser(parsed)
        } else {
          localStorage.removeItem('user')
        }
      }
    } catch (e) {
      console.error('解析用户数据失败:', e)
      localStorage.removeItem('user')
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
        localStorage.setItem('user', JSON.stringify(data.user))
        return { success: true }
      }
      return { success: false, message: data.message }
    } catch (e) {
      return { success: false, message: '网络错误' }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  const switchRole = (roleUser) => {
    setUser(roleUser)
    localStorage.setItem('user', JSON.stringify(roleUser))
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, switchRole }}>
      {children}
    </AuthContext.Provider>
  )
}
