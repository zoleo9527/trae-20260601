import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Award, ArrowLeftRight } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { path: '/', label: '今日待办', icon: LayoutDashboard },
  { path: '/feedback', label: '反馈处理', icon: FileText },
  { path: '/certificate', label: '证书发放', icon: Award },
  { path: '/flow', label: '流转看板', icon: ArrowLeftRight },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-white border-r border-border h-screen sticky top-0">
      <div className="p-6">
        <h1 className="text-xl font-bold text-primary">博物馆社教</h1>
        <p className="text-sm text-text-muted mt-1">反馈收集与证书发放</p>
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
