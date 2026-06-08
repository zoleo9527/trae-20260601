import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/lib/api'
import { Wrench, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.post<{ token: string; user: { id: number; username: string; name: string; role: 'supervisor' | 'cleaner' | 'engineer' } }>(
        '/auth/login',
        { username, password }
      )
      login(data.token, data.user as any)
      navigate('/')
    } catch (err: any) {
      setError(err.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0d0f14] flex items-center justify-center">
      <div className="w-full max-w-[380px]">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#e8723a] flex items-center justify-center mx-auto mb-4">
            <Wrench size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-[#e4e6eb]">客房工程管理系统</h1>
          <p className="text-[13px] text-[#6b7084] mt-1">工程报修 · 房态恢复 · 责任追溯</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#151822] rounded-lg border border-[#1e2230] p-6">
          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-[13px]">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-[12px] text-[#8b8fa3] mb-1.5">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 bg-[#0d0f14] border border-[#2a2f42] rounded-md text-[13px] text-[#e4e6eb] placeholder-[#4a4e5e] focus:outline-none focus:border-[#e8723a]/50 focus:ring-1 focus:ring-[#e8723a]/20"
              placeholder="请输入用户名"
            />
          </div>

          <div className="mb-5">
            <label className="block text-[12px] text-[#8b8fa3] mb-1.5">密码</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 pr-9 bg-[#0d0f14] border border-[#2a2f42] rounded-md text-[13px] text-[#e4e6eb] placeholder-[#4a4e5e] focus:outline-none focus:border-[#e8723a]/50 focus:ring-1 focus:ring-[#e8723a]/20"
                placeholder="请输入密码"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6b7084] hover:text-[#8b8fa3]"
              >
                {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full py-2 rounded-md text-[13px] font-medium bg-[#e8723a] text-white hover:bg-[#d4662f] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '登录中...' : '登录'}
          </button>

          <div className="mt-5 pt-4 border-t border-[#1e2230]">
            <div className="text-[11px] text-[#4a4e5e] mb-2">测试账号（密码均为 123456）</div>
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <div className="bg-[#0d0f14] rounded px-2 py-1.5 text-center">
                <div className="text-orange-400 font-medium">zhangwg</div>
                <div className="text-[#6b7084]">主管</div>
              </div>
              <div className="bg-[#0d0f14] rounded px-2 py-1.5 text-center">
                <div className="text-emerald-400 font-medium">libaoj</div>
                <div className="text-[#6b7084]">保洁</div>
              </div>
              <div className="bg-[#0d0f14] rounded px-2 py-1.5 text-center">
                <div className="text-blue-400 font-medium">wanggc</div>
                <div className="text-[#6b7084]">工程</div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
