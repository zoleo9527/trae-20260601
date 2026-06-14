import { User, GraduationCap, Users } from 'lucide-react';
import { useUserStore } from '../store';
import type { UserRole } from '../types';

const roleConfig: Record<UserRole, { label: string; icon: React.ReactNode; color: string }> = {
  admin: { label: '教务老师', icon: <User className="w-4 h-4" />, color: 'bg-purple-100 text-purple-700 border-purple-200' },
  teaching: { label: '任课老师', icon: <GraduationCap className="w-4 h-4" />, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  consultant: { label: '家长顾问', icon: <Users className="w-4 h-4" />, color: 'bg-green-100 text-green-700 border-green-200' },
};

export function RoleSwitcher() {
  const { currentRole, setCurrentRole } = useUserStore();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">当前角色:</span>
      <div className="flex gap-2">
        {(Object.keys(roleConfig) as UserRole[]).map((role) => {
          const config = roleConfig[role];
          const isActive = currentRole === role;
          return (
            <button
              key={role}
              onClick={() => setCurrentRole(role)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                isActive 
                  ? config.color + ' shadow-sm' 
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {config.icon}
              {config.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}