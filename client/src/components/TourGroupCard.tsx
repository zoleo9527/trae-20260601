import { Clock, MapPin, Users, Siren, MessageSquarePlus, CheckCircle2 } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { calcStuckDuration, formatStuckDuration, isStuckOver24h } from '../store/useAppStore';
import type { TourGroup, Dispatch, CheckIn, FleetAssignment, Guide } from '../types';

interface TourGroupCardProps {
  tourGroup: TourGroup;
  dispatch?: Dispatch;
  checkIn?: CheckIn;
  fleet?: FleetAssignment;
  guide?: Guide;
  onClick?: () => void;
  showActions?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
  onFollowUp?: () => void;
  onResolve?: () => void;
}

export default function TourGroupCard({
  tourGroup,
  dispatch,
  checkIn,
  fleet,
  guide,
  onClick,
  showActions,
  actionLabel,
  onAction,
  compact,
  onFollowUp,
  onResolve,
}: TourGroupCardProps) {
  const isStuck = tourGroup.status === 'stuck';
  const over24h = isStuck && isStuckOver24h(tourGroup.stuckAt);
  const durationMs = isStuck ? calcStuckDuration(tourGroup.stuckAt) : 0;
  const latestFollowUp = isStuck && tourGroup.followUps.length > 0 ? tourGroup.followUps[tourGroup.followUps.length - 1] : null;

  return (
    <div
      className={`relative bg-white rounded-lg border shadow-sm hover:shadow-md transition-all cursor-pointer group ${
        over24h
          ? 'border-l-4 border-l-red-500 border-2 border-red-400 shadow-red-100'
          : isStuck
          ? 'border-l-4 border-l-amber-500 border-amber-200'
          : 'border-slate-200'
      }`}
      onClick={onClick}
    >
      <div className={`${compact ? 'px-4 py-3' : 'px-5 py-4'}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                {tourGroup.groupCode}
              </span>
              <StatusBadge status={tourGroup.status} />
              {over24h && <Siren className="w-4 h-4 text-red-500 shrink-0" />}
            </div>
            <h3 className="text-base font-semibold text-slate-800 truncate">{tourGroup.tourName}</h3>
            {!compact && (
              <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[200px]">{tourGroup.route}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {tourGroup.tourDate}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            {isStuck && (
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                over24h
                  ? 'bg-red-100 text-red-700 border border-red-300'
                  : 'bg-amber-100 text-amber-700 border border-amber-300'
              }`}>
                <Clock className="w-3 h-3 inline mr-1" />
                卡住 {formatStuckDuration(durationMs)}
              </span>
            )}
            {showActions && onAction && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAction();
                }}
                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-[#1e3a5f] text-white hover:bg-[#2a4f7f] transition-colors"
              >
                {actionLabel || '操作'}
              </button>
            )}
          </div>
        </div>

        {latestFollowUp && (
          <div className={`mt-2 text-xs px-3 py-1.5 rounded-md flex items-center gap-1.5 ${
            over24h ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
          }`}>
            <MessageSquarePlus className="w-3 h-3 shrink-0" />
            <span className="truncate">最近跟进：{latestFollowUp.content}</span>
            <span className="shrink-0 text-slate-400 ml-1">{new Date(latestFollowUp.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        )}

        {!compact && (
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-sm">
            {guide && (
              <span className="flex items-center gap-1.5 text-slate-600">
                <Users className="w-3.5 h-3.5" />
                <span className="font-medium">{guide.name}</span>
                <span className="text-slate-400">{guide.phone}</span>
              </span>
            )}
            {fleet && (
              <span className="flex items-center gap-1.5 text-slate-500">
                🚍 {fleet.plateNumber} · {fleet.driverName}
              </span>
            )}
          </div>
        )}

        {isStuck && checkIn?.exception && (
          <div className={`mt-2 px-3 py-2 rounded-md text-sm ${
            over24h
              ? 'bg-red-50 border border-red-200 text-red-800'
              : 'bg-amber-50 border border-amber-200 text-amber-800'
          }`}>
            ⚠ {checkIn.exception}
          </div>
        )}

        {isStuck && (
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100">
            {onFollowUp && (
              <button
                onClick={(e) => { e.stopPropagation(); onFollowUp(); }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition flex items-center gap-1 ${
                  over24h
                    ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
                添加跟进
              </button>
            )}
            {onResolve && (
              <button
                onClick={(e) => { e.stopPropagation(); onResolve(); }}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                标记已处理
              </button>
            )}
            {tourGroup.followUps.length > 0 && (
              <span className="text-xs text-slate-400 ml-auto">{tourGroup.followUps.length}条跟进</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
