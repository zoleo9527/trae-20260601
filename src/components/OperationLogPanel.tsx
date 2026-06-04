import { useState } from 'react';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';
import type { OperationLog } from '../../shared/types';
import { ROLE_LABELS } from '../../shared/types';
import { formatDateTime } from '../utils/format';
import { cn } from '../lib/utils';

interface OperationLogPanelProps {
  logs: OperationLog[];
}

export function OperationLogPanel({ logs }: OperationLogPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const displayLogs = expanded ? logs : logs.slice(0, 3);

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-500" />
          <span className="font-medium text-sm text-slate-700">操作日志</span>
          <span className="px-1.5 py-0.5 text-xs bg-slate-200 text-slate-600 rounded">
            {logs.length}
          </span>
        </div>
        {logs.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
          >
            {expanded ? (
              <>
                收起 <ChevronUp className="w-3 h-3" />
              </>
            ) : (
              <>
                展开全部 <ChevronDown className="w-3 h-3" />
              </>
            )}
          </button>
        )}
      </div>
      <div className="divide-y divide-slate-100">
        {displayLogs.map((log, index) => (
          <div
            key={log.id}
            className={cn(
              'px-4 py-3 hover:bg-slate-50 transition-colors',
              index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900">
                    {log.operationType}
                  </span>
                  <span className="px-1.5 py-0.5 text-xs bg-teal-50 text-teal-700 rounded">
                    {ROLE_LABELS[log.operatorRole]}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600 break-words">{log.content}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-xs text-slate-500">{log.operatorName}</span>
                <span className="text-xs text-slate-400">{formatDateTime(log.createdAt)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
