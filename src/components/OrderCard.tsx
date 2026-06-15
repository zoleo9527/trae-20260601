import React from 'react';
import { ORDER_STATUS_LABELS, InstallationOrder } from '../types';
import { getStatusBadgeClass, getPriorityLabel, hasUnconfirmedAppointmentChanges } from '../utils/mockData';
import {
  MapPin,
  Calendar,
  Clock,
  User,
  AlertTriangle,
  Tag,
  ChevronRight,
} from 'lucide-react';

interface OrderCardProps {
  order: InstallationOrder;
  selected?: boolean;
  onClick?: () => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, selected, onClick }) => {
  const hasChanges = hasUnconfirmedAppointmentChanges(order);
  const priorityClass = `priority-${order.priority}`;

  return (
    <div
      className={`order-card ${selected ? 'selected' : ''} ${hasChanges ? 'has-changes' : ''}`}
      onClick={onClick}
    >
      <div className="order-card-header">
        <span className="order-no">{order.orderNo}</span>
        <span className={`badge ${getStatusBadgeClass(order.status)}`}>
          {ORDER_STATUS_LABELS[order.status]}
        </span>
        {hasChanges && (
          <span className="change-indicator">
            <AlertTriangle size={12} />
            预约已变更
          </span>
        )}
        <span className={`tag ${priorityClass}`} style={{ marginLeft: 'auto' }}>
          {getPriorityLabel(order.priority)}
        </span>
      </div>
      <div className="order-card-body">
        <div>
          <User size={14} className="text-muted" />
          <span>{order.customerName}</span>
          <span className="text-muted ml-1">{order.customerPhone}</span>
        </div>
        <div>
          <Tag size={14} className="text-muted" />
          <span>{order.productType}</span>
        </div>
        <div>
          <Calendar size={14} className="text-muted" />
          <span>{order.appointmentDate}</span>
        </div>
        <div>
          <Clock size={14} className="text-muted" />
          <span>{order.appointmentTime}</span>
        </div>
      </div>
      <div className="order-card-body mt-2">
        <div style={{ flex: 1 }}>
          <MapPin size={14} className="text-muted" />
          <span className="truncate" style={{ maxWidth: '400px' }}>
            {order.address}
          </span>
        </div>
        {order.assigneeName && (
          <div>
            <User size={14} className="text-muted" />
            <span>{order.assigneeName}</span>
          </div>
        )}
        {order.siteChecks.length > 0 && (
          <div>
            <span className="text-xs text-muted">
              现场确认 {order.siteChecks.length} 次
            </span>
          </div>
        )}
      </div>
      <div className="order-card-footer">
        <div className="text-xs text-muted">
          调度：{order.dispatcherName}
        </div>
        <div className="text-xs text-muted" style={{ marginLeft: 'auto' }}>
          更新于 {order.updatedAt.slice(5, 16).replace('T', ' ')}
        </div>
        <ChevronRight size={14} className="text-muted" />
      </div>
    </div>
  );
};

export default OrderCard;
