import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ClipboardCheck, Egg, LogOut, Bell } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { useAppStore } from '@/stores/app';
import NotificationPanel from '@/components/NotificationPanel';

const NAV_ITEMS = [
  { path: '/', label: '工作台', icon: LayoutDashboard },
  { path: '/inspection', label: '鸡舍巡检', icon: ClipboardCheck },
  { path: '/egg-records', label: '产蛋记录', icon: Egg },
];

const ROLE_LABELS: Record<string, string> = {
  feeder: '饲养员',
  sorter: '分拣员',
  manager: '场长',
};

const ROLE_COLORS: Record<string, string> = {
  feeder: 'bg-farm-orange',
  sorter: 'bg-farm-green',
  manager: 'bg-farm-red',
};

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { notificationPanelOpen, toggleNotificationPanel, closeNotificationPanel } = useAppStore();

  const pageTitle = NAV_ITEMS.find((n) => n.path === location.pathname)?.label || '蛋鸡养殖场';

  return (
    <div className="flex h-full bg-farm-dark">
      <aside className="w-56 bg-farm-darker border-r border-farm-border flex flex-col shrink-0">
        <div className="px-5 py-4 border-b border-farm-border">
          <h1 className="text-farm-orange font-bold text-lg tracking-wide">蛋鸡养殖场</h1>
          <p className="text-farm-muted text-xs mt-0.5">鸡舍巡检与产蛋记录</p>
        </div>
        <nav className="flex-1 py-3">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
                  isActive
                    ? 'bg-farm-orange/10 text-farm-orange border-r-2 border-farm-orange'
                    : 'text-farm-muted hover:text-farm-text hover:bg-farm-card'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-farm-border">
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="w-full flex items-center gap-2 text-farm-muted hover:text-farm-red text-sm transition-colors"
          >
            <LogOut size={16} />
            退出登录
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-farm-darker border-b border-farm-border flex items-center justify-between px-6 shrink-0">
          <h2 className="text-farm-text font-bold">{pageTitle}</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={toggleNotificationPanel}
                className="text-farm-muted hover:text-farm-text transition-colors relative"
              >
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-farm-red rounded-full text-[10px] text-white flex items-center justify-center font-mono">
                  3
                </span>
              </button>
              {notificationPanelOpen && (
                <NotificationPanel onClose={closeNotificationPanel} />
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className={`${ROLE_COLORS[user?.role || 'feeder']} text-white text-xs px-2 py-0.5 rounded`}>
                {ROLE_LABELS[user?.role || 'feeder']}
              </span>
              <span className="text-farm-text text-sm">{user?.name}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
