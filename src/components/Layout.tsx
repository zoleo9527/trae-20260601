import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { FileCheck, ShoppingCart, LayoutDashboard, LogOut, Home } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore, roleConfig } from '@/store'
import RoleSwitcher from '@/components/RoleSwitcher'
import { useEffect } from 'react'

interface NavItem {
  path: string
  label: string
  icon: React.ReactNode
  sublabel?: string
}

const navIconMap: Record<string, React.ReactNode> = {
  home: <Home className="h-5 w-5" />,
  dashboard: <LayoutDashboard className="h-5 w-5" />,
  qualifications: <FileCheck className="h-5 w-5" />,
  purchases: <ShoppingCart className="h-5 w-5" />,
}

const navLabelMap: Record<string, string> = {
  home: '工作台',
  dashboard: '总览看板',
  qualifications: '客户资质',
  purchases: '采购申请',
}

function getNavItems(role: string): NavItem[] {
  const config = roleConfig[role as keyof typeof roleConfig]
  if (!config) return []

  const sublabelMap: Record<string, Record<string, string>> = {
    sales_clerk: { qualifications: '提交/编辑', purchases: '创建申请' },
    warehouse: { purchases: '出库/发货' },
    after_sales: { purchases: '发货/签收' },
    director: { dashboard: '审批/追查' },
  }

  const entries = ['home', ...config.entries]

  return entries.map((entry) => ({
    path: entry === 'dashboard' ? '/dashboard' : entry === 'home' ? '/home' : `/${entry}`,
    label: navLabelMap[entry] || entry,
    icon: navIconMap[entry],
    sublabel: sublabelMap[role]?.[entry],
  }))
}

const pageTitleMap: Record<string, string> = {
  '/home': '工作台',
  '/dashboard': '总览看板',
  '/qualifications': '客户资质',
  '/purchases': '采购申请',
}

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { session, fetchSession } = useStore()

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  if (!session) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-600" />
      </div>
    )
  }

  const navItems = getNavItems(session.role)
  const basePath = '/' + location.pathname.split('/')[1]
  const pageTitle = pageTitleMap[basePath] || ''

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="flex w-60 flex-shrink-0 flex-col bg-slate-900">
        <div className="flex h-16 items-center gap-2.5 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500">
            <FileCheck className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-white">口腔耗材商管理系统</span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {navItems.map((item) => {
            const isActive = basePath === item.path
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                  isActive
                    ? 'bg-slate-700/80 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200',
                )}
              >
                <span className={cn(isActive && 'text-amber-400')}>{item.icon}</span>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.sublabel && (
                    <span className="text-[10px] text-slate-500">{item.sublabel}</span>
                  )}
                </div>
              </button>
            )
          })}
        </nav>

        <div className="border-t border-slate-700/50 px-3 py-3">
          <button
            onClick={() => navigate('/')}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
          >
            <LogOut className="h-5 w-5" />
            <span>切换角色</span>
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
          <h1 className="text-lg font-semibold text-gray-900">{pageTitle}</h1>
          <RoleSwitcher />
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
