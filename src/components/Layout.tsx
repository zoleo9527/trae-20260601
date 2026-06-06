import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Lock,
  FileText,
  RotateCcw,
  BookOpen,
  ChevronDown,
  User,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { UserRole } from '@/types';

interface LayoutProps {
  children: React.ReactNode;
}

const roleLabels: Record<UserRole, string> = {
  operator: '运营',
  customs: '关务',
  warehouse: '仓配',
  admin: '管理员',
};

const menuItems = [
  { path: '/', label: '工作台', icon: LayoutDashboard },
  { path: '/preparation', label: '备货单管理', icon: Package },
  { path: '/inventory-lock', label: '库存锁定', icon: Lock },
  { path: '/customs', label: '报关资料', icon: FileText },
  { path: '/returns', label: '退件复盘', icon: RotateCcw },
  { path: '/api-docs', label: '接口文档', icon: BookOpen },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { currentUser, currentRole, setCurrentRole } = useStore();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const roles: UserRole[] = ['operator', 'customs', 'warehouse', 'admin'];

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <h1 className="text-lg font-bold text-gray-900">海外仓管理系统</h1>
        </div>
        <nav className="flex-1 py-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div />
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <span>角色：{roleLabels[currentRole]}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {showRoleDropdown && (
                <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  {roles.map((role) => (
                    <button
                      key={role}
                      onClick={() => {
                        setCurrentRole(role);
                        setShowRoleDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        currentRole === role
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {roleLabels[role]}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
              <span className="text-sm text-gray-700">{currentUser.name}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
