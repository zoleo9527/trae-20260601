import { clsx } from 'clsx';
import {
    AlertTriangle,
    ClipboardList,
    Menu,
    Package,
    PlusCircle,
    Search,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/', label: '案件列表', icon: ClipboardList },
  { path: '/return/new', label: '退货登记', icon: PlusCircle },
  { path: '/trace', label: '批次反查', icon: Search },
  { path: '/recalls', label: '召回管理', icon: AlertTriangle },
];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside
        className={clsx(
          'bg-[#1E3A5F] text-white flex flex-col transition-all duration-300',
          sidebarOpen ? 'w-60' : 'w-16'
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <Package className="w-7 h-7 text-blue-300" />
              <span className="font-bold text-base tracking-wide">肉类质量追踪</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        <nav className="flex-1 py-4">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200',
                      isActive
                        ? 'bg-white/15 text-white shadow-sm'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    <Icon className={clsx('w-5 h-5 flex-shrink-0', isActive && 'text-blue-300')} />
                    {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        {sidebarOpen && (
          <div className="p-4 border-t border-white/10">
            <div className="text-xs text-slate-400">当前用户</div>
            <div className="text-sm font-medium mt-1">张质检</div>
          </div>
        )}
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm">
          <div>
            <h1 className="text-lg font-semibold text-slate-800">
              {navItems.find((item) => item.path === location.pathname)?.label || '肉类分割厂质量追溯系统'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">
              {new Date().toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}
            </span>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </main>
    </div>
  );
}
