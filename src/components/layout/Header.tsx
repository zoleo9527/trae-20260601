import { Bell, User, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { userRoleMap } from '@/utils/format';
import { UserRole } from '@/types';

export const Header = () => {
  const { currentUser, switchRole } = useStore();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const roles: UserRole[] = ['dispatcher', 'forklift_foreman', 'warehouse_clerk'];

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-4">
        <h1 className="text-base font-medium text-gray-800">月台业务工作台</h1>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-3 pl-4 border-l border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded transition-colors"
          >
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-800">{currentUser.name}</p>
              <p className="text-xs text-gray-500">
                {userRoleMap[currentUser.role as keyof typeof userRoleMap] || currentUser.role}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          {showRoleMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="py-1">
                <p className="px-4 py-2 text-xs font-medium text-gray-500">切换角色</p>
                {roles.map((role) => (
                  <button
                    key={role}
                    onClick={() => {
                      switchRole(role);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                      currentUser.role === role ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    {userRoleMap[role]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
