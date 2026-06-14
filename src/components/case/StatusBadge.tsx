import { useState } from 'react';
import type { CaseStage, TaskStatus } from '@/types';
import { STAGE_META } from '@/data/constants';
import { formatDuration, formatDateTime } from '@/utils/timeUtils';
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface Props {
  stage: CaseStage;
  status: TaskStatus;
  stuckHours: number;
  arrivedAt?: string;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ stage, status, stuckHours, arrivedAt, size = 'md' }: Props) {
  const [hover, setHover] = useState(false);
  const meta = STAGE_META[stage];
  const isOverdue = stuckHours >= 48;
  const isWarn = stuckHours >= 24 && stuckHours < 48;

  const statusIcon =
    status === 'completed' ? (
      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
    ) : status === 'overdue' ? (
      <AlertTriangle className="h-3 w-3 text-rose-600 animate-pulse" />
    ) : (
      <Clock className={`h-3 w-3 ${isOverdue ? 'text-rose-600 animate-pulse' : isWarn ? 'text-amber-600' : 'text-slate-500'}`} />
    );

  const padY = size === 'sm' ? 'py-0.5' : 'py-1';
  const padX = size === 'sm' ? 'px-1.5' : 'px-2';

  return (
    <span className="relative inline-block" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <span
        className={`inline-flex items-center gap-1.5 ${padY} ${padX} rounded-md border-l-[3px] ${meta.bgColor} ${meta.color} ${meta.borderColor} font-medium ${
          size === 'sm' ? 'text-[11px]' : 'text-xs'
        } ${isOverdue ? 'ring-1 ring-rose-300 shadow-sm shadow-rose-100' : ''}`}
      >
        {statusIcon}
        <span>{meta.label}</span>
        {stuckHours > 0 && status !== 'completed' && (
          <span
            className={`ml-0.5 rounded px-1 ${
              isOverdue ? 'bg-rose-100 text-rose-700' : isWarn ? 'bg-amber-100 text-amber-700' : 'bg-white/70 text-slate-600'
            }`}
          >
            {formatDuration(stuckHours)}
          </span>
        )}
      </span>
      {hover && arrivedAt && (
        <span className="absolute left-0 top-full z-50 mt-1.5 w-56 rounded-md border border-slate-200 bg-white p-2 text-[11px] text-slate-700 shadow-lg">
          <div className="flex justify-between gap-2">
            <span className="text-slate-500">到达时间</span>
            <span className="font-mono">{formatDateTime(arrivedAt)}</span>
          </div>
          <div className="mt-1 flex justify-between gap-2">
            <span className="text-slate-500">已停留</span>
            <span className="font-mono text-amber-700">{formatDuration(stuckHours)}</span>
          </div>
          <div className="mt-1 flex justify-between gap-2">
            <span className="text-slate-500">预计完成</span>
            <span className="font-mono text-emerald-700">{isOverdue ? '已超时' : '正常范围内'}</span>
          </div>
        </span>
      )}
    </span>
  );
}
