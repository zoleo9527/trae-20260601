import type { StatusChange, ConsultationStatus } from '../types';
import { CONSULTATION_STATUS_LABELS, CONSULTATION_STATUS_COLORS } from '../types';
import { useStaffStore } from '../stores/staffStore';
import { formatDateTime } from '../utils/format';
import StatusBadge from './StatusBadge';

interface StatusTimelineProps {
  entries: StatusChange[];
}

export default function StatusTimeline({ entries }: StatusTimelineProps) {
  const getById = useStaffStore((s) => s.getById);

  return (
    <div className="relative pl-6">
      {entries.map((entry, idx) => {
        const isLast = idx === entries.length - 1;
        const changer = getById(entry.changed_by);
        const changerName = changer?.name ?? entry.changed_by;

        return (
          <div key={entry.id} className="relative pb-6 last:pb-0">
            <div className="absolute left-[-1.375rem] top-1 w-3 h-3 rounded-full bg-brand-500 ring-2 ring-brand-100" />
            {!isLast && (
              <div className="absolute left-[-0.875rem] top-4 bottom-0 w-px bg-gray-200" />
            )}

            <div className="flex items-start gap-2 flex-wrap">
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {formatDateTime(entry.changed_at)}
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {entry.from_status ? (
                  <>
                    <StatusBadge
                      status={entry.from_status as ConsultationStatus}
                      labels={CONSULTATION_STATUS_LABELS}
                      colors={CONSULTATION_STATUS_COLORS}
                    />
                    <span className="text-gray-400 text-xs">→</span>
                  </>
                ) : null}
                <StatusBadge
                  status={entry.to_status as ConsultationStatus}
                  labels={CONSULTATION_STATUS_LABELS}
                  colors={CONSULTATION_STATUS_COLORS}
                />
              </div>
            </div>

            <div className="mt-1 text-xs text-gray-500">
              <span className="font-medium text-gray-600">{changerName}</span>
              {entry.remark && (
                <span className="ml-1.5 text-gray-400">— {entry.remark}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
