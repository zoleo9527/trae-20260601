import { Role } from '../types';

interface RoleSelectorProps {
  currentRole: Role;
  onRoleChange: (role: Role) => void;
}

const roles: Role[] = ['教务老师', '任课老师', '家长顾问'];

export function RoleSelector({ currentRole, onRoleChange }: RoleSelectorProps) {
  return (
    <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
      {roles.map((role) => (
        <button
          key={role}
          onClick={() => onRoleChange(role)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
            currentRole === role
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          {role}
        </button>
      ))}
    </div>
  );
}
