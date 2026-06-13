import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import {
  LayoutDashboard,
  BookOpen,
  ClipboardCheck,
  AlertTriangle,
  Bell,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: '工作台', roles: ['trainer_manager', 'department_head', 'instructor', 'trainee'] },
  { path: '/courses', icon: BookOpen, label: '课程管理', roles: ['trainer_manager', 'department_head', 'instructor', 'trainee'] },
  { path: '/attendance', icon: ClipboardCheck, label: '签到管理', roles: ['instructor'] },
  { path: '/exceptions', icon: AlertTriangle, label: '异常处理', roles: ['trainer_manager'] },
  { path: '/notifications', icon: Bell, label: '消息通知', roles: ['trainer_manager', 'department_head', 'instructor', 'trainee'] },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredMenuItems = menuItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-primary-800">企业内训管理系统</span>
              </div>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
                {filteredMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                  <div className="text-xs text-gray-500">{user?.role === 'trainer_manager' ? '培训经理' : user?.role === 'department_head' ? '部门负责人' : user?.role === 'instructor' ? '讲师' : '学员'}</div>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-gray-400 hover:text-gray-600"
                  title="退出登录"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="sm:hidden p-2 text-gray-400 hover:text-gray-600"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {sidebarOpen && (
        <div className="sm:hidden border-b border-gray-200 bg-white">
          <div className="px-2 py-3 space-y-1">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5 inline mr-2" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
