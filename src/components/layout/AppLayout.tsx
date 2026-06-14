import React from 'react';
import {
  FileText,
  PhoneCall,
  Home,
  Settings,
  AlertTriangle,
  User,
  ChevronDown,
  Bell,
  RefreshCw,
  LogOut,
  Building2,
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '@/store/AppContext';
import { ROLE_LABEL } from '@/types';
import { cn, timeAgo } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Label, Select } from '@/components/ui/Form';

const navItems = [
  { to: '/', label: '工作台', icon: Home },
  { to: '/complaints', label: '投诉记录', icon: FileText },
  { to: '/visits', label: '回访处理', icon: PhoneCall },
];

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    currentUser,
    users,
    switchUser,
    notifications,
    markNotificationRead,
    resetAllData,
  } = useApp();
  const navigate = useNavigate();
  const [roleMenu, setRoleMenu] = React.useState(false);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [resetOpen, setResetOpen] = React.useState(false);

  const unread = notifications.filter((n) => !n.read).length;

  const handleReset = () => {
    resetAllData();
    setResetOpen(false);
  };

  return (
    <div className="flex h-full min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-bank-600 text-white">
            <Building2 size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-900">朝阳支行</span>
            <span className="text-xs text-slate-500">投诉与回访管理</span>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-bank-50 text-bank-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                )
              }
            >
              <it.icon size={18} />
              <span>{it.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-3">
          <button
            onClick={() => setResetOpen(true)}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw size={18} />
            <span>重置演示数据</span>
          </button>
          <div className="mt-1">
            <button
              onClick={() => setRoleMenu((v) => !v)}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              <Settings size={18} />
              <span>切换当前角色</span>
              <ChevronDown size={16} className="ml-auto" />
            </button>
            {roleMenu && (
              <div className="mt-1 space-y-1 rounded-md border border-slate-100 bg-slate-50 p-2">
                {users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      switchUser(u.id);
                      setRoleMenu(false);
                    }}
                    className={cn(
                      'flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs',
                      currentUser.id === u.id
                        ? 'bg-bank-100 text-bank-700'
                        : 'text-slate-600 hover:bg-white',
                    )}
                  >
                    <span className="font-medium">{u.name}</span>
                    <span className="text-slate-400">{ROLE_LABEL[u.role]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
          <div>
            <span className="text-sm font-medium text-slate-900">银行网点 · 投诉与回访处理平台</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
              >
                <Bell size={20} />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
                    {unread}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-11 z-20 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
                    <span className="text-sm font-medium">消息中心</span>
                    {unread > 0 && (
                      <span className="text-xs text-bank-600">{unread} 条未读</span>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 && (
                      <div className="px-4 py-8 text-center text-sm text-slate-400">暂无消息</div>
                    )}
                    {notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => {
                          markNotificationRead(n.id);
                          setNotifOpen(false);
                          if (n.linkTo) navigate(n.linkTo);
                        }}
                        className={cn(
                          'flex w-full items-start gap-3 border-b border-slate-50 px-4 py-3 text-left hover:bg-slate-50',
                          !n.read && 'bg-bank-50/40',
                        )}
                      >
                        <div
                          className={cn(
                            'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                            n.type === 'danger' && 'bg-red-100 text-red-600',
                            n.type === 'warning' && 'bg-amber-100 text-amber-600',
                            n.type === 'info' && 'bg-sky-100 text-sky-600',
                            n.type === 'success' && 'bg-emerald-100 text-emerald-600',
                          )}
                        >
                          <AlertTriangle size={14} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-800">{n.title}</span>
                            {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-bank-500" />}
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{n.message}</p>
                          <div className="mt-1 text-[11px] text-slate-400">{timeAgo(n.createdAt)}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2.5 rounded-full bg-slate-100 py-1 pl-1 pr-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-bank-600 text-white">
                <User size={14} />
              </div>
              <div className="text-xs">
                <div className="font-medium text-slate-800">{currentUser.name}</div>
                <div className="text-slate-500">{ROLE_LABEL[currentUser.role]}</div>
              </div>
              <LogOut size={14} className="ml-1 text-slate-400" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>

      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title="重置演示数据">
        <p className="text-sm text-slate-600">
          确定要把所有投诉和回访数据恢复为初始样例吗？当前编辑的内容会丢失。
        </p>
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => setResetOpen(false)}>取消</Button>
          <Button variant="danger" onClick={handleReset}>确认重置</Button>
        </div>
      </Modal>

      <div className="hidden">
        <Badge tone="primary">x</Badge>
        <Label>_</Label>
        <Select />
      </div>
    </div>
  );
};
