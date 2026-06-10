import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, User } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-park-bg">
      <div className="w-full max-w-md">
        <div className="bg-park-card rounded-lg border border-park-border p-8">
          <h1 className="text-2xl font-semibold text-center text-park-text mb-2">智慧停车场投诉申诉系统</h1>
          <p className="text-sm text-park-muted text-center mb-8">三种角色均可使用同一密码登录</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-park-muted" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="用户名"
                  className="w-full bg-park-bg border border-park-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-park-text placeholder-park-muted outline-none focus:border-park-amber transition-colors"
                />
              </div>
            </div>
            <div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-park-muted" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="密码"
                  className="w-full bg-park-bg border border-park-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-park-text placeholder-park-muted outline-none focus:border-park-amber transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-sm text-center">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors"
            >
              {loading ? '登录中...' : '登 录'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-park-border">
            <p className="text-xs text-park-muted mb-3">演示账号：</p>
            <div className="space-y-2 text-xs text-park-muted">
              <div className="flex justify-between">
                <span>运营专员</span>
                <span className="text-park-text">cs001 / 123456</span>
              </div>
              <div className="flex justify-between">
                <span>客服</span>
                <span className="text-park-text">cs002 / 123456</span>
              </div>
              <div className="flex justify-between">
                <span>设备维护员</span>
                <span className="text-park-text">cs003 / 123456</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
