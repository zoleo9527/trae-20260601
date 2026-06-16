import { Clock, User, Tag, AlertCircle } from 'lucide-react';
import type { Order } from '@/types';

interface OrderCardProps {
  order: Order;
  onClick: () => void;
}

const statusConfig = {
  pending: { label: '待量体', color: 'bg-gray-100 text-gray-600' },
  fitting: { label: '试穿中', color: 'bg-blue-100 text-blue-600' },
  adjusting: { label: '调整中', color: 'bg-coral-100 text-coral-600' },
  completed: { label: '已完成', color: 'bg-mint-100 text-mint-600' },
};

const productConfig = {
  suit: { label: '西装', icon: '👔' },
  'wedding-dress': { label: '婚纱', icon: '👰' },
  custom: { label: '定制', icon: '🎩' },
};

const priorityConfig = {
  low: { label: '低', color: 'bg-gray-200' },
  medium: { label: '中', color: 'bg-yellow-200' },
  high: { label: '高', color: 'bg-red-200' },
};

export function OrderCard({ order, onClick }: OrderCardProps) {
  const status = statusConfig[order.status];
  const product = productConfig[order.productType];
  const priority = priorityConfig[order.priority];

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-100 overflow-hidden group"
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{product.icon}</span>
            <div>
              <h3 className="font-semibold text-navy-900">{order.customerName}</h3>
              <p className="text-xs text-gray-500">{order.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
              {status.label}
            </span>
            {order.priority === 'high' && (
              <AlertCircle className="w-4 h-4 text-coral-500 animate-pulse" />
            )}
          </div>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Tag className="w-4 h-4" />
            <span>{product.label}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <User className="w-4 h-4" />
            <span>负责人: {order.assignee}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4" />
            <span>预计交付: {order.expectedDelivery}</span>
          </div>
        </div>
        
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">优先级</span>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${priority.color}`}>
              {priority.label}
            </span>
          </div>
          <span className="text-xs text-navy-500 group-hover:text-navy-700 transition-colors">
            查看详情 →
          </span>
        </div>
      </div>
    </div>
  );
}
