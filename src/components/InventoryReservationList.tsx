import { useAppStore } from '../store';
import { Warehouse, AlertTriangle, Clock, CheckCircle, Truck, XCircle, ChevronRight, Package } from 'lucide-react';

interface InventoryReservationListProps {
  onSelect?: (id: string) => void;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  pending: { label: '待处理', color: 'text-amber-600', bgColor: 'bg-amber-100', icon: Clock },
  reserved: { label: '已预留', color: 'text-purple-600', bgColor: 'bg-purple-100', icon: CheckCircle },
  shipped: { label: '已发货', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Truck },
  completed: { label: '已完成', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle },
  cancelled: { label: '已取消', color: 'text-red-600', bgColor: 'bg-red-100', icon: XCircle },
};

export default function InventoryReservationList({ onSelect }: InventoryReservationListProps) {
  const reservations = useAppStore((state) => state.reservations);

  const sortedReservations = [...reservations].sort((a, b) => {
    const statusOrder = { pending: 0, reserved: 1, shipped: 2, completed: 3, cancelled: 4 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">库存预留列表</h3>
        <span className="text-sm text-slate-500">共 {sortedReservations.length} 条记录</span>
      </div>

      <div className="grid gap-4">
        {sortedReservations.map((reservation) => {
          const status = statusConfig[reservation.status];
          const StatusIcon = status.icon;
          
          return (
            <div 
              key={reservation.id}
              onClick={() => onSelect?.(reservation.id)}
              className={`bg-white rounded-xl border transition-all duration-200 hover:shadow-md ${
                reservation.responsibilityFlag ? 'border-amber-200 bg-amber-50/50' : 'border-slate-200'
              } ${onSelect ? 'cursor-pointer hover:border-purple-300' : ''}`}
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400/20 to-indigo-500/20 rounded-xl flex items-center justify-center">
                      <Warehouse className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">{reservation.id}</span>
                        <span className="text-slate-500">{reservation.colorNo}</span>
                      </div>
                      <p className="text-sm text-slate-500">{reservation.colorName} - {reservation.productName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {reservation.responsibilityFlag && (
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
                    <Package className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">预留数量：{reservation.reservedQuantity} 片</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Warehouse className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">{reservation.warehouseName}</span>
                  </div>
                  {reservation.actualQuantity !== undefined && (
                    <div className="flex items-center gap-2 text-sm">
                      <Truck className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">实发：{reservation.actualQuantity} 片</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400">关联锁定：</span>
                    <span className="font-medium text-slate-700">{reservation.colorLockId}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>创建：{reservation.createdAt}</span>
                    <span>更新：{reservation.updatedAt}</span>
                  </div>
                  {onSelect && (
                    <button className="flex items-center gap-1 text-purple-600 hover:text-purple-700 text-sm font-medium">
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

      {sortedReservations.length === 0 && (
        <div className="text-center py-12">
          <Warehouse className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">暂无库存预留记录</p>
        </div>
      )}
    </div>
  );
}
