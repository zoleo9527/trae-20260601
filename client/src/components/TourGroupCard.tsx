import { Clock, MapPin, Users } from 'lucide-react';
import StatusBadge from './StatusBadge';
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
}: TourGroupCardProps) {
  const isStuck = tourGroup.status === 'stuck';

  return (
    <div
      className={`relative bg-white rounded-lg border shadow-sm hover:shadow-md transition-all cursor-pointer group ${
        isStuck ? 'border-l-4 border-l-amber-500 border-amber-200' : 'border-slate-200'
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
          {showActions && onAction && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction();
              }}
              className="shrink-0 px-3 py-1.5 text-sm font-medium rounded-lg bg-[#1e3a5f] text-white hover:bg-[#2a4f7f] transition-colors"
            >
              {actionLabel || '操作'}
            </button>
          )}
        </div>

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
          <div className="mt-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800">
            ⚠ {checkIn.exception}
          </div>
        )}
      </div>
    </div>
  );
}
