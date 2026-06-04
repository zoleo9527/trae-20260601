import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { Stethoscope, User, Lock, ArrowRight, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import type { UserRole } from '@/types'
import { ROLE_LABELS } from '@/types'

const DEMO_ACCOUNTS: { role: UserRole; username: string; label: string }[] = [
  { role: 'consultant', username: 'consultant', label: ROLE_LABELS.consultant },
  { role: 'assistant', username: 'assistant', label: ROLE_LABELS.assistant },
  { role: 'service', username: 'service', label: ROLE_LABELS.service },
]

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const login = useAuthStore((s) => s.login)
  const isLoading = useAuthStore((s) => s.isLoading)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await login(username, password)
      navigate('/')
    } catch (err: any) {
      setError(err.message || '登录失败')
    }
  }

  const handleQuickLogin = async (role: UserRole) => {
    setError('')
    try {
      const account = DEMO_ACCOUNTS.find((a) => a.role === role)!
      await login(account.username, 'demo123')
      navigate('/')
    } catch (err: any) {
      setError(err.message || '登录失败')
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #f0f9f6 0%, #fafaf8 50%, #f5f0eb 100%)' }}>
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, #2BA88C 0%, #1a7a63 50%, #0f4a3a 100%)' }} />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Stethoscope className="w-7 h-7" />
              </div>
              <span className="text-2xl font-bold tracking-wide">面诊助手</span>
            </div>
            <h1 className="text-4xl font-bold leading-tight mb-4">
              不用再翻群记录<br />异常提前看到
            </h1>
            <p className="text-lg text-white/80 leading-relaxed max-w-md">
              口径不一致、术后投诉、分期对不上——<br />
              碰到之前就标出来，不让问题占掉半天
            </p>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-lg bg-[#2BA88C] flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-[#1A1A1A]">面诊助手</span>
          </div>

          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">登录工作台</h2>
          <p className="text-[#6B7280] mb-8">输入账号密码或使用演示账号快速体验</p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 mb-8">
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">用户名</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  className="w-full pl-10 pr-4 py-2.5 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2BA88C]/30 focus:border-[#2BA88C] transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="w-full pl-10 pr-4 py-2.5 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2BA88C]/30 focus:border-[#2BA88C] transition-all"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-[#2BA88C] text-white rounded-lg font-medium text-sm hover:bg-[#249577] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isLoading ? '登录中...' : '登录'}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="border-t border-[#E5E7EB] pt-6">
            <p className="text-xs text-[#9CA3AF] mb-3">演示账号（密码均为 demo123）</p>
            <div className="grid grid-cols-3 gap-3">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.role}
                  onClick={() => handleQuickLogin(account.role)}
                  className="py-2.5 px-3 border border-[#E5E7EB] rounded-lg text-sm text-[#374151] hover:border-[#2BA88C] hover:text-[#2BA88C] hover:bg-[#2BA88C]/5 transition-all"
                >
                  {account.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
