import React from 'react';
import { Bell, Search } from 'lucide-react';

interface HeaderProps {
  role: 'operator' | 'recruiter' | 'hr';
}

const Header: React.FC<HeaderProps> = ({ role }) => {
  const getTitle = () => {
    switch (role) {
      case 'operator':
        return '运营工作台';
      case 'recruiter':
        return '招聘顾问工作台';
      case 'hr':
        return '企业HR工作台';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-800">{getTitle()}</h2>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索..."
            className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
      </div>
    </header>
  );
};

export default Header;