'use client';

import { useApp, defaultUsers } from '@/context/AppContext';
import type { Role } from '@/types';
import { roleLabels } from '@/data/mockData';

const roles: Role[] = ['manager', 'consultant', 'controller'];

export default function RoleSwitcher() {
  const { currentUser, setCurrentUser } = useApp();

  const handleRoleChange = (role: Role) => {
    setCurrentUser(defaultUsers[role]);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500 mr-2">当前角色：</span>
      <div className="flex rounded-lg bg-gray-100 p-1">
        {roles.map((role) => (
          <button
            key={role}
            onClick={() => handleRoleChange(role)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
              currentUser.role === role
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {roleLabels[role]}
          </button>
        ))}
      </div>
      <span className="text-sm text-gray-700 ml-2">
        ({currentUser.name})
      </span>
    </div>
  );
}
