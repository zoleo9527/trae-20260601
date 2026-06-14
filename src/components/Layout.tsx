import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Users,
  Car,
  CreditCard,
  FileText,
  LogOut,
  Menu,
  Bell,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { clsx } from 'clsx';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const getMenuItems = () => {
    if (!user) return [];

    const baseItems = [
      { path: '/', icon: Home, label: '工作台' },
      { path: '/students', icon: Users, label: '学员列表' },
    ];

    switch (user.role) {
      case 'advisor':
        return [
          ...baseItems,
          { path: '/training', icon: Car, label: '练车管理' },
          { path: '/payments', icon: CreditCard, label: '费用管理' },
          { path: '/exams', icon: FileText, label: '考试管理' },
        ];
      case 'coach':
        return [
          ...baseItems,
          { path: '/training', icon: Car, label: '学时管理' },
        ];
      case 'examiner':
        return [
          ...baseItems,
          { path: '/exams', icon: FileText, label: '考试管理' },
          { path: '/payments', icon: CreditCard, label: '补考费用' },
        ];
      case 'admin':
        return [
          ...baseItems,
          { path: '/training', icon: Car, label: '练车管理' },
          { path: '/payments', icon: CreditCard, label: '费用管理' },
          { path: '/exams', icon: FileText, label: '考试管理' },
        ];
      default:
        return baseItems;
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Car className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">驾校运营系统</span>
              </div>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={clsx(
                        'inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                        isActive
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      )}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.realName}</p>
                  <p className="text-xs text-gray-500">{getRoleLabel(user?.role)}</p>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  title="退出登录"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>

              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="sm:hidden p-2 text-gray-400 hover:text-gray-600"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {sidebarOpen && (
          <div className="sm:hidden border-t border-gray-200">
            <div className="px-2 py-3 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={clsx(
                      'block px-3 py-2 rounded-md text-base font-medium',
                      isActive
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    )}
                  >
                    <Icon className="w-4 h-4 inline mr-2" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
};

function getRoleLabel(role?: string): string {
  const roleMap: Record<string, string> = {
    advisor: '招生顾问',
    coach: '教练',
    examiner: '考试专员',
    admin: '管理员',
  };
  return roleMap[role || ''] || role || '';
}
