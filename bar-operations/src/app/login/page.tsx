'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Wine, User, Lock, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || '登录失败')
      }

      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0D1117] via-[#0A1628] to-[#1A1F2E] p-4">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00D9FF]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#F5A623]/5 rounded-full blur-3xl"></div>
      </div>

      {/* 登录卡片 */}
      <div className="relative w-full max-w-md">
        <div className="absolute inset-0 bg-gradient-to-r from-[#00D9FF] to-[#F5A623] rounded-2xl blur opacity-20"></div>

        <div className="relative bg-[#1A1F2E] rounded-2xl border border-[#2D3748] p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#00D9FF] to-[#F5A623] rounded-xl flex items-center justify-center mb-4 shadow-lg glow-cyan">
              <Wine className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">酒吧运营系统</h1>
            <p className="text-sm text-[#A0AEC0] mt-1">酒水寄存与取用核销管理</p>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 rounded-lg bg-[#FF6B6B]/20 border border-[#FF6B6B] text-[#FF6B6B] text-sm">
                {error}
              </div>
            )}

            {/* 用户名 */}
            <div>
              <label className="block text-sm font-medium text-[#A0AEC0] mb-2">
                工号 / 用户名
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A0AEC0]" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#0D1117] border border-[#2D3748] rounded-lg text-white placeholder-[#A0AEC0] focus:outline-none focus:border-[#00D9FF] focus:ring-1 focus:ring-[#00D9FF] transition-all"
                  placeholder="请输入工号"
                  required
                />
              </div>
            </div>

            {/* 密码 */}
            <div>
              <label className="block text-sm font-medium text-[#A0AEC0] mb-2">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A0AEC0]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-[#0D1117] border border-[#2D3748] rounded-lg text-white placeholder-[#A0AEC0] focus:outline-none focus:border-[#00D9FF] focus:ring-1 focus:ring-[#00D9FF] transition-all"
                  placeholder="请输入密码"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0AEC0] hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#00D9FF] to-[#00B8D9] text-white font-medium rounded-lg hover:from-[#00B8D9] hover:to-[#0099CC] transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-[#00D9FF]/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '登录中...' : '登 录'}
            </button>
          </form>

          {/* 提示信息 */}
          <div className="mt-6 p-4 bg-[#0D1117] rounded-lg border border-[#2D3748]">
            <p className="text-xs text-[#A0AEC0] mb-2">测试账号：</p>
            <div className="space-y-1 text-xs text-[#A0AEC0] font-mono">
              <p>管理员：admin / admin123</p>
              <p>吧台：bar / bar123</p>
              <p>客服：service / service123</p>
              <p>经理：manager / manager123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
