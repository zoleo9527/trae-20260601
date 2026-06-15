import { useNavigate } from 'react-router-dom';
import type { Order } from '../types';
import { MapPin, Clock, Truck, AlertCircle, AlertTriangle, Zap } from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  reserved: { label: '已预约', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  transporting: { label: '运输中', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  serving: { label: '服务中', color: 'text-green-600', bgColor: 'bg-green-100' },
  pending: { label: '待确认', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  settling: { label: '待结算', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  completed: { label: '已完成', color: 'text-gray-500', bgColor: 'bg-gray-50' },
  dispute: { label: '纠纷处理', color: 'text-red-600', bgColor: 'bg-red-100' },
};

export default function OrderCard({ order }: { order: Order }) {
  const navigate = useNavigate();
  const status = statusConfig[order.status];

  const getAlertLevel = () => {
    const scheduled = new Date(order.scheduledTime);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - scheduled.getTime()) / (1000 * 60));
    
    if (order.status === 'pending') {
      const createdAt = new Date(order.createdAt);
      const pendingMinutes = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60));
      if (pendingMinutes > 30) return 'critical';
      return 'warning';
    }
    
    if (diffMinutes > 30) return 'critical';
    if (diffMinutes > 15) return 'error';
    return 'none';
  };

  const alertLevel = getAlertLevel();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTimeDiff = () => {
    const scheduled = new Date(order.scheduledTime);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - scheduled.getTime()) / (1000 * 60));
    
    if (diffMinutes < 0) {
      const remaining = Math.abs(diffMinutes);
      if (remaining < 60) return `剩余${remaining}分钟`;
      return `剩余${Math.floor(remaining / 60)}小时${remaining % 60}分钟`;
    }
    
    if (diffMinutes < 60) return `超时${diffMinutes}分钟`;
    return `超时${Math.floor(diffMinutes / 60)}小时${diffMinutes % 60}分钟`;
  };

  const getAlertStyle = () => {
    switch (alertLevel) {
      case 'critical':
        return {
          ring: 'ring-2 ring-red-500',
          glow: 'shadow-lg shadow-red-200',
          badge: 'bg-red-100 text-red-600',
          icon: <Zap className="w-4 h-4" />,
          text: '紧急',
        };
      case 'error':
        return {
          ring: 'ring-2 ring-orange-400',
          glow: 'shadow-md shadow-orange-100',
          badge: 'bg-orange-100 text-orange-600',
          icon: <AlertTriangle className="w-4 h-4" />,
          text: '超时',
        };
      case 'warning':
        return {
          ring: 'ring-2 ring-yellow-400',
          glow: 'shadow-md shadow-yellow-100',
          badge: 'bg-yellow-100 text-yellow-600',
          icon: <AlertCircle className="w-4 h-4" />,
          text: '待确认',
        };
      default:
        return null;
    }
  };

  const alertStyle = getAlertStyle();

  return (
    <div
      onClick={() => navigate(`/orders/${order.id}`)}
      className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all duration-200 ${
        alertStyle ? `${alertStyle.ring} ${alertStyle.glow}` : ''
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-800">{order.customerName}</h3>
          {alertStyle && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${alertStyle.badge} flex items-center gap-1`}>
              {alertStyle.icon}
              {alertStyle.text}
            </span>
          )}
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
          {status.label}
        </span>
      </div>

      {alertLevel !== 'none' && (
        <div className={`flex items-center justify-between text-sm mb-3 p-2 rounded-lg ${
          alertLevel === 'critical' ? 'bg-red-50 text-red-600' : 
          alertLevel === 'error' ? 'bg-orange-50 text-orange-600' : 
          'bg-yellow-50 text-yellow-600'
        }`}>
          <span className="flex items-center gap-1">
            {alertLevel === 'critical' ? <Zap className="w-4 h-4" /> :
             alertLevel === 'error' ? <AlertTriangle className="w-4 h-4" /> :
             <AlertCircle className="w-4 h-4" />}
            {alertLevel === 'critical' ? '需要立即处理' : 
             alertLevel === 'error' ? '车辆迟到' : 
             '费用待确认中'}
          </span>
          <span className="font-medium">{formatTimeDiff()}</span>
        </div>
      )}

      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div className="truncate">
            <span className="text-gray-400">从</span> {order.addressFrom}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <div className="truncate">
            <span className="text-gray-400">到</span> {order.addressTo}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span>{formatDate(order.scheduledTime)}</span>
        </div>
        {order.driverName && (
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span>{order.driverName} · {order.vehicleId}</span>
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
        <span className="text-lg font-bold text-blue-600">¥{order.baseFee.toFixed(2)}</span>
        <span className="text-xs text-gray-400">点击查看详情</span>
      </div>
    </div>
  );
}
