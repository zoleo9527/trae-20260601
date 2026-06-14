import StatusBadge from './StatusBadge';
import Avatar from './Avatar';
import { useReminderStore } from '../store/reminder';
import { formatDateTime, roleMap } from '../utils/format';
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

  return (
    <div
      onClick={() => setSelectedId(reminder.id)}
      className={`row-hover cursor-pointer transition-colors border-b border-slate-100 ${
        active ? 'bg-navy-50/70' : ''
      } ${isDisputed ? 'disputed-row' : ''}`}
    >
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

        <div className="col-span-1">
          <StatusBadge status={reminder.status} pulse={isMine} />
        </div>

        <div className="col-span-2 flex items-center gap-2 min-w-0">
          <Avatar name={reminder.currentOwnerName} role={reminder.currentOwnerRole} size="sm" />
          <div className="min-w-0">
            <div className="text-sm text-slate-700 truncate">{reminder.currentOwnerName}</div>
            <div className="text-xs text-slate-500">{roleMap[reminder.currentOwnerRole].label}</div>
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
