import { UserRole } from '@/data/types';
import { User, Wrench, Package, ClipboardList, History, Settings } from 'lucide-react';

interface SidebarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export default function Sidebar({ currentRole, onRoleChange }: SidebarProps) {
  const roleConfig = [
    { role: '客服' as UserRole, icon: User, label: '客服工作台' },
    { role: '维修工程师' as UserRole, icon: Wrench, label: '维修工程师' },
    { role: '配件管理员' as UserRole, icon: Package, label: '配件管理' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">家电售后管理</h1>
        <p className="text-sm text-gray-500 mt-1">返修投诉与回访处理</p>
      </div>
      
      <div className="p-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">角色切换</h2>
        <div className="space-y-1">
          {roleConfig.map(({ role, icon: Icon, label }) => (
            <button
              key={role}
              onClick={() => onRoleChange(role)}
              className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                currentRole === role
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">功能菜单</h2>
        <div className="space-y-1">
          <button className="w-full flex items-center px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
            <ClipboardList className="w-5 h-5 mr-3" />
            <span className="font-medium">工单管理</span>
          </button>
          <button className="w-full flex items-center px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
            <History className="w-5 h-5 mr-3" />
            <span className="font-medium">历史记录</span>
          </button>
          <button className="w-full flex items-center px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
            <Settings className="w-5 h-5 mr-3" />
            <span className="font-medium">系统设置</span>
          </button>
        </div>
      </div>
      
      <div className="mt-auto p-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-primary-600" />
          </div>
          <div className="ml-3">
            <p className="font-medium text-gray-800">{currentRole}</p>
            <p className="text-xs text-gray-500">在线</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
