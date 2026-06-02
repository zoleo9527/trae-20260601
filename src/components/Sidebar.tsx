import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, CalendarClock, UserCheck, Clock, FileText, AlertTriangle, Shield, Stethoscope, Users } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import type { UserRole } from '../types';

const navItems = [
  { path: '/dashboard', label: '工作台', icon: LayoutDashboard, roles: ['reception', 'counselor', 'supervisor'] as UserRole[] },
  { path: '/appointments', label: '预约管理', icon: CalendarClock, roles: ['reception', 'counselor'] as UserRole[] },
  { path: '/triage', label: '分诊', icon: UserCheck, roles: ['reception'] as UserRole[] },
  { path: '/schedule', label: '排班', icon: Clock, roles: ['reception', 'counselor'] as UserRole[] },
  { path: '/scales', label: '量表', icon: FileText, roles: ['reception', 'counselor'] as UserRole[] },
  { path: '/risk', label: '风险预警', icon: AlertTriangle, roles: ['supervisor'] as UserRole[] },
];

const roleConfig: Record<UserRole, { label: string; icon: typeof Users; color: string }> = {
  reception: { label: '接待', icon: Users, color: 'text-primary-600' },
  counselor: { label: '咨询师', icon: Stethoscope, color: 'text-emerald-600' },
  supervisor: { label: '督导', icon: Shield, color: 'text-amber-600' },
};

export function Sidebar() {
  const location = useLocation();
  const { currentUser, switchRole } = useUserStore();

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(currentUser.role)
  );

  const currentRoleConfig = roleConfig[currentUser.role];

  return (
    <aside className="w-60 bg-white border-r border-gray-100/80 h-screen flex flex-col fixed left-0 top-0">
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary-700 flex items-center justify-center">
            <Shield size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-text-primary">咨询工作台</h1>
            <p className="text-2xs text-text-tertiary">内部使用</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        <p className="px-4 py-2 text-2xs text-text-tertiary tracking-wider">导航</p>
        {filteredNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
            >
              <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="px-4 pb-4 pt-3 border-t border-gray-100/80">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center">
            <currentRoleConfig.icon size={18} className={currentRoleConfig.color} />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">{currentUser.name}</p>
            <p className="text-2xs text-text-tertiary">{currentRoleConfig.label}</p>
          </div>
        </div>

        <div>
          <p className="text-2xs text-text-tertiary px-2 mb-2">切换角色</p>
          <div className="space-y-0.5">
            {(['reception', 'counselor', 'supervisor'] as UserRole[]).map((role) => {
              const config = roleConfig[role];
              const Icon = config.icon;
              return (
                <button
                  key={role}
                  onClick={() => switchRole(role)}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-sm transition-colors ${
                    currentUser.role === role
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-text-secondary hover:bg-surface-hover'
                  }`}
                >
                  <Icon size={14} />
                  <span>{config.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
