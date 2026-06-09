import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Package, Truck, Building2 } from 'lucide-react'

const roles = [
  { label: '客服', username: 'kefu01', icon: Package, color: 'bg-orange-500 hover:bg-orange-600' },
  { label: '派件员', username: 'paijian01', icon: Truck, color: 'bg-blue-500 hover:bg-blue-600' },
  { label: '驿站负责人', username: 'yizhan01', icon: Building2, color: 'bg-purple-500 hover:bg-purple-600' },
]

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码')
      return
    }
    setLoading(true)
    setError('')
    try {
      await login(username.trim(), password.trim())
      navigate('/')
    } catch (e: any) {
      setError(e.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickSelect = (uname: string) => {
    setUsername(uname)
    setPassword('123456')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-500 mb-4">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">退回处理与责任复盘</h1>
          <p className="text-slate-400 text-sm mt-2">快递网点管理系统</p>
        </div>

        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="mb-6">
            <p className="text-sm font-medium text-slate-700 mb-3">快速选择角色</p>
            <div className="grid grid-cols-3 gap-3">
              {roles.map((role) => (
                <button
                  key={role.label}
                  onClick={() => handleQuickSelect(role.username)}
                  className={`flex flex-col items-center gap-2 py-3 rounded-lg text-white text-sm font-medium transition-colors ${role.color}`}
                >
                  <role.icon className="w-6 h-6" />
                  {role.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">用户名</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">密码</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder:text-slate-400"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '登录中...' : '登 录'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
