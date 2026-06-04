import { Users, UserCog, Shield, HeartHandshake, User } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { UserRole } from '../types';
import { cn } from '../utils/cn';

const roleConfig: { role: UserRole; label: string; icon: typeof Users }[] = [
  { role: 'nurse_manager', label: '护理主管', icon: Shield },
  { role: 'primary_nurse', label: '责任护工', icon: UserCog },
  { role: 'social_worker', label: '社工', icon: HeartHandshake },
  { role: 'family', label: '家属', icon: User },
];

export function RoleSwitcher() {
  const { currentUser, switchRole } = useStore();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500 mr-2">切换角色：</span>
      {roleConfig.map(({ role, label, icon: Icon }) => (
        <button
          key={role}
          onClick={() => switchRole(role)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            currentUser?.role === role
              ? 'bg-primary-100 text-primary-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  );
}
