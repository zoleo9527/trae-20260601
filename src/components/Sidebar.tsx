import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, FileText, CheckSquare, RotateCcw } from 'lucide-react'
import { useMallStore } from '../store'

const NAV_ITEMS = [
  { path: '/', label: '总览', icon: LayoutDashboard },
  { path: '/applications', label: '活动申请', icon: FileText },
  { path: '/approvals', label: '场地审批', icon: CheckSquare },
]

export default function Sidebar() {
  const location = useLocation()
  const resetApplications = useMallStore((s) => s.resetApplications)

  const handleReset = async () => {
    if (window.confirm('确认重置所有数据？此操作不可恢复。')) {
      await resetApplications()
    }
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-56 bg-slate-900 text-white flex flex-col z-50">
      <div className="px-5 py-6 border-b border-slate-700">
        <h1 className="text-lg font-bold tracking-wide" style={{ fontFamily: '"Noto Serif SC", serif' }}>
          商场运营
        </h1>
        <p className="text-xs text-slate-400 mt-1">活动申请与场地审批</p>
      </div>

      <nav className="flex-1 py-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path))
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
                isActive
                  ? 'bg-amber-500/10 text-amber-400 border-r-2 border-amber-400'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-slate-700">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors w-full"
        >
          <RotateCcw size={14} />
          <span>重置演示数据</span>
        </button>
      </div>
    </aside>
  )
}
