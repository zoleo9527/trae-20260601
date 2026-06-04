import { Bell, User, ChevronDown } from 'lucide-react';
import { useSurgeryStore } from '@/store/useSurgeryStore';
import { roleLabels } from '@/utils/status';
import { useState } from 'react';

export default function Header() {
  const { currentRole, setCurrentRole, exceptions } = useSurgeryStore();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const roles = [
    { id: 'admin', label: '管理员' },
    { id: 'doctor', label: '主刀医生' },
    { id: 'nurse', label: '手术护士' },
    { id: 'followup', label: '随访专员' },
  ];

  const unreadExceptions = exceptions.filter((e) => e.status === 'pending').length;

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-800">手术管理系统</h2>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          {unreadExceptions > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
              {unreadExceptions}
            </span>
          )}
        </button>

        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-800">
                {roleLabels[currentRole]}
              </p>
              <p className="text-xs text-gray-500">切换角色</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => {
                    setCurrentRole(role.id as any);
                    setShowRoleMenu(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                    currentRole === role.id ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                  }`}
                >
                  {role.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
