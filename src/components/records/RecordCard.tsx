import { Check, X, Clock, AlertTriangle, User, MapPin, Calendar } from 'lucide-react';
import type { ScheduleRecord } from '@/types';
import { StatusBadge } from './StatusBadge';
import { rejectReasonNames, responsibilityNames } from '@/types';
import { getTimeAgo } from '@/utils/formatters';
import { useStore } from '@/store';

interface RecordCardProps {
  record: ScheduleRecord;
  isSelected: boolean;
}

export function RecordCard({ record, isSelected }: RecordCardProps) {
  const { selectedRecordIds, setSelectedRecords, setActiveRecord } = useStore();
  
  const toggleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedRecordIds.includes(record.id)) {
      setSelectedRecords(selectedRecordIds.filter((id) => id !== record.id));
    } else {
      setSelectedRecords([...selectedRecordIds, record.id]);
    }
  };
  
  const handleClick = () => {
    setActiveRecord(record.id);
  };
  
  return (
    <div
      onClick={handleClick}
      className={`
        relative p-4 rounded-lg border cursor-pointer transition-all duration-200
        ${isSelected ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'}
        ${record.isOverdue ? 'animate-pulse-border border-red-500' : ''}
      `}
    >
      {record.hasResponsibilityRisk && (
        <div className="absolute -top-px -left-px w-0 h-0 border-t-[16px] border-l-[16px] border-t-purple-500 border-l-transparent" />
      )}
      
      {record.isOverdue && (
        <div className="absolute top-2 right-2 flex items-center gap-1 text-red-400 text-xs font-medium">
          <Clock className="w-3 h-3 animate-spin-slow" />
          超时
        </div>
      )}
      
      <div className="flex items-start gap-3">
        <div
          onClick={toggleSelect}
          className={`
            mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors
            ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-600 hover:border-slate-500'}
          `}
        >
          {isSelected && <Check className="w-3 h-3 text-white" />}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-100">{record.studentName}</span>
            <span className="text-xs text-slate-400">{record.courseType}</span>
            <StatusBadge status={record.status} />
            {record.hasResponsibilityRisk && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <AlertTriangle className="w-3 h-3" />
                责任待澄清
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 mb-2">
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>{record.coachName}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{record.venueName}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{record.scheduledDate} {record.startTime}-{record.endTime}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>更新于 {getTimeAgo(record.updatedAt)}</span>
            </div>
          </div>
          
          {record.rejectReason && (
            <div className="mt-2 p-2 rounded bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-1 text-xs text-red-400 font-medium mb-1">
                <X className="w-3 h-3" />
                退回原因：{rejectReasonNames[record.rejectReason]}
              </div>
              {record.rejectRemark && (
                <p className="text-xs text-slate-400">{record.rejectRemark}</p>
              )}
            </div>
          )}
          
          {record.responsibility !== 'none' && (
            <div className="mt-2 text-xs">
              <span className="text-slate-500">责任认定：</span>
              <span className="text-purple-400 font-medium">{responsibilityNames[record.responsibility]}</span>
              {record.responsibilityRemark && (
                <p className="text-slate-400 mt-1">{record.responsibilityRemark}</p>
              )}
            </div>
          )}
          
          {record.rejectCount > 0 && (
            <div className="mt-2 text-xs text-slate-500">
              已退回 {record.rejectCount} 次
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
