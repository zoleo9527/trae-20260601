import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Download, 
  Users,
  Menu,
  X,
  RefreshCw,
  ShoppingBag
} from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ROLE_LABELS } from '@/types';
import type { Role } from '@/types';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const currentRole = useAppStore(state => state.currentRole);
  const setCurrentRole = useAppStore(state => state.setCurrentRole);
  const { promotions, getPendingPromotions } = useAppStore();

  const pendingCount = getPendingPromotions().length;
  const salesReviewCount = promotions.filter(p => 
    p.status === 'salesPending' || (p.status === 'active' && !p.salesData)
  ).length;

  const navItems = [
    { path: '/', label: '工作台', icon: LayoutDashboard, badge: pendingCount > 0 ? pendingCount : null },
    { path: '/promotion/new', label: '新建促销', icon: PlusCircle, badge: null },
    { path: '/io', label: '导入导出', icon: Download, badge: null },
  ];

  const roles: Role[] = ['counterManager', 'floorSupervisor', 'brandSupervisor'];

  const isSalesPage = location.pathname.startsWith('/sales');
  const isPromotionPage = location.pathname.startsWith('/promotion/') && !location.pathname.endsWith('/new');

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside 
        className={`${
          sidebarOpen ? 'w-64' : 'w-16'
        } bg-navy-500 text-white transition-all duration-300 flex flex-col shrink-0`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-navy-600">
          {sidebarOpen && (
            <h1 className="font-serif text-lg font-bold text-amber-400 whitespace-nowrap">
              百货专柜工作面
            </h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-navy-600 rounded-md transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-4 py-3 transition-all duration-200 ${
                  isActive 
                    ? 'bg-navy-600 border-r-4 border-amber-500 text-white' 
                    : 'text-navy-100 hover:bg-navy-600 hover:text-white'
                }`}
              >
                <div className="flex items-center">
                  <Icon size={20} className="shrink-0" />
                  {sidebarOpen && (
                    <span className="ml-3 whitespace-nowrap">{item.label}</span>
                  )}
                </div>
                {sidebarOpen && item.badge && (
                  <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {sidebarOpen && (
          <div className="p-4 border-t border-navy-600">
            <div className="flex items-center gap-2 mb-3">
              <Users size={16} className="text-navy-200" />
              <span className="text-sm text-navy-200">当前角色</span>
            </div>
            <div className="space-y-2">
              {roles.map((role) => (
                <button
                  key={role}
                  onClick={() => setCurrentRole(role)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                    currentRole === role
                      ? 'bg-amber-500 text-white font-medium'
                      : 'text-navy-100 hover:bg-navy-600'
                  }`}
                >
                  {ROLE_LABELS[role]}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-navy-300">
              切换角色可体验不同环节的处理流程
            </p>
          </div>
        )}
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="font-serif text-xl font-semibold text-navy-500">
              {getPageTitle(location.pathname)}
            </h2>
            {(isPromotionPage || isSalesPage) && (
              <div className="flex items-center gap-1 pl-4 border-l border-slate-200">
                {isPromotionPage && (
                  <button
                    onClick={() => {
                      const id = location.pathname.split('/').pop();
                      if (id) navigate(`/sales/${id}`);
                    }}
                    className="btn btn-secondary text-sm gap-1.5 py-1.5 px-3"
                  >
                    <ShoppingBag size={14} />
                    销售核对
                    {salesReviewCount > 0 && (
                      <span className="bg-purple-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">
                        {salesReviewCount}
                      </span>
                    )}
                  </button>
                )}
                {isSalesPage && (
                  <button
                    onClick={() => {
                      const parts = location.pathname.split('/');
                      const id = parts.length > 2 ? parts[2] : null;
                      if (id) navigate(`/promotion/${id}`);
                      else navigate('/');
                    }}
                    className="btn btn-secondary text-sm gap-1.5 py-1.5 px-3"
                  >
                    <RefreshCw size={14} />
                    促销活动
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {salesReviewCount > 0 && !isSalesPage && (
              <button
                onClick={() => navigate('/sales')}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
              >
                <ShoppingBag size={14} />
                {salesReviewCount} 单待核对
              </button>
            )}
            <span className={`badge role-badge-${currentRole}`}>
              {ROLE_LABELS[currentRole]}视角
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

function getPageTitle(path: string): string {
  if (path === '/') return '工作台';
  if (path.startsWith('/promotion/new')) return '新建促销活动';
  if (path.startsWith('/promotion/')) return '促销活动处理';
  if (path.startsWith('/sales')) return '销售核对回看';
  if (path === '/io') return '导入导出';
  return '百货专柜工作面';
}
