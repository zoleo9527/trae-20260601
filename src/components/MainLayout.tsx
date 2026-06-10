import RoleSwitcher from '@/components/RoleSwitcher'
import { useStore } from '@/store'
import {
    ClipboardList,
    History,
    LayoutDashboard,
    Menu,
    X,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

const navItems = [
  {
    key: 'dashboard',
    label: '工作台概览',
    icon: LayoutDashboard,
    path: '/',
  },
  {
    key: 'orders',
    label: '维保计划处理',
    icon: ClipboardList,
    path: '/orders',
  },
  {
    key: 'history',
    label: '历史记录回看',
    icon: History,
    path: '/history',
  },
]

export default function MainLayout() {
  const { currentRole, roles } = useStore()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const roleInfo = roles.find((r) => r.key === currentRole)

  const threeQuestions = [
    {
      q: '谁在处理？',
      a: roleInfo?.label || '—',
      color: 'text-blue-600',
    },
    {
      q: '卡在哪里？',
      a: currentRole === 'technician'
        ? '待签到工单'
        : currentRole === 'service'
          ? '签到后跟进中'
          : '待主管审核',
      color: 'text-amber-600',
    },
    {
      q: '为什么没完成？',
      a: currentRole === 'technician'
        ? '技师未到场签到'
        : currentRole === 'service'
          ? '客服跟进确认中'
          : '主管未审核',
      color: 'text-rose-600',
    },
  ]

  return (
    <div className="flex h-screen bg-slate-50">
      {/* 左侧导航 */}
      <aside
        className={`${
          sidebarOpen ? 'w-60' : 'w-0'
        } flex-shrink-0 border-r border-slate-200 bg-white transition-all duration-200 overflow-hidden`}
      >
        <div className="flex h-14 items-center gap-2 border-b border-slate-100 px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500">
            <ClipboardList className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">电梯维保</h2>
            <p className="text-xs text-slate-400">业务工作台</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path)
            return (
              <NavLink
                key={item.key}
                to={item.path}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-amber-50 text-amber-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        {/* 主链路三问 */}
        <div className="mx-3 mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <div className="mb-2 text-xs font-semibold text-amber-800">
            主链路三问
          </div>
          <div className="space-y-1.5">
            {threeQuestions.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs">
                <span className="text-slate-500">{item.q}</span>
                <span className={`font-medium ${item.color}`}>{item.a}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 角色责任说明 */}
        <div className="mx-3 mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 text-xs font-semibold text-slate-700">
            三角色责任
          </div>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
              <div className="text-xs">
                <div className="font-medium text-slate-700">维保技师</div>
                <div className="text-slate-500">到场签到、执行维保、上报异常</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
              <div className="text-xs">
                <div className="font-medium text-slate-700">客服</div>
                <div className="text-slate-500">跟进确认、协调异常、提交审核</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-orange-500" />
              <div className="text-xs">
                <div className="font-medium text-slate-700">项目主管</div>
                <div className="text-slate-500">审核维保、质量把控、批量处理</div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 顶部栏 */}
        <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              {sidebarOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
            <h1 className="text-base font-semibold text-slate-900">
              电梯维保 · 维保计划与到场签到
            </h1>
          </div>
          <RoleSwitcher />
        </header>

        {/* 内容区 */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
