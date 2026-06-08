import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  MapPin,
  CalendarCheck,
  ScrollText,
  Plane,
} from 'lucide-react';

const navItems = [
  { to: '/', label: '总览', icon: LayoutDashboard },
  { to: '/orders', label: '货单管理', icon: Package },
  { to: '/allocations', label: '库位分配', icon: MapPin },
  { to: '/appointments', label: '提货预约', icon: CalendarCheck },
  { to: '/audit', label: '审计日志', icon: ScrollText },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-60 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="px-5 py-4 border-b border-slate-700 flex items-center gap-2">
          <Plane className="w-5 h-5 text-blue-400" />
          <div>
            <div className="font-bold text-sm">民航货站</div>
            <div className="text-xs text-slate-400">库位分配与提货预约</div>
          </div>
        </div>
        <nav className="flex-1 py-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-300 border-r-2 border-blue-400'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-5 py-3 border-t border-slate-700">
          <div className="text-xs text-slate-500">角色：货站受理 / 安检员 / 库区调度</div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
