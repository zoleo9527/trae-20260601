import { ClipboardList, Truck, Users } from 'lucide-react';
import type { Role } from '../types';

interface RoleTabsProps {
  currentRole: Role;
  onRoleChange: (role: Role) => void;
}

const tabs: { role: Role; label: string; icon: typeof ClipboardList }[] = [
  { role: 'dispatcher', label: '计调', icon: ClipboardList },
  { role: 'guide', label: '导游', icon: Users },
  { role: 'fleet', label: '车队调度', icon: Truck },
];

export default function RoleTabs({ currentRole, onRoleChange }: RoleTabsProps) {
  return (
    <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
      {tabs.map(({ role, label, icon: Icon }) => {
        const active = currentRole === role;
        return (
          <button
            key={role}
            onClick={() => onRoleChange(role)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              active
                ? 'bg-white text-[#1e3a5f] shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
