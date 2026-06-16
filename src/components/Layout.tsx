import React from 'react';
import { LayoutDashboard, FileText, Calendar, Users, User } from 'lucide-react';
import { useStore } from '../store';
import { ROLE_MAP } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, onPageChange }) => {
  const { currentUser, users, setCurrentUser } = useStore();

  const menuItems = [
    { key: 'dashboard', label: '工作台', icon: LayoutDashboard },
    { key: 'fabric-reservation', label: '面料预留', icon: FileText },
    { key: 'pattern-scheduling', label: '打版排期', icon: Calendar },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-slate-800 text-white flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold">服装定制管理</h1>
          <p className="text-slate-400 text-sm mt-1">面料预留与打版排期</p>
        </div>
        
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = currentPage === item.key;
              return (
                <li key={item.key}>
                  <button
                    onClick={() => onPageChange(item.key)}
                    className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-blue-600 text-white' 
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-400">当前用户</span>
            <span className="text-sm bg-blue-600 px-2 py-1 rounded">{ROLE_MAP[currentUser.role]}</span>
          </div>
          <select
            value={currentUser.id}
            onChange={(e) => {
              const user = users.find(u => u.id === e.target.value);
              if (user) setCurrentUser(user);
            }}
            className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 text-sm border-none focus:ring-2 focus:ring-blue-500"
          >
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.name} ({ROLE_MAP[user.role]})
              </option>
            ))}
          </select>
        </div>
      </aside>
      
      <main className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              {menuItems.find(item => item.key === currentPage)?.label || '工作台'}
            </h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-5 h-5" />
                <span>{currentUser.name}</span>
              </div>
            </div>
          </div>
        </header>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;