import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useBreweryStore } from '../../store/useBreweryStore'
import { MENU_ITEMS, UserRole, ALERT_LEVEL_COLORS } from '../../types'
import { useState, useEffect, useRef } from 'react'

const ROLE_OPTIONS: { value: UserRole; label: string; user: string }[] = [
  { value: 'brewer', label: '酿酒师', user: '张师傅' },
  { value: 'packager', label: '包装主管', user: '王主管' },
  { value: 'sales', label: '销售内勤', user: '刘内勤' },
  { value: 'admin', label: '管理员', user: '系统管理员' },
]

export default function Layout() {
  const { currentRole, setCurrentRole, setCurrentUser, alerts, batches } = useBreweryStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [showRoleMenu, setShowRoleMenu] = useState(false)
  const [showAlertPanel, setShowAlertPanel] = useState(false)

  const pendingAlerts = alerts.filter((a) => a.status === 'pending')
  const activeBatches = batches.filter(
    (b) => b.status !== 'PACKAGED' && b.status !== 'ABNORMAL'
  ).length

  const criticalAlerts = pendingAlerts.filter((a) => a.level === 'critical')
  const warningAlerts = pendingAlerts.filter((a) => a.level === 'warning')

  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setShowRoleMenu(false)
        setShowAlertPanel(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleRoleChange = (role: UserRole) => {
    const roleInfo = ROLE_OPTIONS.find((r) => r.value === role)
    if (roleInfo) {
      setCurrentRole(role)
      setCurrentUser(roleInfo.user)
    }
    setShowRoleMenu(false)
    const firstMenu = MENU_ITEMS.find((m) => m.roles.includes(role))
    if (firstMenu && !MENU_ITEMS.find((m) => m.path === location.pathname)?.roles.includes(role)) {
      navigate(firstMenu.path)
    }
  }

  const currentRoleInfo = ROLE_OPTIONS.find((r) => r.value === currentRole)

  return (
    <div className="min-h-screen flex flex-col">
      <header ref={headerRef} className="bg-brew-dark border-b border-brew-border px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-bold text-amber-500">🍺 精酿酒厂 · 批次管理系统</h1>
            <div className="flex gap-2 text-xs">
              <span className="px-2 py-1 bg-brew-lighter rounded">
                进行中: <span className="text-green-400 font-bold">{activeBatches}</span> 批次
              </span>
              <div className="relative">
                <span
                  onClick={() => pendingAlerts.length > 0 && setShowAlertPanel(!showAlertPanel)}
                  className={`px-2 py-1 bg-brew-lighter rounded cursor-pointer ${
                    pendingAlerts.length > 0 ? 'hover:bg-brew-border' : ''
                  }`}
                >
                  待处理:{' '}
                  <span className={pendingAlerts.length > 0 ? 'text-red-400 font-bold' : 'text-gray-400'}>
                    {pendingAlerts.length}
                  </span>{' '}
                  异常
                  {pendingAlerts.length > 0 && (
                    <span className="ml-1 text-xs">▼</span>
                  )}
                </span>
                {showAlertPanel && pendingAlerts.length > 0 && (
                  <div className="absolute right-0 top-full mt-1 bg-brew-dark border border-brew-border rounded shadow-lg z-50 w-80 max-h-80 overflow-y-auto">
                    <div className="px-3 py-2 border-b border-brew-border font-medium text-sm flex justify-between items-center">
                      <span>⚠️ 待处理异常</span>
                      <button
                        onClick={() => navigate('/system')}
                        className="text-xs text-amber-400 hover:text-amber-300"
                      >
                        全部处理 →
                      </button>
                    </div>
                    <div className="divide-y divide-brew-border">
                      {pendingAlerts.slice(0, 5).map((alert) => (
                        <div
                          key={alert.id}
                          onClick={() => {
                            navigate(`/batches/${alert.batchId}`)
                            setShowAlertPanel(false)
                          }}
                          className="px-3 py-2 hover:bg-brew-lighter cursor-pointer"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`status-badge ${ALERT_LEVEL_COLORS[alert.level]} text-xs`}>
                              {alert.level === 'critical' ? '严重' : alert.level === 'warning' ? '警告' : '提示'}
                            </span>
                          </div>
                          <div className="text-xs">{alert.message}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(alert.createdAt).toLocaleString('zh-CN')}
                          </div>
                        </div>
                      ))}
                      {pendingAlerts.length > 5 && (
                        <div
                          onClick={() => {
                            navigate('/system')
                            setShowAlertPanel(false)
                          }}
                          className="px-3 py-2 text-center text-xs text-amber-400 hover:bg-brew-lighter cursor-pointer"
                        >
                          还有 {pendingAlerts.length - 5} 条待处理...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {criticalAlerts.length > 0 && (
                <span className="px-2 py-1 bg-red-900/50 border border-red-700 rounded animate-pulse">
                  🔴 严重: {criticalAlerts.length}
                </span>
              )}
              {warningAlerts.length > 0 && (
                <span className="px-2 py-1 bg-amber-900/50 border border-amber-700 rounded">
                  🟡 警告: {warningAlerts.length}
                </span>
              )}
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 px-3 py-1.5 bg-brew-lighter hover:bg-brew-border rounded text-sm"
            >
              <span className="text-gray-400">当前角色:</span>
              <span className="text-amber-400 font-medium">{currentRoleInfo?.label}</span>
              <span className="text-gray-500">({currentRoleInfo?.user})</span>
              <span className="text-gray-500">▼</span>
            </button>
            {showRoleMenu && (
              <div className="absolute right-0 top-full mt-1 bg-brew-dark border border-brew-border rounded shadow-lg z-50 min-w-40">
                {ROLE_OPTIONS.map((role) => (
                  <button
                    key={role.value}
                    onClick={() => handleRoleChange(role.value)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-brew-lighter ${
                      currentRole === role.value ? 'text-amber-400 bg-brew-lighter' : ''
                    }`}
                  >
                    <div className="font-medium">{role.label}</div>
                    <div className="text-xs text-gray-500">{role.user}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <nav className="w-48 bg-brew-dark border-r border-brew-border py-4">
          {MENU_ITEMS.filter((item) => item.roles.includes(currentRole)).map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-amber-900/30 text-amber-400 border-r-2 border-amber-500'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-brew-lighter'
                }`
              }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 p-4 overflow-auto">
          <Outlet />
        </main>
      </div>

      <footer className="bg-brew-dark border-t border-brew-border px-4 py-2 text-xs text-gray-500">
        <div className="flex justify-between">
          <span>精酿酒厂管理系统 v1.0</span>
          <span>数据自动保存至本地浏览器</span>
        </div>
      </footer>
    </div>
  )
}
