import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileCheck,
  Calculator,
  Database,
  Settings,
  Bell,
  ChevronLeft,
  ChevronRight,
  User,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ROLE_LABELS } from '@/types';
import { cn } from '@/lib/utils';

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: '案件看板' },
  { path: '/approval', icon: FileCheck, label: '核赔审批' },
  { path: '/calculation', icon: Calculator, label: '赔付计算' },
  { path: '/data', icon: Database, label: '数据管理' },
  { path: '/settings', icon: Settings, label: '系统设置' },
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { handlers, currentUserId } = useAppStore();

  const currentUser = handlers.find((h) => h.id === currentUserId);

  return (
    <div className="flex h-screen bg-slate-50">
      <aside
        className={cn(
          'flex flex-col bg-[#1e3a5f] text-white transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-700 px-4">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded bg-emerald-500" />
              <span className="text-lg font-bold">理赔中心</span>
            </div>
          )}
          {collapsed && <div className="mx-auto h-8 w-8 rounded bg-emerald-500" />}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded p-1 hover:bg-slate-700"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="flex-1 py-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-3 transition-colors',
                  isActive
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white',
                  collapsed && 'justify-center'
                )}
              >
                <Icon size={20} />
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && item.path === '/settings' && (
                  <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs">
                    3
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-700 p-4">
          <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
            {currentUser && (
              <>
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="h-10 w-10 rounded-full bg-slate-600"
                />
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{currentUser.name}</p>
                    <p className="text-xs text-slate-400">
                      {ROLE_LABELS[currentUser.role]}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b bg-white px-6 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              {menuItems.find((m) => m.path === location.pathname)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative rounded-full p-2 hover:bg-slate-100">
              <Bell size={20} className="text-slate-600" />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
            </button>
            {currentUser && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <User size={16} />
                <span>{ROLE_LABELS[currentUser.role]}</span>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
