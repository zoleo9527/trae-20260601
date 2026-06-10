import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileCheck,
  Radio,
  AlertTriangle,
  Clock,
  X,
  FileCheck2,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useRecent } from '../../hooks/useRecent';
import { useOffline } from '../../hooks/useOffline';
import { timeAgo } from '../../utils/date';
import { getOperatorRoleLabel } from '../../data/mockData';
import type { RecentVisitType } from '../../data/types';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '仪表盘' },
  { to: '/audit', icon: FileCheck, label: '月租车审核' },
  { to: '/dispatch', icon: Radio, label: '权限下发' },
  { to: '/exception', icon: AlertTriangle, label: '异常处理' },
];

const getTypeIcon = (type: RecentVisitType) => {
  const icons = {
    audit: FileCheck,
    dispatch: Radio,
    exception: AlertTriangle,
  };
  return icons[type];
};

const getTypeLabel = (type: RecentVisitType) => {
  const labels: Record<RecentVisitType, string> = {
    audit: '审核',
    dispatch: '下发',
    exception: '工单',
  };
  return labels[type];
};

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { recentVisits, removeRecentVisit, addRecentVisit } = useRecent();
  const { isOffline, isForcedOffline, toggleOffline } = useOffline();
  const navigate = useNavigate();

  const handleRecentClick = (visit: typeof recentVisits[0]) => {
    addRecentVisit({
      type: visit.type,
      title: visit.title,
      subtitle: visit.subtitle,
      path: visit.path,
    });
    navigate(visit.path);
  };

  return (
    <aside
      className={cn(
        'h-full bg-slate-800 text-slate-200 flex flex-col transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="h-14 flex items-center px-4 border-b border-slate-700">
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
              <FileCheck2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">停车场管理</div>
              <div className="text-[10px] text-slate-400">月租审核 · 权限下发</div>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center mx-auto">
            <FileCheck2 className="w-5 h-5 text-white" />
          </div>
        )}
      </div>

      {isOffline && (
        <div
          className={cn(
            'px-3 py-2 bg-red-900/50 border-b border-red-800 text-xs flex items-center gap-2',
            collapsed && 'justify-center'
          )}
        >
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          {!collapsed && (
            <span className="text-red-200">
              {isForcedOffline ? '离线模式 (手动)' : '网络已断开'}
            </span>
          )}
        </div>
      )}

      <nav className="flex-1 py-4 overflow-y-auto scrollbar-thin">
        <ul className="space-y-0.5 px-2">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                    isActive
                      ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50',
                    collapsed && 'justify-center'
                  )
                }
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>

        {!collapsed && recentVisits.length > 0 && (
          <div className="mt-6 px-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5" />
                <span>最近打开</span>
              </div>
            </div>
            <ul className="space-y-1">
              {recentVisits.map((visit) => {
                const Icon = getTypeIcon(visit.type);
                return (
                  <li
                    key={visit.id}
                    className="group"
                  >
                    <div
                      onClick={() => handleRecentClick(visit)}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-700/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-slate-300 truncate">
                            {visit.title}
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1">
                            <span className="bg-slate-700 px-1 rounded">
                              {getTypeLabel(visit.type)}
                            </span>
                            <span>{timeAgo(visit.timestamp)}</span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRecentVisit(visit.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-600 rounded transition-all"
                        >
                          <X className="w-3 h-3 text-slate-500" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </nav>

      <div className="border-t border-slate-700 p-3">
        <button
          onClick={toggleOffline}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all',
            isForcedOffline
              ? 'bg-red-900/50 text-red-300 hover:bg-red-900/70'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50',
            collapsed && 'justify-center'
          )}
        >
          <span
            className={cn(
              'w-2 h-2 rounded-full',
              isForcedOffline ? 'bg-red-500' : 'bg-emerald-500'
            )}
          />
          {!collapsed && (
            <span>{isForcedOffline ? '退出离线模式' : '切换到离线模式'}</span>
          )}
        </button>

        {!collapsed && (
          <div className="mt-3 flex items-center gap-2 px-1">
            <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center text-xs font-bold text-orange-400">
              OP
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-white font-medium truncate">运营专员</div>
              <div className="text-[10px] text-slate-500">{getOperatorRoleLabel('operation')}</div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
