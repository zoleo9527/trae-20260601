import { LayoutDashboard, ListOrdered, Package, Scissors, Users, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

const menuItems = [
  { id: 'dashboard', label: '仪表盘', icon: LayoutDashboard },
  { id: 'orders', label: '订单列表', icon: ListOrdered },
  { id: 'fabric-stock', label: '面料库存', icon: Package },
  { id: 'process-tracking', label: '加工跟踪', icon: Scissors },
  { id: 'staff', label: '人员管理', icon: Users },
]

function Sidebar({ activeTab, onTabChange }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-56'} bg-slate-800 text-white flex flex-col transition-all duration-300`}>
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        {!collapsed && (
          <h1 className="text-lg font-bold text-cyan-400">窗帘门店系统</h1>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 hover:bg-slate-700 rounded transition-colors"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="flex-1 py-4">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center px-3 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-cyan-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  {!collapsed && (
                    <span className="ml-3 text-sm font-medium">{item.label}</span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-700">
        {!collapsed ? (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-cyan-600 flex items-center justify-center">
              <Users size={18} />
            </div>
            <div>
              <p className="text-sm font-medium">演示账号</p>
              <p className="text-xs text-slate-400">管理员</p>
            </div>
          </div>
        ) : (
          <div className="w-10 h-10 mx-auto rounded-full bg-cyan-600 flex items-center justify-center">
            <Users size={18} />
          </div>
        )}
      </div>
    </aside>
  )
}

export default Sidebar