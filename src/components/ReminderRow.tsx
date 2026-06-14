import StatusBadge from './StatusBadge';
import Avatar from './Avatar';
import { ArrowRight, Clock, AlertOctagon } from 'lucide-react';
import { useReminderStore } from '../store/reminder';
import { formatDateTime, roleMap, riskLevelMap, getHandoverInfo } from '../utils/format';
import type { Reminder } from '../../shared/types';

interface Props {
  reminder: Reminder;
}

const motorcycleTypeMap: Record<string, string> = {
  E: '普通二轮',
  D: '普通三轮',
  F: '轻便摩托',
};

export default function ReminderRow({ reminder }: Props) {
  const { selectedId, setSelectedId, currentRole } = useReminderStore();
  const active = selectedId === reminder.id;
  const isDisputed = reminder.status === 'disputed';
  const isMine = reminder.currentOwnerRole === currentRole && reminder.status !== 'completed';
  const hasActiveRisk = reminder.riskLevel !== 'none';
  const isHighRisk = reminder.riskLevel === 'high' || reminder.riskLevel === 'critical';
  const handover = getHandoverInfo(reminder);

  return (
    <div
      onClick={() => setSelectedId(reminder.id)}
      className={`row-hover cursor-pointer transition-colors border-b border-slate-100 relative overflow-hidden ${
        active ? 'bg-navy-50/70' : ''
      } ${isDisputed ? 'disputed-row' : ''}`}
    >
      {isHighRisk && (
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${riskLevelMap[reminder.riskLevel].dotClass}`} />
      )}
      {hasActiveRisk && !isHighRisk && (
        <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${riskLevelMap[reminder.riskLevel].dotClass}`} />
      )}
    
      <div className="grid grid-cols-12 gap-4 px-6 py-3.5 items-center text-sm">
        <div className="col-span-2 flex items-center gap-3 min-w-0">
          <Avatar name={reminder.student.name} size="md" />
          <div className="min-w-0">
            <div className="font-medium text-slate-800 truncate">
              {reminder.student.name}
              {isMine && (
                <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot align-middle" />
              )}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {motorcycleTypeMap[reminder.student.motorcycleType] || reminder.student.motorcycleType}型
            </div>
          </div>
        </div>

        <div className="col-span-2">
          <div className="font-medium text-slate-700 truncate">{reminder.subject}</div>
          <div className="text-xs text-slate-500 mt-0.5 truncate" title={reminder.reason}>
            {reminder.reason}
          </div>
        </div>

        <div className="col-span-1 text-center">
          <span className="inline-flex items-baseline gap-0.5">
            <span className="font-semibold text-slate-800">{reminder.makeupHours}</span>
            <span className="text-xs text-slate-500">课时</span>
          </span>
        </div>

        <div className="col-span-1 flex flex-col gap-1">
          <StatusBadge status={reminder.status} pulse={isMine} />
          {hasActiveRisk && (
            <span
              className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border ${
                riskLevelMap[reminder.riskLevel].badgeClass
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${riskLevelMap[reminder.riskLevel].dotClass}`} />
              {riskLevelMap[reminder.riskLevel].label}
            </span>
          )}
        </div>

        <div className="col-span-2 flex items-center gap-2 min-w-0">
          <Avatar name={reminder.currentOwnerName} role={reminder.currentOwnerRole} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-slate-700 font-medium truncate">{reminder.currentOwnerName}</span>
              {handover.isGapRisk && handover.gapLevel === 'danger' && (
                <AlertOctagon size={12} className="text-red-500 flex-shrink-0" />
              )}
              {handover.isGapRisk && handover.gapLevel === 'warning' && (
                <Clock size={12} className="text-amber-500 flex-shrink-0" />
              )}
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <span className={roleMap[reminder.currentOwnerRole].className + ' px-1 py-0.5 rounded-sm'}>
                {roleMap[reminder.currentOwnerRole].label}
              </span>
              {handover.nextRole && reminder.status !== 'completed' && (
                <>
                  <ArrowRight size={10} className="text-slate-300" />
                  <span className="text-slate-400">{handover.nextLabel}</span>
                </>
              )}
            </div>
            {reminder.status !== 'completed' && (
              <div className={`text-xs mt-0.5 flex items-center gap-0.5 ${
                handover.isOverdue
                  ? handover.isGapRisk ? 'text-red-600 font-medium' : 'text-amber-600'
                  : handover.gapLevel === 'warning'
                  ? 'text-amber-600'
                  : 'text-slate-400'
              }`}>
                <Clock size={10} className="flex-shrink-0" />
                <span>{handover.timeRemaining}</span>
                {handover.isGapRisk && handover.isOverdue && (
                  <span className="text-red-600 font-medium ml-1">·空档风险</span>
                )}
                {handover.isGapRisk && !handover.isOverdue && handover.gapLevel === 'warning' && (
                  <span className="text-amber-600 ml-1">·临近空档</span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="col-span-1 text-right">
          <span className="text-accent-dark font-semibold">¥{reminder.fee.totalAmount}</span>
        </div>

        <div className="col-span-2 text-xs text-slate-500 text-right">
          <div>{formatDateTime(reminder.createdAt)}</div>
          {reminder.scheduledAt && (
            <div className="text-navy-600 mt-0.5">安排: {formatDateTime(reminder.scheduledAt)}</div>
          )}
        </div>

        <div className="col-span-1 text-right">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedId(reminder.id);
            }}
            className="text-navy-600 hover:text-navy-800 text-xs font-medium hover:underline"
          >
            查看详情 →
          </button>
        </div>
      </div>
    </div>
  );
}
