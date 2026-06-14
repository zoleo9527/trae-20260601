import { Music, User } from 'lucide-react';
import { UserRole } from '../types';
import { getRoleLabel } from '../utils';

interface HeaderProps {
  currentRole: UserRole;
  userName: string;
}

export const Header = ({ currentRole, userName }: HeaderProps) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
              <Music className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">考级曲目与练习计划</h1>
              <p className="text-sm text-gray-500">音乐培训机构管理系统</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700 font-medium">{userName}</span>
              <span className="text-xs text-gray-500">({getRoleLabel(currentRole)})</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
