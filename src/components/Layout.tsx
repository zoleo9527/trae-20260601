import React from 'react';
import { Building2, Home, Settings, Bell, User } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-slate-800 text-white shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-blue-400" />
            <h1 className="text-lg font-semibold">短租公寓运营后台</h1>
          </div>
          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-1">
              <button className="px-3 py-1.5 text-sm bg-slate-700 rounded-sm flex items-center gap-1.5">
                <Home className="w-4 h-4" />
                房源管理
              </button>
              <button className="px-3 py-1.5 text-sm text-gray-300 hover:bg-slate-700 rounded-sm flex items-center gap-1.5 transition-colors">
                <Settings className="w-4 h-4" />
                保洁排班
              </button>
            </nav>
            <div className="flex items-center gap-2 border-l border-slate-600 pl-4">
              <button className="p-1.5 text-gray-300 hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <span className="text-sm">管家-陈姐</span>
              </div>
            </div>
          </div>
        </div>
      </header>
      <main className="p-4">{children}</main>
    </div>
  );
};
