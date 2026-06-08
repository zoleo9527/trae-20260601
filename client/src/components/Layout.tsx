import { LogOut, ClipboardList } from 'lucide-react';
import type { User, Role } from '../types';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
}

const ROLE_LABELS: Record<Role, string> = {
  operator: '计调',
  guide: '导游',
  fleet: '车队调度',
  supervisor: '主管',
};

const ROLE_COLORS: Record<Role, string> = {
  operator: 'bg-blue-100 text-blue-700',
  guide: 'bg-emerald-100 text-emerald-700',
  fleet: 'bg-amber-100 text-amber-700',
  supervisor: 'bg-purple-100 text-purple-700',
};

export default function Layout({ user, onLogout, children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shrink-0">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-slate-600" />
          <h1 className="font-semibold text-slate-800 text-lg">投诉登记与补偿跟进</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600">{user.name}</span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLORS[user.role]}`}>
            {ROLE_LABELS[user.role]}
          </span>
          <button
            onClick={onLogout}
            className="ml-2 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
            title="退出登录"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
