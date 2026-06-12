import { AlertTriangle, Clock, MapPin, User } from 'lucide-react';
import { WorkOrder } from '../types';
import { formatDate, getStatusName, getPriorityName } from '../utils/format';

interface WorkOrderCardProps {
  order: WorkOrder;
  onClick: () => void;
}

export const WorkOrderCard = ({ order, onClick }: WorkOrderCardProps) => {
  const statusColors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-600',
    processing: 'bg-blue-100 text-blue-600',
    completed: 'bg-green-100 text-green-600',
    overdue: 'bg-red-100 text-red-600',
    rejected: 'bg-orange-100 text-orange-600',
  };

  const priorityColors: Record<string, string> = {
    low: 'border-gray-300',
    medium: 'border-yellow-400',
    high: 'border-red-400',
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 border-2 rounded-lg cursor-pointer hover:shadow-md transition-shadow ${priorityColors[order.priority]}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 font-mono">{order.id}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
            {getStatusName(order.status)}
          </span>
          {order.responsibilityUnclear && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
              <AlertTriangle size={12} />
              责任不清
            </span>
          )}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded ${
          order.priority === 'high' ? 'bg-red-100 text-red-600' :
          order.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
          'bg-gray-100 text-gray-600'
        }`}>
          {getPriorityName(order.priority)}优先级
        </span>
      </div>
      
      <h3 className="font-medium text-gray-900 mb-2 line-clamp-1">{order.title}</h3>
      
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <MapPin size={14} />
          {order.location}
        </span>
        <span className="flex items-center gap-1">
          <User size={14} />
          {order.submitter}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={14} />
          {formatDate(order.createdAt)}
        </span>
      </div>

      {order.satisfaction && (
        <div className="mt-2 flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <span key={i} className={i < (order.satisfaction?.score ?? 0) ? 'text-yellow-400' : 'text-gray-300'}>
              ★
            </span>
          ))}
          <span className="text-xs text-gray-500 ml-1">满意度</span>
        </div>
      )}
    </div>
  );
};
