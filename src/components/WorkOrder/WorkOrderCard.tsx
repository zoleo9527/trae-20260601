import { Clock, AlertTriangle, User, Package } from 'lucide-react';
import type { WorkOrder } from '@/types';
import { STATUS_MAP, STATUS_COLORS, PRIORITY_COLORS, PRIORITY_MAP } from '@/types';

interface WorkOrderCardProps {
  workorder: WorkOrder;
  selected: boolean;
  onSelect: () => void;
  onClick: () => void;
}

export function WorkOrderCard({ workorder, selected, onSelect, onClick }: WorkOrderCardProps) {
  return (
    <div
      className={`bg-white rounded-xl border-2 transition-all duration-200 cursor-pointer hover:shadow-lg ${
        selected ? 'border-blue-500 shadow-lg' : 'border-slate-200 hover:border-blue-300'
      }`}
      onClick={onClick}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selected}
              onChange={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-slate-600">{workorder.equipmentNo}</span>
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${STATUS_COLORS[workorder.status]}`}>
            {STATUS_MAP[workorder.status]}
          </span>
        </div>

        <h3 className="font-semibold text-slate-800 mb-2 line-clamp-2">{workorder.faultDescription}</h3>

        <div className="space-y-2 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <User size={14} className="text-slate-400" />
            <span>{workorder.customerName} - {workorder.model}</span>
          </div>
          {workorder.assigneeName && (
            <div className="flex items-center gap-2">
              <User size={14} className="text-slate-400" />
              <span>负责人: {workorder.assigneeName}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-slate-400" />
            <span>{workorder.updatedAt.split(' ')[0]}</span>
          </div>
          {workorder.parts.length > 0 && (
            <div className="flex items-center gap-2">
              <Package size={14} className="text-slate-400" />
              <span>配件: {workorder.parts.length} 项</span>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className={`px-2 py-1 text-xs font-medium rounded ${PRIORITY_COLORS[workorder.priority]}`}>
            {PRIORITY_MAP[workorder.priority]}优先级
          </span>
          {workorder.signOff && workorder.signOff.status === 'pending' && (
            <span className="flex items-center gap-1 text-xs text-indigo-600">
              <AlertTriangle size={12} />
              待签认
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
