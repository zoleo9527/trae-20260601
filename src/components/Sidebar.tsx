import React from 'react'
import { useAppStore } from '../store/useAppStore'
import { ROLE_LABELS, UserRole } from '../types'

const roleViews: Record<UserRole, { id: string; label: string; icon: string }[]> = {
  sales: [
    { id: 'sales-dashboard', label: '订单总览', icon: '📋' },
    { id: 'sales-new', label: '新建订单', icon: '➕' },
    { id: 'sales-quote', label: '报价管理', icon: '💰' },
    { id: 'sales-customers', label: '客户管理', icon: '👥' }
  ],
  designer: [
    { id: 'designer-dashboard', label: '待处理打样', icon: '🎨' },
    { id: 'designer-all', label: '全部打样', icon: '📁' }
  ],
  production: [
    { id: 'production-dashboard', label: '排产总览', icon: '⚙️' },
    { id: 'production-machines', label: '机台状态', icon: '🖨️' },
    { id: 'production-schedule', label: '新建排产', icon: '📅' }
  ],
  admin: [
    { id: 'admin-dashboard', label: '数据总览', icon: '📊' },
    { id: 'admin-export', label: '数据导出', icon: '📤' }
  ]
}

export const Sidebar: React.FC = () => {
  const { currentUser, workspace, saveWorkspace, switchRole } = useAppStore()
  const collapsed = workspace?.sidebar_collapsed ?? false

  const handleRoleSwitch = async (role: UserRole) => {
    await switchRole(role)
  }

  const handleNavClick = (viewId: string) => {
    saveWorkspace({ current_view: viewId })
  }

  const toggleSidebar = () => {
    saveWorkspace({ sidebar_collapsed: !collapsed })
  }

  if (!currentUser || !workspace) return null

  const views = roleViews[currentUser.role]
  const currentView = workspace.current_view

  return (
    <div className={`h-full bg-factory-panel border-r border-factory-border flex flex-col transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'}`}>
      <div className="p-3 border-b border-factory-border flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <span className="text-xl">🏭</span>
            <span className="font-bold text-factory-text">印刷厂MIS</span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded hover:bg-factory-border text-factory-muted hover:text-factory-text transition-colors"
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {!collapsed && (
        <div className="p-3 border-b border-factory-border">
          <div className="text-xs text-factory-muted mb-2">当前角色</div>
          <div className="text-sm font-semibold text-factory-accent">
            {currentUser.real_name} · {ROLE_LABELS[currentUser.role]}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-2">
        {!collapsed && <div className="px-3 py-1 text-xs text-factory-muted">功能导航</div>}
        {views.map(view => (
          <button
            key={view.id}
            onClick={() => handleNavClick(view.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
              currentView === view.id
                ? 'bg-factory-accent/20 text-factory-accent border-l-2 border-factory-accent'
                : 'text-factory-text hover:bg-factory-border hover:text-white'
            }`}
          >
            <span className="text-lg">{view.icon}</span>
            {!collapsed && <span className="text-sm">{view.label}</span>}
          </button>
        ))}
      </div>

      {!collapsed && (
        <div className="p-3 border-t border-factory-border">
          <div className="text-xs text-factory-muted mb-2">切换角色</div>
          <div className="space-y-1">
            {(['sales', 'designer', 'production', 'admin'] as UserRole[]).map(role => (
              <button
                key={role}
                onClick={() => handleRoleSwitch(role)}
                className={`w-full text-left px-2 py-1.5 text-xs rounded transition-colors ${
                  currentUser.role === role
                    ? 'bg-factory-accent text-white'
                    : 'text-factory-muted hover:bg-factory-border hover:text-factory-text'
                }`}
              >
                {ROLE_LABELS[role]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
