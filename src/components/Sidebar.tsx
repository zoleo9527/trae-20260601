import { useAppStore } from '@/store/useAppStore';
import { ROLE_LABELS, type UserRole } from '@/types';
import { LayoutDashboard, BedDouble, HeartPulse, Bell, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocation, useNavigate } from 'react-router-dom';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: '工作台' },
  { path: '/beds', icon: BedDouble, label: '床位安排' },
  { path: '/nursing-levels', icon: HeartPulse, label: '护理等级' },
];

const roles: { key: UserRole; label: string; color: string }[] = [
  { key: 'nursing_supervisor', label: ROLE_LABELS.nursing_supervisor, color: 'bg-indigo-500' },
  { key: 'care_worker', label: ROLE_LABELS.care_worker, color: 'bg-emerald-500' },
  { key: 'social_worker', label: ROLE_LABELS.social_worker, color: 'bg-amber-500' },
];

export default function Sidebar() {
  const { currentRole, setRole, notifications } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <aside className="w-56 bg-slate-900 text-slate-100 flex flex-col min-h-screen shrink-0">
      <div className="px-4 py-5 border-b border-slate-700/60">
        <h1 className="text-base font-bold tracking-wide text-white">养老护理院</h1>
        <p className="text-[11px] text-slate-400 mt-0.5">床位安排与护理等级</p>
      </div>

      <div className="px-3 py-3 border-b border-slate-700/60">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 px-1">当前角色</p>
        <div className="space-y-1">
          {roles.map((r) => (
            <button
              key={r.key}
              onClick={() => setRole(r.key)}
              className={cn(
                'w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs transition-colors',
                currentRole === r.key
                  ? 'bg-slate-700/80 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              )}
            >
              <span className={cn('w-2 h-2 rounded-full shrink-0', r.color)} />
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-0.5">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 px-1">导航</p>
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'w-full flex items-center gap-2.5 px-2.5 py-2 rounded text-[13px] transition-colors',
                active
                  ? 'bg-slate-700/80 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              )}
            >
              <item.icon size={16} />
              {item.label}
              {item.path === '/' && unreadCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-slate-700/60">
        <button
          onClick={() => {
            useAppStore.getState().resetData();
            window.location.reload();
          }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors"
        >
          <RotateCcw size={13} />
          重置数据
        </button>
      </div>
    </aside>
  );
}
