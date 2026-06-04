import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/NotificationBell';
import { ROLE_LABELS } from '@/types';
import { useAppStore } from '@/store/useAppStore';

export default function Layout() {
  const { currentRole } = useAppStore();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-11 bg-white border-b border-slate-200 flex items-center justify-between px-5 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">当前身份</span>
            <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
              {ROLE_LABELS[currentRole]}
            </span>
          </div>
          <NotificationBell />
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
