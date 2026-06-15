import React from 'react';
import { cn } from '@/lib/utils';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Settings,
  Truck,
  Wrench,
  FileText,
  HardHat,
} from 'lucide-react';
import { useUserStore, roleNames } from '@/store/useUserStore';
import { useInspectionStore } from '@/store/useInspectionStore';
import { UserRole } from '@/types';
import { Badge } from '@/components/ui/Badge';

const menuItems = [
  { path: '/', label: '工作台', icon: LayoutDashboard },
  { path: '/inspections', label: '出场验机', icon: ClipboardList },
];

const roleOptions: { value: UserRole; label: string; icon: any }[] = [
  { value: 'manager', label: '租赁经理', icon: HardHat },
  { value: 'dispatcher', label: '调度员', icon: Truck },
  { value: 'technician', label: '维修师傅', icon: Wrench },
  { value: 'driver', label: '司机', icon: FileText },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation();
  const { currentRole, currentUser, setRole } = useUserStore();
  const { getTodoCount } = useInspectionStore();
  const todoCount = getTodoCount(currentRole);

  return (
    <aside
      className={cn(
        'w-64 bg-slate-900 text-slate-100 flex flex-col h-screen sticky top-0',
        className
      )}
    >
      <div className="h-16 flex items-center px-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <HardHat size={20} />
          </div>
          <div>
            <div className="font-semibold text-sm">工程机械租赁</div>
            <div className="text-xs text-slate-400">验机签收系统</div>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-slate-800">
        <div className="text-xs text-slate-400 mb-2">当前身份</div>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center">
            {React.createElement(roleOptions.find((r) => r.value === currentRole)?.icon || HardHat, { size: 16, className: 'text-blue-400' })}
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium">{currentUser.name}</div>
            <div className="text-xs text-slate-400">{roleNames[currentRole]}</div>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-slate-800">
        <div className="text-xs text-slate-400 mb-2">切换角色</div>
        <div className="grid grid-cols-2 gap-1.5">
          {roleOptions.map((role) => (
            <button
              key={role.value}
              onClick={() => setRole(role.value)}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs transition-colors',
                currentRole === role.value
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              )}
            >
              <role.icon size={12} />
              {role.label}
            </button>
          ))}
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                isActive
                  ? 'bg-blue-600 text-white font-medium shadow-lg shadow-blue-600/20'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {item.path === '/inspections' && todoCount > 0 && (
                <Badge className="ml-auto" variant="danger">
                  {todoCount}
                </Badge>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-slate-800">
        <button className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
          <Settings size={18} />
          <span>系统设置</span>
        </button>
      </div>
    </aside>
  );
}
