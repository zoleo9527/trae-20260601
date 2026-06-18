import React from 'react';
import { useStore } from '@/store/useStore';
import { UserAvatar } from '@/components/common/UserAvatar';
import { Bell } from 'lucide-react';

export const Header: React.FC = () => {
  const currentUser = useStore((state) => state.currentUser);

  const roleLabels = {
    teacher: '社教老师',
    volunteer: '志愿者',
    supervisor: '活动主管',
  };

  return (
    <header className="bg-white border-b border-border h-16 flex items-center justify-between px-6">
      <div>
        <h2 className="text-lg font-semibold text-text-main">
          欢迎回来，{currentUser.name}
        </h2>
        <p className="text-sm text-text-muted">{roleLabels[currentUser.role]}</p>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5 text-text-main" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-border">
          <UserAvatar name={currentUser.name} size="md" />
          <div>
            <p className="text-sm font-medium text-text-main">{currentUser.name}</p>
            <p className="text-xs text-text-muted">{roleLabels[currentUser.role]}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
