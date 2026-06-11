'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { roleLabels } from '@/data/mockData';
import type { Role } from '@/types';

interface NavItem {
  key: string;
  label: string;
  icon: string;
  roles: Role[];
}

const navItems: NavItem[] = [
  { key: 'dashboard', label: '工作台', icon: '📊', roles: ['manager', 'consultant', 'controller'] },
  { key: 'visits', label: '来访登记', icon: '👥', roles: ['manager', 'consultant'] },
  { key: 'followups', label: '跟进管理', icon: '📞', roles: ['manager', 'consultant'] },
  { key: 'subscriptions', label: '认购管理', icon: '📋', roles: ['manager', 'consultant', 'controller'] },
  { key: 'materials', label: '认购资料', icon: '📁', roles: ['manager', 'consultant', 'controller'] },
  { key: 'signing', label: '签约提醒', icon: '⏰', roles: ['manager', 'consultant', 'controller'] },
  { key: 'logs', label: '操作日志', icon: '📝', roles: ['manager'] },
  { key: 'system-info', label: '系统说明', icon: 'ℹ️', roles: ['manager', 'consultant', 'controller'] },
];

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { currentUser } = useApp();
  const [collapsed, setCollapsed] = useState(false);

  const visibleItems = navItems.filter((item) =>
    item.roles.includes(currentUser.role)
  );

  return (
    <div
      className={`h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
        {!collapsed && (
          <div className="font-bold text-lg text-primary-600">售楼处运营</div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto scrollbar-thin">
        {visibleItems.map((item) => (
          <button
            key={item.key}
            onClick={() => onTabChange(item.key)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
              activeTab === item.key
                ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-500 font-medium'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        {!collapsed && (
          <div className="text-xs text-gray-400">
            <div className="font-medium text-gray-500 mb-1">
              {roleLabels[currentUser.role]}
            </div>
            <div>{currentUser.name}</div>
          </div>
        )}
      </div>
    </div>
  );
}
