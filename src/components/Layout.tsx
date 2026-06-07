import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarClock,
  Gift,
  Sparkles,
  Users,
  AlertTriangle,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bell,
  User
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuthStore } from '../stores/authStore';
import { useAnomalyStore } from '../stores/anomalyStore';

const navItems = [
  { path: '/', label: '控制台', icon: LayoutDashboard },
  { path: '/bookings', label: '包厢预订', icon: CalendarClock },
  { path: '/packages', label: '生日套餐', icon: Gift },
  { path: '/decorations', label: '包厢布置', icon: Sparkles },
  { path: '/members', label: '会员账务', icon: Users },
  { path: '/anomalies', label: '异常中心', icon: AlertTriangle },
  { path: '/audit', label: '操作追溯', icon: FileText },
  { path: '/settings', label: '设置', icon: Settings },
];

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { currentUser, role, setRole } = useAuthStore();
  const { getAnomalyCount } = useAnomalyStore();
  const anomalyCount = getAnomalyCount();
  const totalAnomalies = anomalyCount.high + anomalyCount.medium + anomalyCount.low;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <aside
        className={cn(
          'bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300',
          collapsed ? 'w-16' : 'w-56'
        )}
      >
        <div className="h-14 flex items-center justify-between px-4 border-b border-slate-800">
          {!collapsed && (
            <span className="font-bold text-lg text-blue-400">KTV管理</span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 hover:bg-slate-800 rounded transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            )}
          </button>
        </div>

        <nav className="flex-1 py-4">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              const showBadge = item.path === '/anomalies' && totalAnomalies > 0;

              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors relative',
                      isActive
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                    {showBadge && !collapsed && (
                      <span className="ml-auto w-5 h-5 flex items-center justify-center bg-red-500 text-white text-xs rounded-full">
                        {totalAnomalies}
                      </span>
                    )}
                    {showBadge && collapsed && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-slate-800 p-3">
          <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
            <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-slate-400" />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{currentUser}</p>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'front_desk' | 'manager')}
                  className="text-xs bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-slate-400 w-full"
                >
                  <option value="front_desk">前台</option>
                  <option value="manager">店长</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50">
          <h1 className="text-lg font-semibold">
            {navItems.find((item) => item.path === location.pathname)?.label || 'KTV门店管理'}
          </h1>
          <div className="flex items-center gap-4">
            <button className="relative p-2 hover:bg-slate-800 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-slate-400" />
              {totalAnomalies > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center bg-red-500 text-white text-xs rounded-full">
                  {totalAnomalies}
                </span>
              )}
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
};
