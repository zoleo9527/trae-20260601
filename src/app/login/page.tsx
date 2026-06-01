'use client'

import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import { Role } from '@prisma/client'
import { User, Shield, ShoppingCart, ClipboardCheck, Factory } from 'lucide-react'

const roleOptions = [
  { email: 'purchaser@example.com', name: '张采购', role: Role.PURCHASER, icon: ShoppingCart, description: '采购部门' },
  { email: 'engineer@example.com', name: '李工', role: Role.PROCESS_ENGINEER, icon: Shield, description: '工艺工程师' },
  { email: 'quality@example.com', name: '王质检', role: Role.QUALITY_INSPECTOR, icon: ClipboardCheck, description: '质量检验' },
  { email: 'supplier@example.com', name: '陈经理', role: Role.SUPPLIER, icon: Factory, description: '供应商' },
]

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const router = useRouter()

  const handleLogin = async (email: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        const user = await response.json()
        login(user)
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Login failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">外协加工管理系统</h1>
          <p className="text-gray-600">图纸版本 · 外协订单 · 来料检验 · 异常处置</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <User size={24} className="text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">选择身份登录</h2>
              <p className="text-sm text-gray-500">演示系统 - 点击下方角色快速登录</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {roleOptions.map((option) => {
              const Icon = option.icon
              return (
                <button
                  key={option.email}
                  onClick={() => handleLogin(option.email)}
                  disabled={loading}
                  className={`p-5 rounded-xl border-2 text-left transition-all ${
                    selectedRole === option.email
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      selectedRole === option.email ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{option.name}</p>
                      <p className="text-xs text-gray-500">{option.description}</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          演示账号：选择任意角色即可体验系统功能
        </p>
      </div>
    </div>
  )
}
