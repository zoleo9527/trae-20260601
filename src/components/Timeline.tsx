import { Clock, User } from 'lucide-react';
import type { OperationLog } from '../../shared/types';
import { ROLE_LABELS, STATUS_COLORS } from '../../shared/types';

interface TimelineProps {
  logs: OperationLog[];
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function Timeline({ logs }: TimelineProps) {
  if (logs.length === 0) {
    return <div className="text-slate-400 text-sm py-8 text-center">暂无操作记录</div>;
  }

  return (
    <div className="relative">
      <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-slate-700" />
      <ul className="space-y-4">
        {logs.map((log) => (
          <li key={log.id} className="relative pl-8">
            <div className={`absolute left-1.5 top-1.5 w-3 h-3 rounded-full ring-2 ring-slate-800 ${
              log.operatorRole === 'dispatcher' ? 'bg-blue-500' :
              log.operatorRole === 'forklift' ? 'bg-amber-500' :
              'bg-emerald-500'
            }`} />
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-slate-100 text-sm">{log.operation}</span>
                <span className="flex items-center text-xs text-slate-400">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatTime(log.operateTime)}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center">
                  <User className="w-3 h-3 mr-1" />
                  {log.operatorName}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-slate-700/50">
                  {ROLE_LABELS[log.operatorRole]}
                </span>
              </div>
              {log.remark && (
                <p className="mt-2 text-xs text-slate-300 bg-slate-900/50 rounded p-2">
                  {log.remark}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
