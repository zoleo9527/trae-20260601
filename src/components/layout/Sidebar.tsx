import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FilePlus,
  Building2,
  ClipboardList,
  Receipt,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import type { UserRole } from '@/types';

const ROLE_LABELS: Record<UserRole, string> = {
  consultant: '租赁顾问',
  manager: '运营经理',
  finance: '财务人员',
  customer: '企业客户',
};

const ROLE_ORDER: UserRole[] = ['consultant', 'manager', 'finance', 'customer'];

export default function Sidebar() {
  const location = useLocation();
  const currentRole = useAppStore((s) => s.currentRole);
  const setCurrentRole = useAppStore((s) => s.setCurrentRole);

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: '工作台' },
    { to: '/application/new', icon: FilePlus, label: '新建退租申请', accent: true },
  ];

  const isActive = (to: string) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  };

  return (
    <aside className="w-64 min-h-screen bg-gradient-to-b from-navy-800 to-navy-900 text-navy-100 flex flex-col animate-slide-in-left">
      <div className="px-6 py-6 border-b border-navy-700/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center shadow-navy-glow">
            <Building2 className="w-5 h-5 text-navy-900" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="font-serif text-base font-semibold text-white tracking-wide">退租清算系统</h1>
            <p className="text-xs text-navy-300 mt-0.5">写字楼租赁管理平台</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        <p className="text-xs text-navy-400 uppercase tracking-wider px-2 mb-2">演示角色切换</p>
        <div className="grid grid-cols-2 gap-1.5">
          {ROLE_ORDER.map((role) => (
            <button
              key={role}
              onClick={() => setCurrentRole(role)}
              className={`px-2 py-1.5 rounded text-xs font-medium transition-all duration-200 ${
                currentRole === role
                  ? 'bg-amber-400 text-navy-900 shadow-sm'
                  : 'bg-navy-700/40 text-navy-200 hover:bg-navy-700/70'
              }`}
            >
              {ROLE_LABELS[role]}
            </button>
          ))}
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label, accent }) => (
          <NavLink
            key={to}
            to={to}
            className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-all duration-200 group ${
              isActive(to)
                ? accent
                  ? 'bg-gradient-to-r from-coral-500 to-coral-400 text-white shadow-md'
                  : 'bg-navy-700/60 text-white'
                : accent
                ? 'text-coral-300 hover:bg-navy-700/40 hover:text-white'
                : 'text-navy-200 hover:bg-navy-700/40 hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" strokeWidth={2} />
            <span>{label}</span>
            {accent && isActive(to) && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white"></span>
            )}
          </NavLink>
        ))}

        <div className="mt-6 px-3">
          <p className="text-xs text-navy-500 uppercase tracking-wider mb-2">流程节点</p>
        </div>

        <div className="space-y-0.5 px-3">
          {[
            { icon: ClipboardList, label: '退场验收', step: 1 },
            { icon: Receipt, label: '费用明细', step: 2 },
            { icon: Users, label: '客户确认', step: 3 },
            { icon: CheckCircle2, label: '完结归档', step: 4 },
          ].map(({ icon: Icon, label, step }) => (
            <div
              key={step}
              className="flex items-center gap-2.5 py-2 text-xs text-navy-400"
            >
              <span className="w-4 h-4 rounded-full bg-navy-700/60 flex items-center justify-center text-[10px] font-mono text-navy-300">
                {step}
              </span>
              <Icon className="w-3.5 h-3.5" strokeWidth={2} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </nav>

      <div className="px-6 py-4 border-t border-navy-700/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-navy-500 to-navy-600 flex items-center justify-center text-xs font-medium text-white">
            {ROLE_LABELS[currentRole].charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{ROLE_LABELS[currentRole]}</p>
            <p className="text-xs text-navy-400">演示模式</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
