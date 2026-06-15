import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Wrench, 
  FileText, 
  Package, 
  ChevronLeft, 
  ChevronRight,
  User
} from 'lucide-react';
import { useStore } from '../store';

const navItems = [
  { id: 'orders', label: '订单列表', icon: ShoppingCart, path: '/' },
  { id: 'parts', label: '配件管理', icon: Package, path: '/parts' },
];

const orderDetailItems = [
  { id: 'detail', label: '配置原单', path: '' },
  { id: 'modify', label: '改配记录', path: '/modify' },
  { id: 'pricing', label: '差价复核', path: '/pricing' },
  { id: 'delivery', label: '交付验收', path: '/delivery' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const { currentUser, setCurrentUser, users } = useStore();

  const isOrderDetail = location.pathname.startsWith('/orders/');
  const orderId = isOrderDetail ? location.pathname.split('/')[2] : null;

  return (
    <div className="flex h-screen bg-gray-100">
      <aside
        className={`${
          sidebarCollapsed ? 'w-16' : 'w-64'
        } bg-gradient-to-b from-blue-600 to-blue-800 text-white flex flex-col transition-all duration-300`}
      >
        <div className="p-4 border-b border-blue-500">
          {!sidebarCollapsed && (
            <h1 className="text-xl font-bold">装机管理系统</h1>
          )}
        </div>

        <nav className="flex-1 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center px-4 py-3 mx-2 rounded-lg mb-1 transition-all ${
                  isActive
                    ? 'bg-blue-500 text-white'
                    : 'text-blue-100 hover:bg-blue-700'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <span className="ml-3">{item.label}</span>
                )}
              </Link>
            );
          })}

          {isOrderDetail && orderId && (
            <div className="mt-4 px-2">
              {!sidebarCollapsed && (
                <p className="text-xs text-blue-300 px-2 mb-2">订单详情</p>
              )}
              {orderDetailItems.map((item) => {
                const Icon = item.id === 'detail' ? FileText : Wrench;
                const fullPath = `/orders/${orderId}${item.path}`;
                const isActive = location.pathname === fullPath || 
                  (item.id === 'detail' && location.pathname === `/orders/${orderId}`);
                return (
                  <Link
                    key={item.id}
                    to={fullPath}
                    className={`flex items-center px-4 py-2 rounded-lg mb-1 transition-all ${
                      isActive
                        ? 'bg-blue-500 text-white'
                        : 'text-blue-100 hover:bg-blue-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <span className="ml-3 text-sm">{item.label}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        <div className="p-2 border-t border-blue-500">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center py-2 text-blue-200 hover:text-white hover:bg-blue-700 rounded-lg transition-all"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              {navItems.find((item) => location.pathname === item.path)?.label ||
                orderDetailItems.find(
                  (item) =>
                    location.pathname === `/orders/${orderId}${item.path}` ||
                    (item.id === 'detail' && location.pathname === `/orders/${orderId}`)
                )?.label ||
                '订单列表'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={currentUser?.id || ''}
              onChange={(e) => {
                const user = users.find((u) => u.id === e.target.value);
                if (user) setCurrentUser(user);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.role === 'sales' ? '销售' : user.role === 'technician' ? '装机师' : '客服'})
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2 text-gray-600">
              <User className="w-5 h-5" />
              <span className="text-sm">{currentUser?.name}</span>
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
