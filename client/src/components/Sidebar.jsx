import { Calendar, FileText, LayoutDashboard, Shield, Tv } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '工作台' },
  { to: '/orders', icon: FileText, label: '订单管理' },
  { to: '/materials', icon: Shield, label: '素材审核' },
  { to: '/schedule', icon: Calendar, label: '排期管理' },
  { to: '/broadcast', icon: Tv, label: '播出确认' },
];

export default function Sidebar() {
  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      <div className="px-6 py-5 border-b border-gray-100">
        <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <span className="text-2xl">📺</span>
          广告排期系统
        </h1>
        <p className="text-xs text-gray-400 mt-1">全流程广告管理平台</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-gray-100">
        <div className="text-xs text-gray-400">
          <p>角色演示</p>
          <p className="mt-1">销售：张明 / 王丽 / 陈晓</p>
          <p>审核：赵合规 / 李审核</p>
          <p>排期：刘排</p>
        </div>
      </div>
    </aside>
  );
}
