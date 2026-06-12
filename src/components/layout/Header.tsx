import React from 'react';
import { ChevronDown, Bell, LogOut } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import type { UserRole } from '../../types';

const roles: UserRole[] = ['税务顾问', '项目经理', '客户财务'];

export const Header: React.FC = () => {
  const { user, switchRole, logout } = useAuthStore();
  
  if (!user) return null;
  
  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            欢迎回来，{user.name}
          </h2>
          <p className="text-sm text-gray-500">
            当前角色：{user.role}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="relative">
          <select
            value={user.role}
            onChange={(e) => switchRole(e.target.value as UserRole)}
            className="appearance-none bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {roles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>
        
        <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        
        <button 
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">退出</span>
        </button>
      </div>
    </header>
  );
};
