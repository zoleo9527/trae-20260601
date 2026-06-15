import { Card } from '@/components/ui/Card';
import { Inspection } from '@/types';
import { statusMap, priorityMap } from '@/utils/status';
import { formatRelativeTime, formatDate } from '@/utils/date';
import { MapPin, Calendar, Clock, User, ChevronRight, Wrench, Truck, ClipboardCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useInspectionStore } from '@/store/useInspectionStore';
import { useUserStore } from '@/store/useUserStore';

interface InspectionCardProps {
  inspection: Inspection;
}

export function InspectionCard({ inspection }: InspectionCardProps) {
  const navigate = useNavigate();
  const { getEquipmentById, getContractById } = useInspectionStore();
  const { currentRole } = useUserStore();

  const equipment = getEquipmentById(inspection.equipmentId);
  const contract = getContractById(inspection.contractId);
  const statusInfo = statusMap[inspection.status];
  const priorityInfo = priorityMap[inspection.priority];

  const isMyTodo = inspection.currentRole === currentRole && inspection.status !== 'completed';

  const handleClick = () => {
    navigate(`/inspections/${inspection.id}`);
  };

  return (
    <Card
      hoverable
      onClick={handleClick}
      className={cn('relative overflow-hidden', isMyTodo && 'ring-2 ring-blue-200')}
    >
      {isMyTodo && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />
      )}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-slate-500">{inspection.inspectionNo}</span>
            {inspection.priority !== 'normal' && (
              <span
                className={cn(
                  'px-1.5 py-0.5 text-xs font-medium rounded',
                  priorityInfo.bgColor,
                  priorityInfo.color
                )}
              >
                {priorityInfo.label}
              </span>
            )}
          </div>
          <span
            className={cn(
              'px-2.5 py-1 text-xs font-medium rounded-full border',
              statusInfo.bgColor,
              statusInfo.color
            )}
          >
            {statusInfo.label}
          </span>
        </div>

        <h3 className="text-base font-semibold text-slate-900 mb-2">
          {equipment?.name || '未知设备'}
          <span className="text-sm font-normal text-slate-500 ml-2">{equipment?.model}</span>
        </h3>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <MapPin size={14} className="text-slate-400 flex-shrink-0" />
            <span className="truncate">{inspection.siteAddress}</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <Calendar size={14} className="text-slate-400" />
              {contract?.startDate && formatDate(contract.startDate)}
              {' → '}
              {contract?.endDate && formatDate(contract.endDate)}
            </span>
          </div>
          <div className="text-sm text-slate-500">
            承租方：{contract?.lessee || '未知'}
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              更新于 {formatRelativeTime(inspection.updatedAt)}
            </span>
            {inspection.driverName && (
              <span className="flex items-center gap-1">
                <User size={12} />
                {inspection.driverName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-blue-600 text-sm font-medium">
            查看详情
            <ChevronRight size={14} />
          </div>
        </div>
      </div>
    </Card>
  );
}
