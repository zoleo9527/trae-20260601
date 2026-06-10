import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Truck,
  ScrollText,
  Flower2,
} from 'lucide-react';

const navItems = [
  { path: '/', label: '工作台', icon: LayoutDashboard },
  { path: '/orders', label: '订单排产', icon: ShoppingCart },
  { path: '/packaging', label: '包装质检', icon: Package },
  { path: '/loading', label: '装车复核', icon: Truck },
  { path: '/logs', label: '操作日志', icon: ScrollText },
];

export function Sidebar() {
  return (
    <aside className="w-60 bg-white border-r border-cream-200 flex flex-col h-screen sticky top-0">
      <div className="p-5 border-b border-cream-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-forest-600 to-forest-800 rounded-xl flex items-center justify-center">
            <Flower2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-forest-900 text-lg">花卉基地</h1>
            <p className="text-xs text-forest-500">包装质检系统</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'nav-item-active' : ''}`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-cream-200">
        <div className="text-xs text-forest-500 text-center">
          <p>版本 1.0.0</p>
        </div>
      </div>
    </aside>
  );
}
