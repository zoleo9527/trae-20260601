import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import type { User } from '@/stores/authStore'
import Layout from '@/components/Layout'
import VisitList from '@/pages/VisitList'
import VisitNew from '@/pages/VisitNew'
import VisitDetail from '@/pages/VisitDetail'
import Dashboard from '@/pages/Dashboard'
import HandoverList from '@/pages/HandoverList'
import HandoverNew from '@/pages/HandoverNew'
import HandoverDetail from '@/pages/HandoverDetail'
import RecallList from '@/pages/RecallList'
import RecallNew from '@/pages/RecallNew'
import RecallDetail from '@/pages/RecallDetail'
import RescueList from '@/pages/RescueList'
import RescueDetail from '@/pages/RescueDetail'

function LoginPage() {
  const user = useAuthStore((s) => s.user)
  const login = useAuthStore((s) => s.login)
  const [name, setName] = useState('')
  const [role, setRole] = useState<User['role']>('volunteer')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/dashboard" replace />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await login(name, role)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-2">🐾 救助站管理系统</h1>
        <p className="text-gray-500 text-center mb-8">请登录以继续</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              placeholder="请输入用户名"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as User['role'])}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            >
              <option value="volunteer">志愿者</option>
              <option value="vet">兽医</option>
              <option value="adoption_officer">领养专员</option>
              <option value="admin">管理员</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/rescues" element={<RescueList />} />
          <Route path="/rescues/:id" element={<RescueDetail />} />
          <Route path="/visits" element={<VisitList />} />
          <Route path="/visits/new" element={<VisitNew />} />
          <Route path="/visits/:id" element={<VisitDetail />} />
          <Route path="/recalls" element={<RecallList />} />
          <Route path="/recalls/new" element={<RecallNew />} />
          <Route path="/recalls/:id" element={<RecallDetail />} />
          <Route path="/handovers" element={<HandoverList />} />
          <Route path="/handovers/new" element={<HandoverNew />} />
          <Route path="/handovers/:id" element={<HandoverDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
