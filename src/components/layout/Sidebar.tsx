import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileCheck, 
  ClipboardCheck, 
  List, 
  FileText,
  Users
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useWorkOrderStore } from '../../stores/workOrderStore';
import { cn } from '../../lib/utils';

const menuItems = {
  '税务顾问': [
    { path: '/dashboard', label: '我的待办', icon: LayoutDashboard },
    { path: '/policy-judge', label: '政策判断处理', icon: FileCheck },
    { path: '/work-orders', label: '全部记录', icon: List }
  ],
  '项目经理': [
    { path: '/dashboard', label: '我的待办', icon: LayoutDashboard },
    { path: '/approval', label: '方案审批', icon: ClipboardCheck },
    { path: '/work-orders', label: '全部记录', icon: List }
  ],
  '客户财务': [
    { path: '/dashboard', label: '我的待办', icon: LayoutDashboard },
    { path: '/sign-receipt', label: '方案回看', icon: FileText },
    { path: '/work-orders', label: '全部记录', icon: List }
  ]
};

export const Sidebar: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const workOrders = useWorkOrderStore(state => state.workOrders);
  
  if (!user) return null;
  
  const items = menuItems[user.role] || [];
  
  const getBadgeCount = (path: string): number => {
    if (path === '/dashboard') {
      if (user.role === '税务顾问') {
        return workOrders.filter(wo => wo.status === '待判断' || wo.status === '判断中').length;
      }
      if (user.role === '项目经理') {
        return workOrders.filter(wo => wo.status === '待审批').length;
      }
      if (user.role === '客户财务') {
        return workOrders.filter(wo => wo.status === '审批通过').length;
      }
    }
    return 0;
  };
  
  return (
    <aside className="w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white min-h-screen p-6 flex flex-col">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">税务咨询</h1>
            <p className="text-xs text-slate-400">政策判断与方案审批</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 space-y-2">
        {items.map(item => {
          const Icon = item.icon;
          const count = getBadgeCount(item.path);
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                  'hover:bg-slate-700/50 group relative',
                  isActive && 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                )
              }
            >
              <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="font-medium">{item.label}</span>
              {count > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                  {count}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>
      
      <div className="mt-auto pt-6 border-t border-slate-700">
        <div className="text-xs text-slate-500 text-center">
          <p>税务咨询机构工作台</p>
          <p className="mt-1">v1.0.0</p>
        </div>
      </div>
    </aside>
  );
};
