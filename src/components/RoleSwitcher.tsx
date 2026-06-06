import { useStore } from '@/store';
import { UserAvatar } from './UserAvatar';
import { ChevronDown, Users } from 'lucide-react';
import { useState } from 'react';

export function RoleSwitcher() {
  const { currentUser, users, actions } = useStore();
  const { setCurrentUser } = actions;
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        className="w-full flex items-center justify-between gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-500" />
          <span className="text-xs text-gray-500">切换身份</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
          <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-100">
            选择身份查看不同权限
          </div>
          {users.map((user) => (
            <button
              key={user.id}
              className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors ${
                currentUser.id === user.id ? 'bg-primary-50' : ''
              }`}
              onClick={() => {
                setCurrentUser(user);
                setIsOpen(false);
              }}
            >
              <UserAvatar user={user} size="sm" />
              <div className="text-left">
                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                <div className="text-xs text-gray-500">{user.role}</div>
              </div>
              {currentUser.id === user.id && (
                <div className="ml-auto w-2 h-2 bg-primary-500 rounded-full" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
