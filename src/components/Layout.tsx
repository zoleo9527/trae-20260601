
import { useState } from 'react';
import {
  LayoutDashboard,
  MapPin,
  AlertTriangle,
  ClipboardList,
  ShoppingCart,
  MessageSquare,
  Wallet,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import type { UserRole } from '../../shared/types';

const menuItems: {
  path: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: UserRole[];
}[] = [
  { path: '/dashboard', label: '仪表盘', icon: LayoutDashboard, roles: ['admin', 'service', 'maintenance', 'finance'] },
  { path: '/stations', label: '站点管理', icon: MapPin, roles: ['admin', 'service'] },
  { path: '/faults', label: '故障管理', icon: AlertTriangle, roles: ['admin', 'service', 'maintenance'] },
  { path: '/workorders', label: '工单管理', icon: ClipboardList, roles: ['admin', 'service', 'maintenance'] },
  { path: '/orders', label: '订单管理', icon: ShoppingCart, roles: ['admin', 'service', 'finance'] },
  { path: '/complaints', label: '投诉处理', icon: MessageSquare, roles: ['admin', 'service'] },
  { path: '/settlements', label: '分账管理', icon: Wallet, roles: ['admin', 'finance'] },
];

const roleLabels: Record<UserRole, string> = {
  admin: '运营管理员',
  service: '客服人员',
  maintenance: '维修人员',
  finance: '财务人员',
};

export function Layout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredMenuItems = menuItems.filter((item) =>
    user ? item.roles.includes(user.role) : false
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 侧边栏 */}
      <aside
        className={`${
          collapsed ? 'w-16' : 'w-64'
        } bg-slate-900 text-white transition-all duration-300 flex flex-col`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
          {!collapsed && (
            <span className="font-bold text-lg text-blue-400">充电桩运营</span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            {collapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
        </div>

        <nav className="flex-1 py-4">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 mx-2 rounded-lg transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Icon size={20} />
                {!collapsed && (
                  <>
                    <span className="ml-3 flex-1">{item.label}</span>
                    <ChevronRight size={16} />
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {!collapsed && user && (
          <div className="p-4 border-t border-slate-700">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                {user.name.charAt(0)}
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium">{user.name}</div>
                <div className="text-xs text-slate-400">{roleLabels[user.role]}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-sm"
            >
              <LogOut size={16} className="mr-2" />
              退出登录
            </button>
          </div>
        )}
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-gray-800">
            {filteredMenuItems.find((item) => location.pathname.startsWith(item.path))
              ?.label || '充电桩运营后台'}
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              {new Date().toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}
            </span>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </main>
    </div>
  );
}
