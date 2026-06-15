import { Bell, Search, ChevronDown, User } from 'lucide-react';
import { useUserStore, roleNames } from '@/store/useUserStore';

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const { currentUser, currentRole } = useUserStore();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 sticky top-0 z-10">
      <div className="flex-1">
        {title ? (
          <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">今天是</span>
            <span className="text-sm font-medium text-slate-700">
              {new Date().toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-64">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="全局搜索..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
        </button>

        <div className="flex items-center gap-2.5 pl-4 border-l border-slate-200">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-medium">
            {currentUser.name.charAt(0)}
          </div>
          <div className="hidden md:block">
            <div className="text-sm font-medium text-slate-700">{currentUser.name}</div>
            <div className="text-xs text-slate-400">{roleNames[currentRole]}</div>
          </div>
          <ChevronDown size={16} className="text-slate-400" />
        </div>
      </div>
    </header>
  );
}
