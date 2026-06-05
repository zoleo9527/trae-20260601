import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Flame, Coffee, MessageSquareWarning, ScrollText, RefreshCw } from 'lucide-react';
import { useStore } from '@/store';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '仪表盘' },
  { to: '/roast-curves', icon: Flame, label: '烘焙曲线' },
  { to: '/cupping-scores', icon: Coffee, label: '杯测评分' },
  { to: '/complaints-inventory', icon: MessageSquareWarning, label: '客诉与库存' },
  { to: '/operation-logs', icon: ScrollText, label: '操作日志' },
];

export default function Layout() {
  const { resetData } = useStore();
  const navigate = useNavigate();

  const handleReset = async () => {
    if (confirm('确定要重置所有样例数据吗？此操作不可恢复。')) {
      await resetData();
      navigate('/');
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-16 bg-roast-brown flex flex-col items-center py-6 gap-2 shrink-0">
        <div className="w-10 h-10 rounded-full bg-roast-orange flex items-center justify-center mb-6">
          <Flame className="w-5 h-5 text-white" />
        </div>
        <nav className="flex flex-col gap-2 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? 'active' : 'text-white/60'}`
              }
              title={item.label}
            >
              <item.icon className="w-5 h-5" />
            </NavLink>
          ))}
        </nav>
        <button
          onClick={handleReset}
          className="sidebar-item text-white/40 hover:text-white/80"
          title="重置样例数据"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </aside>
      <main className="flex-1 overflow-auto bg-roast-cream">
        <Outlet />
      </main>
    </div>
  );
}
