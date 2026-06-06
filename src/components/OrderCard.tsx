import { RepairOrder, statusLabels, statusColors } from '@/types';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { 
  MapPin, 
  Tag, 
  User, 
  Clock,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  MessageSquare,
  CheckCircle2
} from 'lucide-react';

interface OrderCardProps {
  order: RepairOrder;
  onClick?: () => void;
}

export function OrderCard({ order, onClick }: OrderCardProps) {
  const priorityColors = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-red-100 text-red-700'
  };

  const priorityLabels = {
    low: '低',
    medium: '中',
    high: '高'
  };

  const lastConfirmedCompletion = [...order.completions].reverse().find(c => c.confirmed);
  const lastRework = order.reworks.length > 0 ? order.reworks[order.reworks.length - 1] : null;

  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-xl shadow-sm border p-5 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer ${
        order.status.startsWith('rework') ? 'border-red-200 bg-red-50/30' : 'border-gray-100'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 line-clamp-1">{order.title}</h4>
          <p className="text-xs text-gray-500 mt-0.5">{order.orderNo}</p>
        </div>
        <div className="flex items-center space-x-2 ml-3 flex-wrap gap-1">
          {order.reworks.length > 0 && (
            <span className="flex items-center space-x-1 bg-red-50 text-red-600 text-xs px-2 py-0.5 rounded-full border border-red-200">
              <RefreshCw className="w-3 h-3" />
              <span>返修{order.reworks.length}次</span>
            </span>
          )}
          {lastConfirmedCompletion?.confirmRemark && (
            <span className="flex items-center space-x-1 bg-emerald-50 text-emerald-600 text-xs px-2 py-0.5 rounded-full border border-emerald-200">
              <MessageSquare className="w-3 h-3" />
              <span>有备注</span>
            </span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColors[order.priority]}`}>
            {priorityLabels[order.priority]}
          </span>
        </div>
      </div>

      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{order.description}</p>

      {lastRework && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 mb-3">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="text-red-700 font-medium">最新返修：{lastRework.reason}</p>
              <p className="text-red-500 mt-0.5">
                {format(new Date(lastRework.requestedAt), 'MM-dd HH:mm', { locale: zhCN })}
              </p>
            </div>
          </div>
        </div>
      )}

      {lastConfirmedCompletion?.confirmRemark && !lastRework && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 mb-3">
          <div className="flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="text-emerald-700 font-medium">宿管确认备注</p>
              <p className="text-emerald-600 mt-0.5 line-clamp-2">{lastConfirmedCompletion.confirmRemark}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 text-sm text-gray-500 mb-4">
        <div className="flex items-center space-x-1.5">
          <MapPin className="w-4 h-4" />
          <span className="truncate">{order.dormitory} {order.roomNumber}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <Tag className="w-4 h-4" />
          <span className="truncate">{order.category}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <User className="w-4 h-4" />
          <span className="truncate">{order.reporter}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <Clock className="w-4 h-4" />
          <span>{format(new Date(order.createdAt), 'MM-dd HH:mm', { locale: zhCN })}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[order.status]}`}>
          {statusLabels[order.status]}
        </span>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </div>
  );
}
