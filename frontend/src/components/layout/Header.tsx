import React from 'react';
import { Bell, Settings, User } from 'lucide-react';
import { Badge } from '../common';
import { useNotificationStore } from '@/store';

export const Header: React.FC = () => {
  const { unreadCount, fetchNotifications } = useNotificationStore();

  React.useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <header className="bg-museum-primary text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-museum-accent rounded-lg flex items-center justify-center">
              <span className="text-museum-dark font-bold text-xl">M</span>
            </div>
            <div>
              <h1 className="text-xl font-display font-bold">博物馆社教管理系统</h1>
              <p className="text-xs text-blue-200">Museum Education Management</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              className="relative p-2 hover:bg-museum-secondary rounded-lg transition-colors"
              title="消息中心"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>

            <button
              className="p-2 hover:bg-museum-secondary rounded-lg transition-colors"
              title="设置"
            >
              <Settings className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 pl-4 border-l border-blue-700">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div className="text-sm">
                <p className="font-medium">张明</p>
                <p className="text-xs text-blue-200">社教老师</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
