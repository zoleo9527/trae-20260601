import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  MapPin,
  BarChart3,
  Settings,
  Lamp,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { roleLabels } from '../types';

export function Sidebar() {
  const { currentUser, logout } = useAuthStore();

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: '待办看板' },
    { to: '/workorders', icon: ClipboardList, label: '工单管理' },
    { to: '/lampposts', icon: Lamp, label: '灯杆台账' },
    { to: '/map', icon: MapPin, label: '地图视图' },
    { to: '/statistics', icon: BarChart3, label: '统计分析' },
  ];

  return (
    <aside className="w-60 bg-neutral-800 min-h-screen flex flex-col">
      <div className="p-5 border-b border-neutral-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <Lamp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-base">市政路灯所</h1>
            <p className="text-neutral-400 text-xs">维修派工系统</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'text-neutral-300 hover:bg-neutral-700 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-neutral-700">
        {currentUser && (
          <div className="mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold text-sm">
                {currentUser.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">
                  {currentUser.name}
                </p>
                <p className="text-neutral-400 text-xs">
                  {roleLabels[currentUser.role]} · {currentUser.employeeNo}
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded-lg text-sm transition-colors">
            <Settings className="w-4 h-4" />
            <span>系统设置</span>
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 text-neutral-400 hover:text-danger-400 hover:bg-neutral-700 rounded-lg text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>退出登录</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
