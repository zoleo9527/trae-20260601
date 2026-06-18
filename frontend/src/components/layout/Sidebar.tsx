import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Package,
  Bell,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '工作台' },
  { to: '/schedules', icon: Calendar, label: '讲师排班' },
  { to: '/approval', icon: CheckSquare, label: '审批中心' },
  { to: '/materials', icon: Package, label: '物料清单' },
  { to: '/notifications', icon: Bell, label: '消息中心' },
];

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <aside
      className={clsx(
        'bg-white border-r border-gray-200 transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex flex-col h-full">
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                  isActive
                    ? 'bg-museum-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                )
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-200">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm">收起</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};
