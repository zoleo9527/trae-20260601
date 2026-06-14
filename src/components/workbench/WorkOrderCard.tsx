import { WorkOrder } from '../../types';
import { clsx } from 'clsx';
import {
  Clock,
  Car,
  AlertTriangle,
  User,
  ChevronRight,
  Circle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useTechnicianStore } from '../../store/technicianStore';

interface WorkOrderCardProps {
  order: WorkOrder;
  isSelected?: boolean;
  onClick: () => void;
}

const priorityConfig = {
  urgent: { label: '紧急', color: 'text-[#e94560]', bg: 'bg-[#e94560]/10' },
  high: { label: '高优', color: 'text-[#f39c12]', bg: 'bg-[#f39c12]/10' },
  normal: { label: '普通', color: 'text-[#0f3460]', bg: 'bg-[#0f3460]/10' },
  low: { label: '低优', color: 'text-[#a0a0a0]', bg: 'bg-[#a0a0a0]/10' },
};

const statusConfig = {
  pending: { label: '待处理', color: 'text-[#f39c12]', bg: 'bg-[#f39c12]/10' },
  dispatched: { label: '已派工', color: 'text-[#0f3460]', bg: 'bg-[#0f3460]/10' },
  in_progress: { label: '进行中', color: 'text-[#3498db]', bg: 'bg-[#3498db]/10' },
  completed: { label: '已完成', color: 'text-[#27ae60]', bg: 'bg-[#27ae60]/10' },
  suspended: { label: '已暂停', color: 'text-[#e94560]', bg: 'bg-[#e94560]/10' },
  cancelled: { label: '已取消', color: 'text-[#a0a0a0]', bg: 'bg-[#a0a0a0]/10' },
};

export default function WorkOrderCard({
  order,
  isSelected,
  onClick,
}: WorkOrderCardProps) {
  const { getTechnicianById } = useTechnicianStore();
  const priority = priorityConfig[order.priority];
  const status = statusConfig[order.status];
  const hasExceptions = order.exceptions.length > 0;
  const isOverdue =
    order.status === 'pending' &&
    new Date().getTime() - order.createdAt.getTime() > 4 * 60 * 60 * 1000;

  const technician = order.installation.technicianId
    ? getTechnicianById(order.installation.technicianId)
    : null;

  return (
    <div
      onClick={onClick}
      className={clsx(
        'p-4 rounded-lg border transition-all duration-200 cursor-pointer',
        'hover:shadow-lg hover:-translate-y-0.5',
        isSelected
          ? 'bg-[#1a1a2e] border-[#e94560] shadow-lg'
          : 'bg-[#16213e] border-[#1a1a2e] hover:border-[#0f3460]',
        isOverdue && 'border-l-4 border-l-[#e94560]'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold text-[#eaeaea]">
            {order.orderNo}
          </span>
          {hasExceptions && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-[#e94560]/10 text-[#e94560] text-xs rounded">
              <AlertTriangle size={12} />
              异常
            </span>
          )}
        </div>
        <ChevronRight size={16} className="text-[#a0a0a0]" />
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Car size={14} className="text-[#a0a0a0]" />
        <span className="text-sm text-[#eaeaea]">
          {order.vehicle.brand} {order.vehicle.model}
        </span>
        <span className="text-sm text-[#a0a0a0] font-mono">{order.vehicle.plateNo}</span>
      </div>

      <div className="mb-3">
        <p className="text-xs text-[#a0a0a0] mb-1">轮胎信息</p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#eaeaea]">
            {order.tires[0]?.brand} {order.tires[0]?.model}
          </span>
          <Circle size={8} className="text-[#a0a0a0]" />
          <span className="text-xs text-[#a0a0a0]">
            {order.tires[0]?.spec}
          </span>
        </div>
        <p className="text-xs text-[#a0a0a0]">
          {order.tires.length > 1 ? `${order.tires.length}种轮胎` : `× ${order.tires[0]?.quantity}条`}
        </p>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-[#1a1a2e]">
        <div className="flex items-center gap-3">
          <span
            className={clsx(
              'px-2 py-1 text-xs font-medium rounded',
              priority.bg,
              priority.color
            )}
          >
            {priority.label}
          </span>
          <span
            className={clsx(
              'px-2 py-1 text-xs font-medium rounded',
              status.bg,
              status.color
            )}
          >
            {status.label}
          </span>
        </div>

        <div className="flex items-center gap-1 text-xs text-[#a0a0a0]">
          <Clock size={12} />
          <span>
            {formatDistanceToNow(order.createdAt, { addSuffix: true, locale: zhCN })}
          </span>
        </div>
      </div>

      {technician && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#1a1a2e]">
          <div className="w-6 h-6 bg-[#0f3460] rounded-full flex items-center justify-center">
            <span className="text-xs font-semibold text-[#eaeaea]">
              {technician.name[0]}
            </span>
          </div>
          <div className="flex-1">
            <span className="text-xs text-[#eaeaea]">{technician.name}</span>
            <span className="text-xs text-[#a0a0a0] ml-2">
              {technician.role === 'senior_technician' ? '高级技师' : technician.role === 'foreman' ? '工长' : '技师'}
            </span>
          </div>
        </div>
      )}

      {!technician && order.status === 'pending' && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#1a1a2e]">
          <User size={14} className="text-[#a0a0a0]" />
          <span className="text-xs text-[#f39c12]">待派工</span>
        </div>
      )}
    </div>
  );
}
