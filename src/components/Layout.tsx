import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  ClipboardList,
  AlertTriangle,
  History,
  User,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { ROLE_LABELS } from '../../shared/types';
import type { UserRole } from '../../shared/types';

const navItems = [
  { path: '/', label: '首页仪表盘', icon: LayoutDashboard },
  { path: '/dock-board', label: '月台看板', icon: MapPin },
  { path: '/check-in', label: '卸货签到', icon: ClipboardList },
  { path: '/discrepancy', label: '差异登记', icon: AlertTriangle },
  { path: '/records', label: '历史记录', icon: History },
];

const roles: UserRole[] = ['dispatcher', 'forklift', 'clerk'];

export function Layout() {
  const { currentUser, switchRole } = useAppStore();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex">
      <aside className="w-60 bg-slate-950 border-r border-slate-800 flex flex-col">
        <div className="h-16 flex items-center px-5 border-b border-slate-800">
          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center mr-3">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base">物流园月台</h1>
            <p className="text-xs text-slate-400">卸货管理系统</p>
          </div>
        </div>

        <nav className="flex-1 py-4">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2.5 rounded text-sm transition-colors ${
                      isActive
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                        : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 mr-3" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-3 border-t border-slate-800">
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="w-full flex items-center p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mr-3">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">{currentUser.name}</p>
                <p className="text-xs text-slate-400">{ROLE_LABELS[currentUser.role]}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${roleDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {roleDropdownOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-800 rounded-lg border border-slate-700 shadow-xl overflow-hidden">
                {roles.map((role) => (
                  <button
                    key={role}
                    onClick={() => {
                      switchRole(role);
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 text-sm text-left hover:bg-slate-700 transition-colors ${
                      currentUser.role === role ? 'bg-blue-600/20 text-blue-400' : 'text-slate-200'
                    }`}
                  >
                    {ROLE_LABELS[role]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-slate-950/50 border-b border-slate-800 flex items-center px-6">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="text-slate-500">当前视图:</span>
            <span className="text-slate-200 font-medium">{ROLE_LABELS[currentUser.role]}</span>
          </div>
          <div className="ml-auto text-sm text-slate-400">
            {new Date().toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })}
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
