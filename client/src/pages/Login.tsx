import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../api'

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authAPI.login(username, password)
      const { token, user } = res.data
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      navigate('/')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '登录失败，请检查用户名和密码'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#1a1a2e',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{
        background: '#16213e',
        borderRadius: 12,
        padding: '40px 36px',
        width: 380,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}>
        <h2 style={{
          color: '#e94560',
          textAlign: 'center',
          marginBottom: 32,
          fontSize: 24,
          fontWeight: 700,
        }}>网咖夜巡系统</h2>

        {error && (
          <div style={{
            background: 'rgba(233,69,96,0.15)',
            color: '#e94560',
            padding: '10px 14px',
            borderRadius: 6,
            marginBottom: 16,
            fontSize: 14,
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', color: '#a0aec0', marginBottom: 6, fontSize: 14 }}>
              用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: '#0f3460',
                border: '1px solid #1a3a6e',
                borderRadius: 6,
                color: '#e0e0e0',
                fontSize: 15,
                outline: 'none',
                boxSizing: 'border-box',
              }}
              required
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', color: '#a0aec0', marginBottom: 6, fontSize: 14 }}>
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: '#0f3460',
                border: '1px solid #1a3a6e',
                borderRadius: 6,
                color: '#e0e0e0',
                fontSize: 15,
                outline: 'none',
                boxSizing: 'border-box',
              }}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: '#e94560',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontSize: 16,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? '登录中...' : '登 录'}
          </button>
        </form>
      </div>
    </div>
  )
}
