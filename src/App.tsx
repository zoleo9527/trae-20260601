import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Admin from '@/pages/Admin'
import { useStore } from '@/store/useStore'
import { LayoutDashboard, Settings } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

function Layout({ children }: { children: React.ReactNode }) {
  const { currentRole } = useStore()
  const location = useLocation()

  if (!currentRole) return <Navigate to="/" replace />

  return (
    <div className="min-h-screen bg-slate-950">
      {children}
      {location.pathname === '/dashboard' && (
        <Link
          to="/admin"
          className="fixed bottom-6 right-6 w-10 h-10 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl flex items-center justify-center text-slate-400 hover:text-amber-400 transition-colors z-40"
          title="数据管理"
        >
          <Settings className="w-5 h-5" />
        </Link>
      )}
      {location.pathname === '/admin' && (
        <Link
          to="/dashboard"
          className="fixed bottom-6 right-6 w-10 h-10 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl flex items-center justify-center text-slate-400 hover:text-sky-400 transition-colors z-40"
          title="返回工作台"
        >
          <LayoutDashboard className="w-5 h-5" />
        </Link>
      )}
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
        <Route path="/admin" element={<Layout><Admin /></Layout>} />
      </Routes>
    </Router>
  )
}
