import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, ArrowLeftRight, User } from 'lucide-react';
import clsx from 'clsx';
import { useStore } from '@/store/useStore';

const navItems = [
  { path: '/', label: '今日待办', icon: LayoutDashboard },
  { path: '/feedback', label: '反馈处理', icon: FileText },
  { path: '/flow', label: '流转看板', icon: ArrowLeftRight },
];

export const Sidebar: React.FC = () => {
  const { currentUser, users, switchUser } = useStore();

  return (
    <aside className="w-64 bg-white border-r border-border h-screen sticky top-0">
      <div className="p-6">
        <h1 className="text-xl font-bold text-primary">博物馆社教</h1>
        <p className="text-sm text-text-muted mt-1">反馈收集与证书发放</p>
      </div>

      <div className="px-4 pb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {currentUser.name.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-text-main">{currentUser.name}</p>
              <p className="text-xs text-text-muted">
                {currentUser.role === 'teacher' ? '社教老师' : 
                 currentUser.role === 'volunteer' ? '志愿者' : '活动主管'}
              </p>
            </div>
          </div>
          <select
            value={currentUser.id}
            onChange={(e) => switchUser(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.role === 'teacher' ? '社教老师' : 
                            user.role === 'volunteer' ? '志愿者' : '活动主管'})
              </option>
            ))}
          </select>
        </div>
      </div>

      <nav className="px-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-text-main hover:bg-gray-50'
                )
              }
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
        <div className="text-xs text-text-muted">
          <p>技术支持</p>
          <p className="mt-1">博物馆信息管理系统</p>
        </div>
      </div>
    </aside>
  );
};