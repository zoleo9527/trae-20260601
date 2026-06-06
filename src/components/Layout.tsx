import { NavLink, Outlet } from 'react-router-dom';
import { UserAvatar } from './UserAvatar';
import { RoleSwitcher } from './RoleSwitcher';
import { useStore } from '@/store';
import { FileText, Users, School } from 'lucide-react';

export function Layout() {
  const { currentUser } = useStore();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="h-16 flex items-center px-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <School className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-gray-900">食堂管理系统</span>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            <NavLink
              to="/refunds"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <FileText className="w-5 h-5" />
              退费申请管理
            </NavLink>
            <NavLink
              to="/visits"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <Users className="w-5 h-5" />
              家长回访管理
            </NavLink>
          </nav>

          <div className="p-4 border-t border-gray-200 space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="text-xs text-amber-700 font-medium mb-1">当前身份</div>
              <UserAvatar user={currentUser} size="sm" showName showRole />
            </div>
            <RoleSwitcher />
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto">
          <div className="p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
