import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import {
  LayoutDashboard,
  ClipboardPlus,
  Search,
  Map,
  FileCheck,
  Truck,
  AlertTriangle,
  ScrollText,
  LogOut,
  Anchor,
} from 'lucide-react'

const NAV_ITEMS: Record<string, { label: string; icon: React.ReactNode; path: string }[]> = {
  gate: [
    { label: '工作台', icon: <LayoutDashboard size={18} />, path: '/gate' },
    { label: '进场登记', icon: <ClipboardPlus size={18} />, path: '/gate/register' },
    { label: '集装箱查询', icon: <Search size={18} />, path: '/gate/containers' },
    { label: '操作日志', icon: <ScrollText size={18} />, path: '/gate/logs' },
  ],
  dispatch: [
    { label: '工作台', icon: <LayoutDashboard size={18} />, path: '/dispatch' },
    { label: '堆位图', icon: <Map size={18} />, path: '/dispatch/yard' },
    { label: '海关查验', icon: <FileCheck size={18} />, path: '/dispatch/inspection' },
    { label: '移箱任务', icon: <Truck size={18} />, path: '/dispatch/move-tasks' },
    { label: '操作日志', icon: <ScrollText size={18} />, path: '/dispatch/logs' },
  ],
  service: [
    { label: '工作台', icon: <LayoutDashboard size={18} />, path: '/service' },
    { label: '问题单中心', icon: <AlertTriangle size={18} />, path: '/service/problems' },
    { label: '操作日志', icon: <ScrollText size={18} />, path: '/service/logs' },
  ],
}

const ROLE_LABELS: Record<string, string> = {
  gate: '闸口员',
  dispatch: '堆场调度',
  service: '客户服务',
}

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const role = user?.role || 'gate'
  const items = NAV_ITEMS[role] || []

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen">
      <aside className="w-56 bg-portNavy text-white flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Anchor size={22} className="text-portOrange" />
            <span className="font-bold text-lg">港口堆场</span>
          </div>
          <div className="text-xs text-white/60 mt-1">{ROLE_LABELS[role]}</div>
        </div>

        <nav className="flex-1 py-3">
          {items.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors relative ${
                  isActive
                    ? 'bg-portBlue/20 text-white'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-portOrange rounded-r" />
                )}
                {item.icon}
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="border-t border-white/10 px-5 py-3">
          <div className="text-xs text-white/50 mb-1">{user?.name || ''}</div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
          >
            <LogOut size={16} />
            退出
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-portBg">
        <Outlet />
      </main>
    </div>
  )
}
