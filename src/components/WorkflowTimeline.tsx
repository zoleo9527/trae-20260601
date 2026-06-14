import { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  FilePlus,
  FileCheck,
  Calculator,
  ChevronDown,
  ChevronUp,
  User,
  MessageSquare,
} from 'lucide-react';
import type { Claim, WorkflowLog, Handler } from '@/types';
import {
  ACTION_LABELS,
  STATUS_LABELS,
  ROLE_LABELS,
  STATUS_COLORS,
} from '@/types';
import { formatDateTime } from '@/utils/workflow';
import { cn } from '@/lib/utils';

interface WorkflowTimelineProps {
  claim: Claim;
  handlers: Handler[];
  expanded?: boolean;
}

const getActionIcon = (actionType: string) => {
  switch (actionType) {
    case 'create':
      return FilePlus;
    case 'approve':
      return CheckCircle;
    case 'reject':
      return XCircle;
    case 'supplement':
      return FilePlus;
    case 'material_ok':
      return FileCheck;
    case 'start_calc':
      return Calculator;
    case 'finish_calc':
      return CheckCircle;
    case 'urge':
      return AlertTriangle;
    default:
      return Clock;
  }
};

const getActionColor = (actionType: string) => {
  switch (actionType) {
    case 'create':
      return 'bg-slate-500';
    case 'approve':
      return 'bg-emerald-500';
    case 'reject':
      return 'bg-amber-500';
    case 'supplement':
      return 'bg-blue-500';
    case 'material_ok':
      return 'bg-blue-500';
    case 'start_calc':
      return 'bg-purple-500';
    case 'finish_calc':
      return 'bg-emerald-600';
    case 'urge':
      return 'bg-red-500';
    default:
      return 'bg-slate-400';
  }
};

const TimelineItem = ({
  log,
  handler,
  isLast,
  isUrged,
}: {
  log: WorkflowLog;
  handler: Handler | undefined;
  isLast: boolean;
  isUrged: boolean;
}) => {
  const [expanded, setExpanded] = useState(false);
  const Icon = getActionIcon(log.actionType);
  const actionColor = getActionColor(log.actionType);

  return (
    <div className="relative pl-8 pb-6 last:pb-0">
      {!isLast && (
        <div
          className={cn(
            'absolute left-[15px] top-8 h-full w-0.5',
            isUrged ? 'bg-red-200' : 'bg-slate-200'
          )}
        />
      )}

      <div
        className={cn(
          'absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white shadow-md',
          actionColor
        )}
      >
        <Icon className="h-4 w-4 text-white" />
      </div>

      <div
        className={cn(
          'rounded-lg border bg-white p-4 shadow-sm transition-all hover:shadow-md',
          isUrged && 'border-red-200 bg-red-50/50',
          log.durationHours > 24 && 'border-amber-200'
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-800">
                {ACTION_LABELS[log.actionType]}
              </span>
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white',
                  STATUS_COLORS[log.toStatus]
                )}
              >
                {STATUS_LABELS[log.toStatus]}
              </span>
              {log.durationHours > 24 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  <Clock className="h-3 w-3" />
                  停留 {log.durationHours.toFixed(1)} 小时
                </span>
              )}
              {isUrged && log.actionType !== 'urge' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
                  <AlertTriangle className="h-3 w-3" />
                  被催办
                </span>
              )}
            </div>

            <div className="mt-2 flex items-center gap-4 text-sm text-slate-500 flex-wrap">
              {handler && (
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  <span>
                    {handler.name} ({ROLE_LABELS[handler.role]})
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{formatDateTime(log.createdAt)}</span>
              </div>
            </div>

            {log.reason && (
              <div className="mt-3">
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-800"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>操作原因说明</span>
                  {expanded ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </button>
                {expanded && (
                  <div className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700 leading-relaxed">
                    {log.reason}
                  </div>
                )}
              </div>
            )}

            {log.fromStatus && (
              <div className="mt-2 text-xs text-slate-400">
                状态流转：{STATUS_LABELS[log.fromStatus]} →{' '}
                {STATUS_LABELS[log.toStatus]}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function WorkflowTimeline({
  claim,
  handlers,
  expanded = true,
}: WorkflowTimelineProps) {
  const [showAll, setShowAll] = useState(expanded);
  const displayLogs = showAll
    ? claim.workflowLogs
    : claim.workflowLogs.slice(-5);

  const hasUrgeRecord = claim.urgeRecords.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800">流转时间线</h3>
        <div className="flex items-center gap-4">
          {hasUrgeRecord && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-600">
              <AlertTriangle className="h-4 w-4" />
              已被催办 {claim.urgeCount} 次
            </span>
          )}
          {claim.workflowLogs.length > 5 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {showAll ? '收起' : `展开全部 (${claim.workflowLogs.length})`}
            </button>
          )}
        </div>
      </div>

      <div className="mt-4">
        {displayLogs.map((log, index) => (
          <TimelineItem
            key={log.id}
            log={log}
            handler={handlers.find((h) => h.id === log.handlerId)}
            isLast={index === displayLogs.length - 1}
            isUrged={claim.status === 'urged' && index === displayLogs.length - 1}
          />
        ))}
      </div>

      {claim.supplementMaterials.length > 0 && (
        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50/50 p-4">
          <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
            <FilePlus className="h-4 w-4" />
            补材料记录
          </h4>
          <div className="space-y-2">
            {claim.supplementMaterials.map((material) => (
              <div
                key={material.id}
                className={cn(
                  'flex items-center justify-between rounded-lg p-3',
                  material.status === 'provided'
                    ? 'bg-emerald-50 border border-emerald-200'
                    : 'bg-amber-50 border border-amber-200'
                )}
              >
                <div>
                  <p className="font-medium text-slate-800">{material.name}</p>
                  <p className="text-sm text-slate-500">{material.description}</p>
                </div>
                <div className="text-right">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                      material.status === 'provided'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    )}
                  >
                    {material.status === 'provided' ? '已提供' : '待提供'}
                  </span>
                  <p className="mt-1 text-xs text-slate-400">
                    要求：{formatDateTime(material.requestedAt)}
                  </p>
                  {material.providedAt && (
                    <p className="text-xs text-slate-400">
                      提供：{formatDateTime(material.providedAt)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {claim.urgeRecords.length > 0 && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50/50 p-4">
          <h4 className="font-bold text-red-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            催办记录
          </h4>
          <div className="space-y-2">
            {claim.urgeRecords.map((record, index) => {
              const operator = handlers.find((h) => h.id === record.operatorId);
              const target = handlers.find((h) => h.id === record.targetHandlerId);
              return (
                <div
                  key={record.id}
                  className="rounded-lg bg-white p-3 border border-red-100"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-800">
                      第 {index + 1} 次催办
                    </span>
                    <span className="text-xs text-slate-400">
                      {formatDateTime(record.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{record.message}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {operator?.name} → {target?.name}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
