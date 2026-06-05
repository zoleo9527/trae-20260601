import { useAuthStore } from '@/stores/auth'
import { Beer, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const demoAccounts = [
  {
    username: 'sales',
    label: '销售内勤',
    role: 'SALES',
    description: '创建订单、确认签收',
    color: 'amber',
  },
  {
    username: 'brewer',
    label: '酿酒师',
    role: 'BREWER',
    description: '确认订单、安排生产',
    color: 'blue',
  },
  {
    username: 'packer',
    label: '包装主管',
    role: 'PACKER',
    description: '完成包装、安排发货',
    color: 'teal',
  },
  {
    username: 'admin',
    label: '管理员',
    role: 'ADMIN',
    description: '处理异常、全局管理',
    color: 'purple',
  },
]

const roleColorClasses: Record<string, string> = {
  amber: 'hover:bg-amber-600/20 hover:border-amber-500/50 group-hover:text-amber-400',
  blue: 'hover:bg-blue-600/20 hover:border-blue-500/50 group-hover:text-blue-400',
  teal: 'hover:bg-teal-600/20 hover:border-teal-500/50 group-hover:text-teal-400',
  purple: 'hover:bg-purple-600/20 hover:border-purple-500/50 group-hover:text-purple-400',
}

export default function Login() {
  const navigate = useNavigate()
  const { login, isLoading } = useAuthStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleDemoLogin = async (demoUsername: string) => {
    setError(null)
    try {
      await login(demoUsername, 'demo123')
      navigate('/')
    } catch {
      setError('登录失败，请重试')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await login(username, password)
      navigate('/')
    } catch {
      setError('用户名或密码错误')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-900 via-amber-950 to-stone-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-600 rounded-2xl mb-4 shadow-lg shadow-amber-600/30">
            <Beer className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">精酿酒厂</h1>
          <p className="text-stone-400">经销订单系统</p>
        </div>

        <div className="bg-stone-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-stone-700/50 p-8">
          <h2 className="text-xl font-semibold text-white mb-6">快速登录</h2>

          <div className="space-y-3 mb-6">
            <p className="text-sm text-stone-400">选择角色快速登录体验（密码均为 demo123）</p>
            <div className="grid grid-cols-2 gap-3">
              {demoAccounts.map((account) => (
                <button
                  key={account.username}
                  onClick={() => handleDemoLogin(account.username)}
                  disabled={isLoading}
                  className={`flex flex-col items-start p-4 bg-stone-700/50 border border-stone-600/50 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group ${roleColorClasses[account.color]}`}
                >
                  <span className="text-white font-medium mb-1 group-hover:text-white transition-colors">
                    {account.label}
                  </span>
                  <span className="text-xs text-stone-400 mb-2 group-hover:text-stone-300 transition-colors">
                    {account.description}
                  </span>
                  <span className="text-xs text-stone-500 font-mono">
                    {account.username}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-600/50"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-stone-800 text-sm text-stone-400">或使用账号密码登录</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1.5">
                用户名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-2.5 bg-stone-700/50 border border-stone-600/50 rounded-lg text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all disabled:opacity-50"
                placeholder="请输入用户名"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1.5">
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-2.5 bg-stone-700/50 border border-stone-600/50 rounded-lg text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all disabled:opacity-50"
                placeholder="请输入密码"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !username || !password}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  登录中...
                </>
              ) : (
                '登录'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
