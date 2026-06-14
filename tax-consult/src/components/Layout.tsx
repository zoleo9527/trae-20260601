import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  PlusCircle,
  Users,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: '工作台', icon: LayoutDashboard, end: true },
  { to: '/consultations', label: '咨询受理', icon: ClipboardList, end: false },
  { to: '/documents', label: '资料清单', icon: FileText, end: false },
  { to: '/batch', label: '批量录入', icon: PlusCircle, end: false },
  { to: '/staff', label: '人员管理', icon: Users, end: false },
];

export default function Layout() {
  return (
    <div className="flex h-full">
      <aside className="w-60 flex-shrink-0 bg-brand-900 text-white flex flex-col">
        <div className="h-14 flex items-center px-5 border-b border-brand-800">
          <span className="text-base font-semibold tracking-wide">税务咨询受理系统</span>
        </div>
        <nav className="flex-1 py-2 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 h-10 text-sm transition-colors ${
                  isActive
                    ? 'bg-brand-800 text-white font-medium'
                    : 'text-brand-200 hover:bg-brand-800/50 hover:text-white'
                }`
              }
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="px-5 py-3 border-t border-brand-800 text-xs text-brand-300">
          © 2026 税务咨询受理系统
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
}
