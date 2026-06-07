import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  RefreshCw, 
  Wallet, 
  ListFilter, 
  FileText, 
  AlertTriangle,
  Bell,
  Menu,
  X,
  Tag,
  FileCheck
} from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { RoleSelector } from './RoleSelector';
import { cn, getRoleText } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/', icon: Home, label: '首页概览' },
  { path: '/near-expiry', icon: Tag, label: '临期商品处理' },
  { path: '/off-shelf-review', icon: FileCheck, label: '下架复核管理' },
  { path: '/bottles', icon: RefreshCw, label: '空瓶回收处理' },
  { path: '/deposits', icon: Wallet, label: '押金核对回看' },
  { path: '/list', icon: ListFilter, label: '筛选列表' },
  { path: '/logs', icon: FileText, label: '操作日志' },
  { path: '/alerts', icon: AlertTriangle, label: '异常提醒' },
];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser, getAlertsForRole } = useAppStore();
  
  const alerts = currentUser ? getAlertsForRole(currentUser.role) : [];
  const activeAlertCount = alerts.filter(a => a.status === 'active').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <h1 className="text-xl font-bold text-gray-900">便利店连锁</h1>
              <span className="text-sm text-gray-500">临期商品与下架复核</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Bell className="w-5 h-5 text-gray-500" />
                {activeAlertCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {activeAlertCount}
                  </span>
                )}
              </div>
              <div className="hidden sm:block">
                <RoleSelector compact />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="lg:hidden mb-4">
          <RoleSelector compact />
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <aside className={cn(
            'lg:w-56 flex-shrink-0',
            sidebarOpen ? 'block' : 'hidden lg:block'
          )}>
            <nav className="bg-white rounded-xl shadow-sm p-3 sticky top-24">
              <ul className="space-y-1">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                          isActive
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        )}
                      >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
              
              {currentUser && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="px-3">
                    <p className="text-xs text-gray-500">当前角色</p>
                    <p className="text-sm font-medium text-gray-900">{getRoleText(currentUser.role)}</p>
                    <p className="text-xs text-gray-500">{currentUser.name}</p>
                  </div>
                </div>
              )}
            </nav>
          </aside>

          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
