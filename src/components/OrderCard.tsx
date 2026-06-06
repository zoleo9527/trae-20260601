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
  RefreshCw
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

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 line-clamp-1">{order.title}</h4>
          <p className="text-xs text-gray-500 mt-0.5">{order.orderNo}</p>
        </div>
        <div className="flex items-center space-x-2 ml-3">
          {order.reworks.length > 0 && (
            <span className="flex items-center space-x-1 bg-red-50 text-red-600 text-xs px-2 py-0.5 rounded-full">
              <RefreshCw className="w-3 h-3" />
              <span>返修{order.reworks.length}次</span>
            </span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColors[order.priority]}`}>
            {priorityLabels[order.priority]}
          </span>
        </div>
      </div>

      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{order.description}</p>

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
