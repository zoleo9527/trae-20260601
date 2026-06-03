import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  FileScan,
  Users,
  Settings,
  Menu,
  X,
  ChevronRight,
  LogOut,
  User,
  Package,
  CheckCircle2,
} from 'lucide-react';
import type { Role } from '@/types';
import { ROLE_LABELS } from '@/types';
import { cn } from '@/lib/utils';

interface MenuItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  roles: Role[];
}

interface LayoutProps {
  currentRole: Role | null;
  currentUser: string;
  onLogout?: () => void;
  onRoleChange?: (role: Role | null) => void;
}

const MENU_ITEMS: MenuItem[] = [
  {
    path: '/',
    label: '工作台',
    icon: <LayoutDashboard size={20} />,
    roles: ['CUSTOMER_SERVICE', 'DESIGNER', 'QUALITY', 'ADMIN'],
  },
  {
    path: '/orders',
    label: '订单管理',
    icon: <ClipboardList size={20} />,
    roles: ['CUSTOMER_SERVICE', 'ADMIN'],
  },
  {
    path: '/scan-files',
    label: '扫描文件',
    icon: <FileScan size={20} />,
    roles: ['CUSTOMER_SERVICE', 'DESIGNER', 'ADMIN'],
  },
  {
    path: '/assignments',
    label: '派单管理',
    icon: <Package size={20} />,
    roles: ['DESIGNER', 'ADMIN'],
  },
  {
    path: '/quality',
    label: '质检管理',
    icon: <CheckCircle2 size={20} />,
    roles: ['QUALITY', 'ADMIN'],
  },
  {
    path: '/technicians',
    label: '技师管理',
    icon: <Users size={20} />,
    roles: ['ADMIN'],
  },
  {
    path: '/settings',
    label: '系统设置',
    icon: <Settings size={20} />,
    roles: ['ADMIN'],
  },
];

export function Layout({ currentRole, currentUser, onLogout, onRoleChange }: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const visibleMenuItems = MENU_ITEMS.filter((item) =>
    currentRole ? item.roles.includes(currentRole) : false
  );

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-primary-500 text-white z-50 flex items-center justify-between px-4 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-primary-600 transition-colors"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <h1 className="text-lg font-bold">义齿加工管理系统</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm bg-primary-400 px-3 py-1 rounded-full">
            {currentRole ? ROLE_LABELS[currentRole] : '未登录'}
          </span>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full bg-primary-500 text-white z-50 transition-all duration-300 ease-in-out',
          'lg:translate-x-0',
          sidebarCollapsed ? 'lg:w-20' : 'lg:w-64',
          mobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-primary-400/30">
          {!sidebarCollapsed && (
            <h1 className="text-xl font-bold truncate">义齿加工管理系统</h1>
          )}
          <button
            onClick={() => {
              setSidebarCollapsed(!sidebarCollapsed);
              setMobileMenuOpen(false);
            }}
            className={cn(
              'p-2 rounded-lg hover:bg-primary-600 transition-colors hidden lg:block',
              sidebarCollapsed && 'mx-auto'
            )}
          >
            <ChevronRight
              size={20}
              className={cn('transition-transform duration-300', !sidebarCollapsed && 'rotate-180')}
            />
          </button>
        </div>

        {/* User Info */}
        {currentRole && (
          <div className="p-4 border-b border-primary-400/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-400 flex items-center justify-center flex-shrink-0">
                <User size={20} />
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{currentUser || '未设置'}</p>
                  <p className="text-sm text-primary-200 truncate">
                    {ROLE_LABELS[currentRole]}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1">
          {visibleMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
                  isActive
                    ? 'bg-white/15 text-white shadow-inner'
                    : 'text-primary-100 hover:bg-white/10 hover:text-white',
                  sidebarCollapsed && 'justify-center px-2'
                )}
              >
                <span
                  className={cn(
                    'flex-shrink-0 transition-transform duration-200',
                    isActive && 'scale-110'
                  )}
                >
                  {item.icon}
                </span>
                {!sidebarCollapsed && (
                  <span className="font-medium truncate">{item.label}</span>
                )}
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-neutral-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Role Switcher (Admin only) */}
        {currentRole === 'ADMIN' && !sidebarCollapsed && (
          <div className="absolute bottom-24 left-0 right-0 px-4">
            <div className="bg-primary-600/50 rounded-lg p-3">
              <p className="text-xs text-primary-200 mb-2">角色切换（测试用）</p>
              <div className="flex flex-wrap gap-2">
                {(['CUSTOMER_SERVICE', 'DESIGNER', 'QUALITY', 'ADMIN'] as Role[]).map(
                  (role) => (
                    <button
                      key={role}
                      onClick={() => onRoleChange?.(role)}
                      className={cn(
                        'px-2 py-1 text-xs rounded transition-colors',
                        currentRole === role
                          ? 'bg-white text-primary-600'
                          : 'bg-primary-700 text-primary-200 hover:bg-primary-700/80'
                      )}
                    >
                      {ROLE_LABELS[role]}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* Logout Button */}
        {onLogout && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-primary-400/30">
            <button
              onClick={onLogout}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-primary-200 hover:bg-white/10 hover:text-white transition-colors',
                sidebarCollapsed && 'justify-center'
              )}
            >
              <LogOut size={20} />
              {!sidebarCollapsed && <span className="font-medium">退出登录</span>}
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          'pt-16 lg:pt-0 transition-all duration-300 min-h-screen',
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        )}
      >
        {/* Desktop Header */}
        <header className="hidden lg:flex h-16 bg-white border-b border-neutral-200 items-center justify-between px-6 sticky top-0 z-30">
          <div>
            <h2 className="text-lg font-semibold text-neutral-800">
              {visibleMenuItems.find((item) => item.path === location.pathname)?.label ||
                '工作台'}
            </h2>
            <p className="text-xs text-neutral-500">
              {formatDateTime(new Date())}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {currentRole && (
              <span className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-sm font-medium border border-primary-200">
                {ROLE_LABELS[currentRole]}
              </span>
            )}
            {currentUser && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                  <User size={16} />
                </div>
                <span className="text-sm text-neutral-700 font-medium">
                  {currentUser}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
