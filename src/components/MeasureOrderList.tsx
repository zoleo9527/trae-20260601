import { useAppStore } from '../store';
import { FileText, Clock, CheckCircle, MapPin, User, Calendar, Ruler } from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  pending: { label: '待量房', color: 'text-amber-600', bgColor: 'bg-amber-100', icon: Clock },
  measured: { label: '已量房', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: CheckCircle },
  completed: { label: '已完成', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle },
};

export default function MeasureOrderList() {
  const measureOrders = useAppStore((state) => state.measureOrders);

  const sortedOrders = [...measureOrders].sort((a, b) => {
    const statusOrder = { pending: 0, measured: 1, completed: 2 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">量房单列表</h3>
        <span className="text-sm text-slate-500">共 {sortedOrders.length} 条记录</span>
      </div>

      <div className="grid gap-4">
        {sortedOrders.map((order) => {
          const status = statusConfig[order.status];
          const StatusIcon = status.icon;
          
          return (
            <div 
              key={order.id}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{order.id}</span>
                    </div>
                    <p className="text-sm text-slate-500">量房单</p>
                  </div>
                </div>
                <span className={`flex items-center gap-1 px-3 py-1 ${status.bgColor} ${status.color} text-sm rounded-full`}>
                  <StatusIcon className="w-4 h-4" />
                  {status.label}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">{order.customerName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Ruler className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">{order.area} ㎡</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600 truncate">{order.address}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">{order.date}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="text-xs text-slate-500">
                  设计师：{order.designerName}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {sortedOrders.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">暂无量房单记录</p>
        </div>
      )}
    </div>
  );
}
