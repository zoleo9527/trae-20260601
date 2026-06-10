import { AlertTriangle, Bike, ChevronRight, Clock, MapPin, Repeat } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import type { Complaint } from '../../types';
import { formatTime, priorityMap, statusMap } from '../../utils/format';

interface ComplaintCardProps {
  complaint: Complaint;
  index: number;
}

export const ComplaintCard = ({ complaint, index }: ComplaintCardProps) => {
  const { selectedComplaintId, setSelectedComplaint } = useAppStore();
  const isSelected = selectedComplaintId === complaint.id;
  const status = statusMap[complaint.status];
  const priority = priorityMap[complaint.priority];
  const hasRepeat = (complaint.repeatCount || 0) > 1;
  const hasOffset = complaint.location.offset;

  return (
    <div
      onClick={() => setSelectedComplaint(complaint.id)}
      className={`group relative p-4 rounded-xl border cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
        isSelected
          ? 'bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-300 shadow-md ring-2 ring-cyan-200'
          : 'bg-white border-slate-200 hover:border-cyan-200'
      }`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {hasRepeat && (
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded-full">
          <Repeat className="w-3 h-3" />
          <span>{complaint.repeatCount}次</span>
        </div>
      )}

      <div className="flex items-start gap-3 pr-16">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
          complaint.priority === 'urgent' ? 'bg-red-100 text-red-600' :
          complaint.priority === 'high' ? 'bg-orange-100 text-orange-600' :
          complaint.priority === 'medium' ? 'bg-blue-100 text-blue-600' :
          'bg-slate-100 text-slate-600'
        }`}>
          <Bike className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-900 truncate">{complaint.title}</h3>
          </div>

          <p className="text-sm text-slate-500 line-clamp-1 mb-2">{complaint.description}</p>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              <span className="truncate max-w-[180px]">{complaint.location.address}</span>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatTime(complaint.createTime)}
            </span>
          </div>

          {hasOffset && (
            <div className="mt-2 flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-md w-fit">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>定位可能有偏移</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
        <span className={`px-2 py-0.5 text-xs font-medium rounded-md border ${status.color}`}>
          {status.label}
        </span>
        <span className={`px-2 py-0.5 text-xs font-medium rounded-md border ${priority.color}`}>
          {priority.label}优先级
        </span>
        <span className="ml-auto text-xs text-slate-400 font-mono">{complaint.id}</span>
        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${
          isSelected ? 'translate-x-0.5 text-cyan-500' : 'group-hover:translate-x-0.5'
        }`} />
      </div>
    </div>
  );
};
