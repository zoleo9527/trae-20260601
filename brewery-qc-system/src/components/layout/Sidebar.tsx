import { NavLink, useNavigate } from 'react-router-dom';
import { ClipboardList, FlaskConical, CheckCircle2, FileBarChart, Home, AlertTriangle } from 'lucide-react';
import type { UserRole } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';
import { useBatchStore } from '@/store/useBatchStore';
import { ROLE_ENTRIES } from '@/types';

interface SidebarProps {
  role: UserRole;
}

const roleNavItems: Record<UserRole, Array<{
  path: string;
  label: string;
  icon: React.ReactNode;
  isAction?: boolean;
  badge?: 'abnormal' | 'pending' | 'testing';
}>> = {
  brewer: [
    { path: '/brewer', label: '工作台概览', icon: <Home className="w-5 h-5" /> },
    { path: '/brewer/batches', label: '发起品控检测', icon: <ClipboardList className="w-5 h-5" />, isAction: true, badge: 'pending' },
    { path: '/records', label: '交班记录', icon: <FileBarChart className="w-5 h-5" /> },
  ],
  packaging: [
    { path: '/packaging', label: '品控检测工作台', icon: <FlaskConical className="w-5 h-5" />, isAction: true, badge: 'testing' },
    { path: '/packaging/testing', label: '待检测批次', icon: <ClipboardList className="w-5 h-5" />, badge: 'pending' },
    { path: '/records', label: '交班记录', icon: <FileBarChart className="w-5 h-5" /> },
  ],
  sales: [
    { path: '/sales', label: '放行判断中心', icon: <CheckCircle2 className="w-5 h-5" />, isAction: true, badge: 'abnormal' },
    { path: '/sales/pending', label: '待放行批次', icon: <ClipboardList className="w-5 h-5" /> },
    { path: '/records', label: '交班记录', icon: <FileBarChart className="w-5 h-5" /> },
  ],
};

export function Sidebar({ role }: SidebarProps) {
  const navItems = roleNavItems[role];
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const batches = useBatchStore((state) => state.batches);

  const abnormalCount = batches.filter((b) => b.currentStatus === 'TEST_ABNORMAL').length;
  const pendingCount = batches.filter((b) => b.currentStatus === 'PENDING_TEST').length;
  const testingCount = batches.filter((b) => b.currentStatus === 'TESTING').length;

  const badgeCounts: Record<string, number> = {
    abnormal: abnormalCount,
    pending: pendingCount,
    testing: testingCount,
  };

  const handleBackToRoleSelect = () => {
    logout();
    navigate('/');
  };

  return (
    <aside className="w-64 bg-white border-r border-neutral-200 min-h-screen flex flex-col">
      <div className="p-4 flex-1">
        <button
          onClick={handleBackToRoleSelect}
          className="w-full text-left px-4 py-3 rounded-lg bg-amber-50 text-amber-900 hover:bg-amber-100 transition-colors mb-6"
        >
          <span className="text-sm">← 返回角色选择</span>
        </button>

        <div className="mb-4 px-4 py-3 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-xs font-semibold text-blue-800 mb-1">当前角色入口</p>
          <p className="text-sm font-bold text-blue-700">{ROLE_ENTRIES[role].label}</p>
          <p className="text-xs text-blue-600 mt-1">{ROLE_ENTRIES[role].description}</p>
        </div>

        {abnormalCount > 0 && (
          <div className="mb-4 px-3 py-2 bg-red-50 rounded-lg border border-red-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 animate-pulse" />
            <span className="text-xs text-red-700 font-medium">{abnormalCount} 个异常批次</span>
          </div>
        )}

        <nav className="space-y-1">
          {navItems.map((item) => {
            const badgeCount = item.badge ? badgeCounts[item.badge] || 0 : 0;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/brewer' || item.path === '/packaging' || item.path === '/sales'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? item.isAction
                        ? 'bg-amber-100 text-amber-900 font-medium shadow-sm'
                        : 'bg-amber-100 text-amber-900 font-medium'
                      : item.isAction
                      ? 'bg-amber-50/50 text-amber-900 hover:bg-amber-100 font-medium'
                      : 'text-neutral-600 hover:bg-neutral-100'
                  }`
                }
              >
                {item.icon}
                <span className="text-sm flex-1">{item.label}</span>
                {badgeCount > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    item.badge === 'abnormal' ? 'bg-warning-orange text-white' : 'bg-neutral-200 text-neutral-700'
                  }`}>
                    {badgeCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-neutral-200">
        <div className="bg-neutral-50 rounded-lg p-4">
          <p className="text-xs text-neutral-500 mb-2">暂未实现的集成点</p>
          <ul className="text-xs text-neutral-400 space-y-1">
            <li>• 发酵罐记录系统 API</li>
            <li>• 配方管理系统对接</li>
            <li>• 经销商订货群同步</li>
          </ul>
        </div>
      </div>
    </aside>
  );
}
