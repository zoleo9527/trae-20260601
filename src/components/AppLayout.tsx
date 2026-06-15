import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import {
  LayoutDashboard,
  ClipboardList,
  Wrench,
  LogOut,
  User,
  ShieldAlert,
  Store,
  AlertTriangle,
} from 'lucide-react';
import { ROLE_LABEL, ROLE_DEFAULT_ENTRY } from '@shared/types';
import type { UserRole } from '@shared/types';

const roleColors: Record<UserRole, string> = {
  RECEPTION: 'bg-brass-600',
  TECHNICIAN: 'bg-ochre-700',
  MANAGER: 'bg-carbon-800',
};

const roleIcon: Record<UserRole, typeof User> = {
  RECEPTION: User,
  TECHNICIAN: Wrench,
  MANAGER: ShieldAlert,
};

function RoleBadge() {
  const { user } = useAuthStore();
  if (!user) return null;
  const Icon = roleIcon[user.role];
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-10 h-10 ${roleColors[user.role]} flex items-center justify-center text-white`}
      >
        <Icon size={20} strokeWidth={2} />
      </div>
      <div className="flex flex-col">
        <span className="font-mono text-sm font-semibold text-carbon-800">
          {user.name}
        </span>
        <span className="font-mono text-xs text-carbon-500 uppercase tracking-wider">
          {ROLE_LABEL[user.role]}
        </span>
      </div>
    </div>
  );
}

function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const roleNavItems: Record<UserRole, Array<{ path: string; label: string; icon: typeof User; highlight?: boolean; badge?: string; primary?: boolean }>> = {
    RECEPTION: [
      { path: '/orders', label: '全部工单', icon: ClipboardList, primary: true, badge: '默认' },
      { path: '/dashboard', label: '工作台', icon: LayoutDashboard },
    ],
    TECHNICIAN: [
      { path: ROLE_DEFAULT_ENTRY.TECHNICIAN.path, label: '待选型工单', icon: Wrench, primary: true, badge: '默认' },
      { path: '/dashboard', label: '工作台', icon: LayoutDashboard },
      { path: '/orders?status=IN_SELECTION', label: '选型中', icon: Wrench },
      { path: '/orders?status=QUOTE_REJECTED', label: '驳回重选', icon: AlertTriangle },
      { path: '/orders', label: '全部工单', icon: ClipboardList },
    ],
    MANAGER: [
      { path: ROLE_DEFAULT_ENTRY.MANAGER.path, label: '待审核报价', icon: ShieldAlert, primary: true, badge: '默认' },
      { path: '/dashboard', label: '工作台', icon: LayoutDashboard },
      { path: '/orders?status=QUOTE_REJECTED', label: '已驳回', icon: AlertTriangle },
      { path: '/orders?status=QUOTE_CONFIRMED', label: '已确认', icon: ClipboardList },
      { path: '/orders', label: '全部工单', icon: ClipboardList },
    ],
  };

  const navItems = user ? roleNavItems[user.role] : [];

  if (!user) return null;

  return (
    <aside className="w-60 min-h-screen bg-carbon-900 text-white flex flex-col">
      <div className="p-6 border-b border-carbon-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-ochre-700 flex items-center justify-center">
            <Store size={22} strokeWidth={2} />
          </div>
          <div>
            <div className="font-display text-2xl tracking-widest text-ochre-300">
              TIRE SHOP
            </div>
            <div className="font-mono text-[10px] text-carbon-400 uppercase tracking-widest">
              轮胎选型与报价系统
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-carbon-700">
        <RoleBadge />
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ path, label, icon: Icon, primary, badge }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/orders'}
            className={({ isActive }) =>
              `flex items-center justify-between gap-3 px-4 py-3 font-mono text-sm uppercase tracking-wider border-2 transition-colors ${
                isActive
                  ? 'bg-ochre-800 border-ochre-600 text-white'
                  : primary
                  ? 'border-ochre-900/40 bg-carbon-800/50 text-ochre-300 hover:bg-carbon-800 hover:text-white hover:border-ochre-700'
                  : 'border-transparent text-carbon-300 hover:bg-carbon-800 hover:text-white'
              }`
            }
          >
            <span className="flex items-center gap-3">
              <Icon size={18} strokeWidth={2} />
              {label}
            </span>
            {badge && (
              <span className="px-2 py-0.5 bg-ochre-700 text-white font-mono text-[10px] uppercase tracking-wider animate-pulse-slow">
                {badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-carbon-700">
        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="w-full flex items-center gap-3 px-4 py-3 font-mono text-sm uppercase tracking-wider border-2 border-carbon-600 text-carbon-300 hover:bg-red-800 hover:border-red-600 hover:text-white transition-colors"
        >
          <LogOut size={18} strokeWidth={2} />
          退出登录
        </button>
      </div>
    </aside>
  );
}

export default function AppLayout() {
  return (
    <div className="flex min-h-screen grain-bg">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-7xl mx-auto animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
