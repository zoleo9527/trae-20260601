import { UserRole } from '../types';
import { getRoleLabel } from '../utils';

interface RoleSelectorProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export const RoleSelector = ({ currentRole, onRoleChange }: RoleSelectorProps) => {
  const roles = [UserRole.ADMIN, UserRole.TEACHER, UserRole.CONSULTANT];
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <h3 className="text-sm font-medium text-gray-700 mb-3">角色切换</h3>
      <div className="flex gap-3">
        {roles.map((role) => (
          <button
            key={role}
            onClick={() => onRoleChange(role)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentRole === role
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {getRoleLabel(role)}
          </button>
        ))}
      </div>
    </div>
  );
};
