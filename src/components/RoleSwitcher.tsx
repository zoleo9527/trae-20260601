import { useStore, roleUserNames } from '../store/useStore';
import { ROLE_LABELS, type UserRole } from '../../shared/types';
import { User, UserCheck, Shield } from 'lucide-react';

const roles: { role: UserRole; icon: any }[] = [
  { role: 'reception', icon: User },
  { role: 'coach', icon: UserCheck },
  { role: 'manager', icon: Shield },
];

export default function RoleSwitcher() {
  const { currentRole, currentUserName, setRole } = useStore();

  return (
    <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm border border-gray-100">
      {roles.map(({ role, icon: Icon }) => (
        <button
          key={role}
          onClick={() => setRole(role, roleUserNames[role])}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
            currentRole === role
              ? 'bg-navy-900 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Icon size={16} />
          <span>{ROLE_LABELS[role]}</span>
        </button>
      ))}
      <div className="ml-2 pl-2 border-l border-gray-200">
        <span className="text-sm text-gray-500">当前用户:</span>
        <span className="text-sm font-medium text-navy-900 ml-1">{currentUserName}</span>
      </div>
    </div>
  );
}
