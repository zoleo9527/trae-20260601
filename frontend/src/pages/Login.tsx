import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { authApi } from '@/services/api'
import { AlertCircle, Baby } from 'lucide-react'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await authApi.login(username, password)
      if (response.success && response.data) {
        login(response.data.user, response.data.token)
        navigate('/')
      } else {
        setError(response.error?.message || '登录失败')
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || '网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  const demoAccounts = [
    { username: 'clerk001', password: '123456', role: '店员' },
    { username: 'manager001', password: '123456', role: '店长' },
    { username: 'buyer001', password: '123456', role: '采购' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
              <Baby size={32} className="text-white" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
            母婴零售店促销券系统
          </h1>
          <p className="text-center text-gray-500 mb-8">
            请登录您的账号
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700 text-sm">
              <AlertCircle size={18} className="mr-2 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                用户名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="请输入用户名"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="请输入密码"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center mb-4">测试账号</p>
            <div className="space-y-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.username}
                  onClick={() => {
                    setUsername(account.username)
                    setPassword(account.password)
                  }}
                  className="w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-sm font-medium text-gray-800">
                        {account.username}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        (密码: {account.password})
                      </span>
                    </div>
                    <span className="text-xs bg-primary-100 text-primary px-2 py-1 rounded">
                      {account.role}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
