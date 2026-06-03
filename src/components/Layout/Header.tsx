import { useState } from 'react';
import { User, ChevronDown, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { ROLE_LABELS, ROLE_COLORS, UserRoleType } from '@/types';
import { DEMO_USERS } from '@/utils/mock';

const Header = () => {
  const { currentUser, switchRole } = useAuthStore();
  const [showMenu, setShowMenu] = useState(false);
  
  if (!currentUser) return null;
  
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-800">工作台</h2>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${ROLE_COLORS[currentUser.role]}`}>
            {ROLE_LABELS[currentUser.role]}
          </span>
        </div>
      </div>
      
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center text-xl">
            {currentUser.avatar}
          </div>
          <div className="text-left">
            <p className="font-medium text-gray-800">{currentUser.name}</p>
            <p className="text-xs text-gray-500">演示账号</p>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>
        
        {showMenu && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-700">切换角色演示</p>
              <p className="text-xs text-gray-500">体验不同岗位的操作视角</p>
            </div>
            <div className="py-2">
              {DEMO_USERS.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    switchRole(user.role as UserRoleType);
                    setShowMenu(false);
                  }}
                  className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                    currentUser.id === user.id ? 'bg-sky-50' : ''
                  }`}
                >
                  <span className="text-2xl">{user.avatar}</span>
                  <div className="text-left">
                    <p className="font-medium text-gray-800">{user.name}</p>
                    <p className="text-xs text-gray-500">{ROLE_LABELS[user.role]}</p>
                  </div>
                  {currentUser.id === user.id && (
                    <div className="ml-auto w-2 h-2 bg-sky-500 rounded-full" />
                  )}
                </button>
              ))}
            </div>
            <div className="border-t border-gray-200 px-4 py-3">
              <button className="w-full flex items-center gap-2 text-gray-600 hover:text-gray-800">
                <LogOut className="w-4 h-4" />
                <span className="text-sm">退出登录</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
