import { useNavigate } from 'react-router-dom';
import { AlertCircle, Clock, FileText, User, ExternalLink } from 'lucide-react';
import type { OperationLog } from '../../shared/types';
import { ROLE_LABELS } from '../../shared/types';

interface TimelineProps {
  logs: OperationLog[];
  clickable?: boolean;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function Timeline({ logs, clickable = false }: TimelineProps) {
  const navigate = useNavigate();

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
            <div
              className={`bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 ${
                clickable ? 'cursor-pointer hover:bg-slate-800 hover:border-slate-600 transition-colors' : ''
              }`}
              onClick={() => {
                if (clickable) {
                  navigate(`/records?recordId=${log.recordId}`);
                }
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-slate-100 text-sm">{log.operation}</span>
                <span className="flex items-center text-xs text-slate-400 gap-2">
                  {clickable && <ExternalLink className="w-3 h-3 text-slate-500" />}
                  <Clock className="w-3 h-3" />
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

              {(log.returnReason || log.discrepancyRemark || log.remark) && (
                <div className="mt-2 space-y-1.5">
                  {log.returnReason && (
                    <div className="text-xs bg-orange-500/10 border border-orange-500/20 rounded p-2">
                      <span className="flex items-center gap-1 text-orange-300 font-medium mb-0.5">
                        <AlertCircle className="w-3 h-3" />
                        退回原因
                      </span>
                      <p className="text-orange-200">{log.returnReason}</p>
                    </div>
                  )}
                  {log.discrepancyRemark && (
                    <div className="text-xs bg-blue-500/10 border border-blue-500/20 rounded p-2">
                      <span className="flex items-center gap-1 text-blue-300 font-medium mb-0.5">
                        <FileText className="w-3 h-3" />
                        补充备注
                      </span>
                      <p className="text-blue-200">{log.discrepancyRemark}</p>
                    </div>
                  )}
                  {log.remark && !log.returnReason && !log.discrepancyRemark && (
                    <p className="text-xs text-slate-300 bg-slate-900/50 rounded p-2">
                      {log.remark}
                    </p>
                  )}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
