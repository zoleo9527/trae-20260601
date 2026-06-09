import { useStore } from '../stores/appStore';
import { Package, ShoppingCart, ClipboardCheck, Warehouse, AlertTriangle, CreditCard, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const navItemsByRole = {
  owner: [
    { path: '/dashboard', icon: Package, label: '仪表盘' },
    { path: '/sales/new', icon: ShoppingCart, label: '新建销售单' },
    { path: '/sales/list', icon: ClipboardCheck, label: '销售单列表' },
    { path: '/credit', icon: CreditCard, label: '赊账管理' },
  ],
  technician: [
    { path: '/dashboard', icon: Package, label: '仪表盘' },
    { path: '/confirmation/list', icon: ClipboardCheck, label: '用药确认' },
  ],
  warehouse: [
    { path: '/dashboard', icon: Package, label: '仪表盘' },
    { path: '/warehouse/list', icon: Warehouse, label: '出库确认' },
    { path: '/inventory', icon: AlertTriangle, label: '库存管理' },
  ],
};

export default function Layout({ children }) {
  const { currentUser, setCurrentUser } = useStore();
  const location = useLocation();

  const navItems = navItemsByRole[currentUser?.role] || [];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-lg font-bold text-primary-dark flex items-center gap-2">
            <span className="w-8 h-8 bg-primary-dark rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">农</span>
            </span>
            农资门店系统
          </h1>
          <p className="text-xs text-gray-400 mt-1">农药销售与用药提醒</p>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
              {currentUser?.name?.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-gray-800">{currentUser?.name}</p>
              <p className="text-xs text-gray-500">
                {currentUser?.role === 'owner' && '门店老板'}
                {currentUser?.role === 'technician' && '农技员'}
                {currentUser?.role === 'warehouse' && '仓管'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-primary text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={() => setCurrentUser(null)}
            className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200 w-full"
          >
            <LogOut size={20} />
            <span className="font-medium">切换用户</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
