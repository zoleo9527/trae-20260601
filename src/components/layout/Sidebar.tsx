import { NavLink, useLocation } from 'react-router-dom';
import { Package, Search, ShoppingBag, DollarSign, Gem, LayoutDashboard } from 'lucide-react';

const navItems = [
  { path: '/', label: '总览', icon: LayoutDashboard },
  { path: '/receiving', label: '收货台', icon: Package },
  { path: '/appraisal', label: '鉴定区', icon: Search },
  { path: '/operations', label: '运营区', icon: ShoppingBag },
  { path: '/finance', label: '财务区', icon: DollarSign },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-60 bg-luxury-800 min-h-screen flex flex-col">
      <div className="p-6 border-b border-luxury-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-champagne-500 rounded-luxury flex items-center justify-center">
            <Gem className="w-6 h-6 text-luxury-800" />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold text-champagne-500">奢品寄卖</h1>
            <p className="text-xs text-ivory-200 opacity-70">内部工作台</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        <div className="px-4 py-2 text-xs font-medium text-ivory-200 opacity-50 uppercase tracking-wider">
          工作台
        </div>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-luxury text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-champagne-500 text-luxury-800 font-medium shadow-luxury'
                  : 'text-ivory-200 hover:bg-luxury-700 hover:text-ivory-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-luxury-700">
        <div className="flex items-center gap-3 p-3 bg-luxury-700 rounded-luxury">
          <div className="w-10 h-10 bg-champagne-200 rounded-full flex items-center justify-center">
            <span className="text-luxury-800 font-semibold text-sm">
              张
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ivory-50 truncate">张敏</p>
            <p className="text-xs text-ivory-200 opacity-70">
              演示模式 · 全部角色
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
