import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Clock, FileText, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: '工作台', icon: LayoutDashboard },
  { path: '/detention', label: '滞留费用', icon: Clock },
  { path: '/appeal', label: '司机申诉', icon: FileText },
];

export const Sidebar = () => {
  return (
    <aside className="w-56 bg-white border-r border-gray-200 h-screen flex flex-col flex-shrink-0">
      <div className="h-14 flex items-center px-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">物</span>
          </div>
          <span className="font-semibold text-gray-800">物流园月台</span>
        </div>
      </div>
      <nav className="flex-1 py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )
                }
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-3 border-t border-gray-100">
        <button className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded transition-colors">
          <Settings className="w-4 h-4" />
          系统设置
        </button>
      </div>
    </aside>
  );
};
