import { Users, ClipboardList, Phone, User, Tag, FileCheck, FileText } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { UserRole } from '@/types';
import { cn, getRoleText } from '@/lib/utils';

const roleConfig = [
  { role: 'store_manager' as UserRole, icon: Tag, label: '店长', color: 'bg-cyan-500', description: '临期商品处理、提交下架复核' },
  { role: 'supervisor' as UserRole, icon: FileCheck, label: '督导', color: 'bg-blue-500', description: '下架复核初审、门店巡检' },
  { role: 'product_specialist' as UserRole, icon: FileText, label: '商品专员', color: 'bg-violet-500', description: '下架复核终审、商品管理' },
  { role: 'station_clerk' as UserRole, icon: ClipboardList, label: '站点文员', color: 'bg-blue-500', description: '管理押金核对、数据统计' },
  { role: 'delivery_person' as UserRole, icon: Users, label: '配送员', color: 'bg-green-500', description: '空瓶回收、运回站点' },
  { role: 'customer_service' as UserRole, icon: Phone, label: '客服', color: 'bg-purple-500', description: '处理争议、客户沟通' },
];

interface RoleSelectorProps {
  compact?: boolean;
}

export function RoleSelector({ compact = false }: RoleSelectorProps) {
  const { currentUser, setCurrentUserRole } = useAppStore();

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <User className="w-4 h-4 text-gray-500" />
        <select
          value={currentUser?.role || ''}
          onChange={(e) => setCurrentUserRole(e.target.value as UserRole)}
          className="text-sm border-gray-200 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          {roleConfig.map(r => (
            <option key={r.role} value={r.role}>{getRoleText(r.role)}</option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">选择角色入口</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roleConfig.map(({ role, icon: Icon, label, color, description }) => (
          <button
            key={role}
            onClick={() => setCurrentUserRole(role)}
            className={cn(
              'p-4 rounded-lg border-2 text-left transition-all',
              currentUser?.role === role
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            )}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', color)}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <span className="font-medium text-gray-900">{label}</span>
              {currentUser?.role === role && (
                <span className="ml-auto text-xs bg-blue-500 text-white px-2 py-0.5 rounded">当前</span>
              )}
            </div>
            <p className="text-sm text-gray-500">{description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
