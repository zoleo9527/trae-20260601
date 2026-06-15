import { WorkOrderStatusLabel, WorkOrderStatusColor, RoleLabel, RoleColor } from "~/utils/constants";
import { formatDateTime, timeAgo } from "~/utils/misc";

interface TimelineEvent {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  eventType: string;
  description: string;
  createdAt: string | Date;
  responsible: {
    id: string;
    name: string;
    role: string;
  };
}

interface TimelineProps {
  events: TimelineEvent[];
}

export function Timeline({ events }: TimelineProps) {
  if (events.length === 0) {
    return (
      <div className="text-sm text-slate-500 py-4 text-center">
        暂无时间线记录
      </div>
    );
  }

  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <ol className="relative border-l-2 border-slate-200 ml-3">
      {sortedEvents.map((event, index) => (
        <li key={event.id} className="mb-6 ml-6">
          <span className="absolute -left-2.5 flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 border-2 border-blue-500">
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
          </span>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    WorkOrderStatusColor[event.toStatus] || "bg-gray-100 text-gray-800"
                  }`}
                >
                  {WorkOrderStatusLabel[event.toStatus] || event.toStatus}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${RoleColor[event.responsible.role]}`}>
                  {RoleLabel[event.responsible.role]}
                </span>
                <span className="text-sm font-medium text-slate-900">{event.responsible.name}</span>
              </div>
              <p className="text-sm text-slate-700">{event.description}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-slate-500">{formatDateTime(event.createdAt)}</p>
              <p className="text-xs text-slate-400 mt-0.5">{timeAgo(event.createdAt)}</p>
            </div>
          </div>
          {index === 0 && (
            <div className="absolute left-0 top-0 -ml-[11px] flex items-center justify-center">
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
