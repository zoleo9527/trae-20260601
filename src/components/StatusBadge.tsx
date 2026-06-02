
import type {
  StationStatus,
  DeviceStatus,
  FaultStatus,
  FaultSeverity,
  WorkOrderStatus,
  OrderStatus,
  ComplaintStatus,
  SettlementStatus,
  DisputeStatus,
} from '../../shared/types';

const stationStatusConfig: Record<StationStatus, { label: string; className: string }> = {
  normal: { label: '正常', className: 'bg-green-100 text-green-700' },
  warning: { label: '告警', className: 'bg-yellow-100 text-yellow-700' },
  offline: { label: '离线', className: 'bg-red-100 text-red-700' },
};

const deviceStatusConfig: Record<DeviceStatus, { label: string; className: string }> = {
  online: { label: '在线', className: 'bg-green-100 text-green-700' },
  offline: { label: '离线', className: 'bg-red-100 text-red-700' },
  maintenance: { label: '维修中', className: 'bg-orange-100 text-orange-700' },
};

const faultStatusConfig: Record<FaultStatus, { label: string; className: string }> = {
  pending: { label: '待处理', className: 'bg-yellow-100 text-yellow-700' },
  processing: { label: '处理中', className: 'bg-blue-100 text-blue-700' },
  resolved: { label: '已解决', className: 'bg-green-100 text-green-700' },
  closed: { label: '已关闭', className: 'bg-gray-100 text-gray-700' },
};

const faultSeverityConfig: Record<FaultSeverity, { label: string; className: string }> = {
  low: { label: '低', className: 'bg-gray-100 text-gray-700' },
  medium: { label: '中', className: 'bg-yellow-100 text-yellow-700' },
  high: { label: '高', className: 'bg-orange-100 text-orange-700' },
  critical: { label: '紧急', className: 'bg-red-100 text-red-700' },
};

const workOrderStatusConfig: Record<WorkOrderStatus, { label: string; className: string }> = {
  pending: { label: '待接单', className: 'bg-yellow-100 text-yellow-700' },
  accepted: { label: '已接单', className: 'bg-blue-100 text-blue-700' },
  arrived: { label: '已到达', className: 'bg-purple-100 text-purple-700' },
  processing: { label: '维修中', className: 'bg-orange-100 text-orange-700' },
  completed: { label: '已完成', className: 'bg-green-100 text-green-700' },
  timeout: { label: '已超时', className: 'bg-red-100 text-red-700' },
};

const orderStatusConfig: Record<OrderStatus, { label: string; className: string }> = {
  charging: { label: '充电中', className: 'bg-blue-100 text-blue-700' },
  completed: { label: '已完成', className: 'bg-green-100 text-green-700' },
  interrupted: { label: '中断', className: 'bg-orange-100 text-orange-700' },
  refunded: { label: '已退款', className: 'bg-gray-100 text-gray-700' },
};

const complaintStatusConfig: Record<ComplaintStatus, { label: string; className: string }> = {
  pending: { label: '待处理', className: 'bg-yellow-100 text-yellow-700' },
  processing: { label: '处理中', className: 'bg-blue-100 text-blue-700' },
  resolved: { label: '已解决', className: 'bg-green-100 text-green-700' },
  closed: { label: '已关闭', className: 'bg-gray-100 text-gray-700' },
};

const settlementStatusConfig: Record<SettlementStatus, { label: string; className: string }> = {
  pending: { label: '待确认', className: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: '已确认', className: 'bg-blue-100 text-blue-700' },
  disputed: { label: '有异议', className: 'bg-orange-100 text-orange-700' },
  completed: { label: '已完成', className: 'bg-green-100 text-green-700' },
};

const disputeStatusConfig: Record<DisputeStatus, { label: string; className: string }> = {
  pending: { label: '待处理', className: 'bg-yellow-100 text-yellow-700' },
  reviewing: { label: '审核中', className: 'bg-blue-100 text-blue-700' },
  resolved: { label: '已解决', className: 'bg-green-100 text-green-700' },
  rejected: { label: '已驳回', className: 'bg-red-100 text-red-700' },
};

type StatusType =
  | 'station'
  | 'device'
  | 'fault'
  | 'faultSeverity'
  | 'workOrder'
  | 'order'
  | 'complaint'
  | 'settlement'
  | 'dispute';

const configMap: Record<StatusType, Record<string, { label: string; className: string }>> = {
  station: stationStatusConfig,
  device: deviceStatusConfig,
  fault: faultStatusConfig,
  faultSeverity: faultSeverityConfig,
  workOrder: workOrderStatusConfig,
  order: orderStatusConfig,
  complaint: complaintStatusConfig,
  settlement: settlementStatusConfig,
  dispute: disputeStatusConfig,
};

interface StatusBadgeProps {
  type: StatusType;
  status: string;
}

export function StatusBadge({ type, status }: StatusBadgeProps) {
  const config = configMap[type][status] || { label: status, className: 'bg-gray-100 text-gray-700' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
