import { Clock, User, Tag, AlertCircle, Calendar, AlertTriangle, Phone, Clock4 } from 'lucide-react';
import { useOrderStore } from '@/store/orderStore';
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

const pickupStatusConfig = {
  scheduled: { label: '正常取件', color: 'bg-mint-100 text-mint-700', icon: Calendar },
  delayed: { label: '延期取件', color: 'bg-coral-100 text-coral-700', icon: AlertTriangle },
  'picked-up': { label: '已取件', color: 'bg-navy-100 text-navy-700', icon: Clock },
};

export function OrderCard({ order, onClick }: OrderCardProps) {
  const { followUpRecords } = useOrderStore();

  const status = statusConfig[order.status];
  const product = productConfig[order.productType];
  const priority = priorityConfig[order.priority];
  const pickupStatus = pickupStatusConfig[order.pickupStatus];
  const PickupIcon = pickupStatus.icon;

  const followUpCount = followUpRecords.filter((r) => r.orderId === order.id).length;
  const isPendingFollowUp = order.pickupStatus === 'delayed' && followUpCount === 0;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer border overflow-hidden group ${
        order.pickupStatus === 'delayed' ? 'border-coral-200 ring-1 ring-coral-100' : 'border-gray-100'
      }`}
    >
      {order.pickupStatus === 'delayed' && (
        <div className="bg-gradient-to-r from-coral-50 to-orange-50 px-4 py-3 border-b border-coral-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-coral-600" />
              <span className="text-sm font-semibold text-coral-700">延期取件</span>
              {isPendingFollowUp && (
                <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-medium">
                  待跟进
                </span>
              )}
            </div>
            {order.newPickupDate && (
              <div className="flex items-center gap-1 text-coral-600">
                <Clock4 className="w-4 h-4" />
                <span className="text-sm font-medium">{order.newPickupDate}</span>
              </div>
            )}
          </div>
          {order.delayReason && (
            <p className="text-xs text-coral-500">{order.delayReason}</p>
          )}
        </div>
      )}
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
          <div className={`flex items-center gap-2 text-sm ${pickupStatus.color}`}>
            <PickupIcon className="w-4 h-4" />
            <span>{pickupStatus.label}</span>
          </div>
          {order.pickupStatus === 'delayed' && (
            <div
              className={`flex items-center gap-2 text-sm ${
                isPendingFollowUp
                  ? 'text-amber-600 bg-amber-50 p-2 rounded-lg'
                  : 'text-gray-500'
              }`}
            >
              <Phone className="w-4 h-4" />
              <span className="text-xs">
                {isPendingFollowUp ? '⚠️ 需要客服跟进' : `已跟进 ${followUpCount} 次`}
              </span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">优先级</span>
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${priority.color}`}
            >
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
