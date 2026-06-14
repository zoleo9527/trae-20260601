import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  ClipboardList,
  Calendar,
  History,
  Bell,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/utils/formatters';
import { useStore } from '@/stores/appStore';


const navItems = [
  { path: '/', label: '驾驶台', icon: LayoutDashboard, roles: ['ADMIN', 'CONSULTANT', 'COACH', 'SPECIALIST'] },
  { path: '/enrollment', label: '学员报名', icon: Users, roles: ['ADMIN', 'CONSULTANT'] },
  { path: '/archive', label: '资料建档', icon: FileText, roles: ['ADMIN', 'COACH', 'ARCHIVER'] },
  { path: '/coach', label: '教练工作台', icon: ClipboardList, roles: ['ADMIN', 'COACH'] },
  { path: '/exam', label: '考试管理', icon: Calendar, roles: ['ADMIN', 'SPECIALIST'] },
  { path: '/history', label: '操作历史', icon: History, roles: ['ADMIN', 'CONSULTANT', 'COACH', 'SPECIALIST'] },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { currentUser, users, notifications, setCurrentUser, markNotificationAsRead } = useStore();

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);

  const filteredNav = navItems.filter(
    (item) => currentUser && item.roles.includes(currentUser.role)
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-60 bg-slate-800 text-white flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <h1 className="text-xl font-bold">驾校运营系统</h1>
          <p className="text-sm text-slate-400 mt-1">Driving School OS</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                )}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="text-xs text-slate-400">
            v1.0.0
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="text-sm text-gray-500">
            {location.pathname === '/' ? '全局概览' : filteredNav.find(n => n.path === location.pathname)?.label}
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-3 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-700">通知</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">暂无通知</div>
                    ) : (
                      notifications.slice(0, 5).map((n) => (
                        <div
                          key={n.id}
                          className={cn(
                            'p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer',
                            !n.isRead && 'bg-blue-50'
                          )}
                          onClick={() => markNotificationAsRead(n.id)}
                        >
                          <div className="font-medium text-sm text-gray-800">{n.title}</div>
                          <div className="text-xs text-gray-500 mt-1">{n.content}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            {new Date(n.createdAt.replace(' ', 'T')).toLocaleString('zh-CN')}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {currentUser?.name.charAt(0)}
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-700">{currentUser?.name}</div>
                  <div className="text-xs text-gray-500">{currentUser?.role === 'CONSULTANT' ? '招生顾问' : currentUser?.role}</div>
                </div>
                <ChevronDown size={16} className="text-gray-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-2">
                    <div className="text-xs text-gray-500 px-2 py-1">切换用户</div>
                    {users.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => {
                          setCurrentUser(user.id);
                          setShowUserMenu(false);
                        }}
                        className={cn(
                          'w-full text-left px-2 py-2 rounded text-sm hover:bg-gray-100',
                          currentUser?.id === user.id && 'bg-primary-50 text-primary-700'
                        )}
                      >
                        {user.name} ({user.role === 'CONSULTANT' ? '顾问' : user.role})
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
