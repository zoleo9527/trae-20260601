import { CheckCircle, Clock, AlertTriangle, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { STATUS_LABELS } from '../types';
import type { TourGroupStatus } from '../types';

interface TimelineEvent {
  status: TourGroupStatus;
  time: string | null;
  label: string;
  actor: string;
}

export default function TimelineView() {
  const { timelineModalOpen, setTimelineModalOpen, tourGroups, dispatches, checkIns, fleetAssignments, guides, selectedTourGroupId } =
    useAppStore();

  const tourGroup = tourGroups.find((tg) => tg.id === selectedTourGroupId);
  const dispatch = dispatches.find((d) => d.tourGroupId === selectedTourGroupId);
  const checkIn = checkIns.find((ci) => ci.tourGroupId === selectedTourGroupId);
  const fleet = fleetAssignments.find((f) => f.tourGroupId === selectedTourGroupId);
  const guide = dispatch ? guides.find((g) => g.id === dispatch.guideId) : undefined;

  if (!timelineModalOpen || !tourGroup) return null;

  const events: TimelineEvent[] = [
    { status: 'pending_dispatch', time: tourGroup.createdAt, label: '行程单创建', actor: '系统' },
    ...(dispatch
      ? [{ status: 'dispatched' as TourGroupStatus, time: dispatch.dispatchedAt, label: '导游派遣', actor: guide?.name || '未知' }]
      : []),
    ...(checkIn
      ? [
          {
            status: (checkIn.checkInStatus === 'exception' ? 'stuck' : 'checked_in') as TourGroupStatus,
            time: checkIn.checkedInAt,
            label: checkIn.checkInStatus === 'exception' ? '签到异常上报' : '接团签到',
            actor: guide?.name || '未知',
          },
        ]
      : []),
    ...(fleet
      ? [
          {
            status: (fleet.fleetStatus === 'delayed' ? 'stuck' : 'fleet_ready') as TourGroupStatus,
            time: fleet.confirmedAt,
            label: fleet.fleetStatus === 'delayed' ? '车队延误' : '车队就位确认',
            actor: fleet.driverName,
          },
        ]
      : []),
    ...(tourGroup.status === 'completed'
      ? [{ status: 'completed' as TourGroupStatus, time: fleet?.confirmedAt, label: '正常关闭', actor: '系统' }]
      : []),
  ];

  const getNodeStyle = (status: TourGroupStatus) => {
    if (status === 'stuck') return 'bg-amber-500 animate-pulse';
    if (status === 'completed' || status === 'checked_in' || status === 'fleet_ready') return 'bg-emerald-500';
    return 'bg-blue-500';
  };

  const getIcon = (status: TourGroupStatus) => {
    if (status === 'stuck') return <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />;
    if (status === 'completed' || status === 'checked_in' || status === 'fleet_ready') return <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />;
    return <Clock className="w-3.5 h-3.5 text-blue-600" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setTimelineModalOpen(false)} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-800">签到记录回看</h2>
            <div className="text-xs text-slate-400 font-mono mt-0.5">{tourGroup.groupCode}</div>
          </div>
          <button onClick={() => setTimelineModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 transition">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="mb-4">
            <div className="font-semibold text-slate-800">{tourGroup.tourName}</div>
            <div className="text-sm text-slate-500 mt-0.5">{tourGroup.route} · {tourGroup.tourDate}</div>
          </div>

          <div className="relative pl-6">
            <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-slate-200" />
            {events.map((event, idx) => (
              <div key={idx} className="relative mb-6 last:mb-0">
                <div
                  className={`absolute -left-6 top-1 w-[18px] h-[18px] rounded-full border-2 border-white shadow-sm flex items-center justify-center ${getNodeStyle(event.status)}`}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
                <div className="ml-2">
                  <div className="flex items-center gap-2">
                    {getIcon(event.status)}
                    <span className="text-sm font-semibold text-slate-800">{event.label}</span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${
                        event.status === 'stuck'
                          ? 'bg-amber-50 text-amber-700'
                          : event.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {STATUS_LABELS[event.status]}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {event.time ? new Date(event.time).toLocaleString('zh-CN') : '—'} · {event.actor}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {tourGroup.status === 'stuck' && checkIn?.exception && (
            <div className="mt-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm font-medium text-amber-800">异常说明</div>
                  <div className="text-sm text-amber-700 mt-1">{checkIn.exception}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
