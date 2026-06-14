import { useAppStore } from '../store/appStore';
import { USER_ROLE_LABELS } from '../types';
import { getRoleLabel } from '../lib/utils';
import {
  Users,
  FileText,
  ListChecks,
  User,
  LayoutDashboard,
  FileCheck,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { currentUser, users } = useAppStore();

  const menuItems = [
    { id: 'dashboard', label: '工作台', icon: LayoutDashboard },
    { id: 'list', label: '咨询受理', icon: FileText },
    { id: 'documents', label: '资料清单', icon: FileCheck },
    { id: 'batch', label: '批量录入', icon: ListChecks },
    { id: 'users', label: '人员管理', icon: Users },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-full">
      <div className="p-4 border-b border-slate-700">
        <h1 className="text-xl font-bold">税务咨询管理</h1>
        <p className="text-sm text-slate-400 mt-1">咨询受理与资料清单</p>
      </div>

      <nav className="flex-1 py-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
              activeTab === item.id
                ? 'bg-slate-800 text-white border-l-4 border-blue-500'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700">
        {currentUser && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
              <User size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{currentUser.name}</p>
              <p className="text-xs text-slate-400">
                {USER_ROLE_LABELS[currentUser.role as keyof typeof USER_ROLE_LABELS]}
              </p>
            </div>
          </div>
        )}

        {users.length > 1 && currentUser && (
          <div className="mt-3">
            <select
              value={currentUser.id}
              onChange={(e) => {
                const user = users.find((u) => u.id === Number(e.target.value));
                if (user) useAppStore.getState().setCurrentUser(user);
              }}
              className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-sm"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({getRoleLabel(u.role as any)})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
