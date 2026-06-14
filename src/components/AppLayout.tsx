import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  RefreshCw,
  Users,
  Bell,
  Search,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    path: '/',
    label: '总览',
    icon: LayoutDashboard,
  },
  {
    path: '/feedback',
    label: '课堂反馈',
    icon: MessageSquare,
  },
  {
    path: '/renewal',
    label: '续费跟进',
    icon: RefreshCw,
  },
  {
    path: '/students',
    label: '学员档案',
    icon: Users,
  },
  {
    path: '/exceptions',
    label: '异常管理',
    icon: AlertTriangle,
  },
];

export const AppLayout: React.FC = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex bg-cream-100">
      {/* 侧边栏 */}
      <aside className="w-64 bg-white border-r border-cream-200 flex flex-col fixed h-full z-20">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-cream-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-wine-600 to-wine-800 flex items-center justify-center">
              <span className="text-gold-300 font-serif font-bold text-lg">舞</span>
            </div>
            <div>
              <h1 className="font-serif font-semibold text-ink-900">星舞艺术</h1>
              <p className="text-xs text-ink-500">教务管理系统</p>
            </div>
          </div>
        </div>

        {/* 导航 */}
        <nav className="flex-1 py-4 px-3">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path ||
                (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-wine-50 text-wine-700 shadow-sm'
                      : 'text-ink-600 hover:bg-cream-50 hover:text-ink-900'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              );
            })}
          </div>

          <div className="mt-8">
            <p className="px-3 text-xs font-medium text-ink-400 uppercase tracking-wider mb-2">
              快捷入口
            </p>
            <div className="space-y-1">
              <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-ink-600 hover:bg-cream-50 rounded-lg transition-colors">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                今日课表
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-ink-600 hover:bg-cream-50 rounded-lg transition-colors">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                考级报名
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-ink-600 hover:bg-cream-50 rounded-lg transition-colors">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                服装订购
              </button>
            </div>
          </div>
        </nav>

        {/* 底部用户信息 */}
        <div className="p-4 border-t border-cream-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-white text-sm font-medium">
              小
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink-900 truncate">小张</p>
              <p className="text-xs text-ink-500 truncate">课程顾问</p>
            </div>
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="flex-1 ml-64">
        {/* 顶部栏 */}
        <header className="h-16 bg-white/80 backdrop-blur-sm border-b border-cream-200 sticky top-0 z-10">
          <div className="h-full px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  type="text"
                  placeholder="搜索学员、反馈..."
                  className="w-64 pl-9 pr-4 py-2 bg-cream-50 border border-cream-200 rounded-lg text-sm text-ink-700 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-wine-500/20 focus:border-wine-300 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="relative p-2 text-ink-500 hover:text-ink-700 hover:bg-cream-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-wine-500 rounded-full" />
              </button>
            </div>
          </div>
        </header>

        {/* 页面内容 */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
