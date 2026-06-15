import { useAppStore } from '../store';
import { Lock, AlertTriangle, Clock, CheckCircle, XCircle, ChevronRight, User, Phone, MapPin, Truck } from 'lucide-react';

interface ColorLockListProps {
  onSelect?: (id: string) => void;
  showAll?: boolean;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  pending: { label: '待处理', color: 'text-amber-600', bgColor: 'bg-amber-100', icon: Clock },
  locked: { label: '已锁定', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Lock },
  reserved: { label: '已预留', color: 'text-purple-600', bgColor: 'bg-purple-100', icon: CheckCircle },
  shipped: { label: '已发货', color: 'text-cyan-600', bgColor: 'bg-cyan-100', icon: Truck },
  completed: { label: '已完成', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle },
  cancelled: { label: '已取消', color: 'text-red-600', bgColor: 'bg-red-100', icon: XCircle },
};

export default function ColorLockList({ onSelect, showAll = false }: ColorLockListProps) {
  const colorLocks = useAppStore((state) => state.colorLocks);
  const currentUser = useAppStore((state) => state.currentUser);

  const filteredLocks = showAll 
    ? colorLocks 
    : colorLocks.filter(l => l.status !== 'completed' && l.status !== 'cancelled');

  const sortedLocks = [...filteredLocks].sort((a, b) => {
    const statusOrder = { pending: 0, locked: 1, reserved: 2, shipped: 3, completed: 4, cancelled: 5 };
    return (statusOrder[a.status] || 5) - (statusOrder[b.status] || 5);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">
          {showAll ? '历史记录' : '色号锁定列表'}
        </h3>
        <span className="text-sm text-slate-500">共 {sortedLocks.length} 条记录</span>
      </div>

      <div className="grid gap-4">
        {sortedLocks.map((lock) => {
          const status = statusConfig[lock.status];
          const StatusIcon = status.icon;
          
          return (
            <div 
              key={lock.id}
              onClick={() => onSelect?.(lock.id)}
              className={`bg-white rounded-xl border transition-all duration-200 hover:shadow-md ${
                lock.responsibilityFlag ? 'border-amber-200 bg-amber-50/50' : 'border-slate-200'
              } ${onSelect ? 'cursor-pointer hover:border-amber-300' : ''}`}
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-xl flex items-center justify-center">
                      <Lock className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">{lock.colorNo}</span>
                        <span className="text-slate-500">{lock.colorName}</span>
                      </div>
                      <p className="text-sm text-slate-500">{lock.productName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {lock.responsibilityFlag && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
                        <AlertTriangle className="w-3 h-3" />
                        责任不清
                      </span>
                    )}
                    <span className={`flex items-center gap-1 px-3 py-1 ${status.bgColor} ${status.color} text-sm rounded-full`}>
                      <StatusIcon className="w-4 h-4" />
                      {status.label}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">{lock.customerName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">{lock.customerPhone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600 truncate">{lock.projectName}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-slate-400">数量：</span>
                    <span className="font-medium text-slate-700">{lock.quantity} 片</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>导购：{lock.salesmanName}</span>
                    {lock.designerName && <span>设计师：{lock.designerName}</span>}
                    <span>创建：{lock.createdAt}</span>
                  </div>
                  {onSelect && (
                    <button className="flex items-center gap-1 text-amber-600 hover:text-amber-700 text-sm font-medium">
                      查看详情
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {sortedLocks.length === 0 && (
        <div className="text-center py-12">
          <Lock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">暂无记录</p>
        </div>
      )}
    </div>
  );
}
