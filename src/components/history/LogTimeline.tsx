import {
  FilePlus,
  Send,
  CheckCircle,
  XCircle,
  Lock,
  Unlock,
  BadgeCheck,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OperationLog, OperationType, HouseStatus, ControlStage } from '@/types';
import { HOUSE_STATUS_MAP, STAGE_MAP } from '@/utils/status';
import { formatDateTime } from '@/utils/date';

interface LogTimelineProps {
  logs: OperationLog[];
  className?: string;
}

const OPERATION_ICONS: Record<OperationType, typeof FilePlus> = {
  create_application: FilePlus,
  submit_for_review: Send,
  review_approve: CheckCircle,
  review_reject: XCircle,
  lock_house: Lock,
  unlock_house: Unlock,
  complete_sale: BadgeCheck,
  update_remark: MessageSquare,
};

const OPERATION_COLORS: Record<OperationType, string> = {
  create_application: 'bg-primary text-white border-primary',
  submit_for_review: 'bg-secondary text-white border-secondary',
  review_approve: 'bg-success text-white border-success',
  review_reject: 'bg-danger text-white border-danger',
  lock_house: 'bg-secondary text-white border-secondary',
  unlock_house: 'bg-slate-500 text-white border-slate-500',
  complete_sale: 'bg-success text-white border-success',
  update_remark: 'bg-slate-400 text-white border-slate-400',
};

const STATUS_COLORS: Record<HouseStatus, string> = {
  available: 'text-success',
  locked: 'text-secondary',
  sold: 'text-slate-500',
  reserved: 'text-primary',
};

function getStageBadgeColor(stage?: ControlStage): string {
  if (!stage) return 'bg-slate-100 text-slate-500';
  const colorMap: Record<ControlStage, string> = {
    application: 'bg-primary/10 text-primary',
    review: 'bg-secondary/10 text-secondary',
    lock: 'bg-success/10 text-success',
    completed: 'bg-slate-500/10 text-slate-600',
    rejected: 'bg-danger/10 text-danger',
  };
  return colorMap[stage];
}

function getRemarkSourceLabel(source?: string): string {
  const sourceMap: Record<string, string> = {
    application: '销控申请',
    review: '经理审核',
    lock: '执行锁定',
    complete: '完成销售',
  };
  return source ? sourceMap[source] || source : '';
}

export default function LogTimeline({ logs, className }: LogTimelineProps) {
  if (logs.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-slate-400', className)}>
        <MessageSquare className="w-12 h-12 mb-3 opacity-50" />
        <p className="text-sm">暂无操作日志</p>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 bg-slate-200" />

      <div className="space-y-8">
        {logs.map((log, index) => {
          const isLeft = index % 2 === 0;
          const Icon = OPERATION_ICONS[log.operationType];
          const colorClass = OPERATION_COLORS[log.operationType];

          return (
            <div key={log.id} className="relative flex items-center">
              <div className={cn(
                'w-5/12',
                isLeft ? 'pr-8 text-right' : 'pl-8 ml-auto'
              )}>
                <div className={cn(
                  'p-4 rounded-xl border transition-all duration-200 hover:shadow-md',
                  'bg-white border-slate-200',
                  isLeft ? 'mr-4' : 'ml-4'
                )}>
                  <div className={cn(
                    'flex items-center gap-2 mb-2',
                    isLeft ? 'justify-end' : 'justify-start'
                  )}>
                    <span className={cn(
                      'px-2 py-0.5 text-xs font-medium rounded-md',
                      getStageBadgeColor(log.afterStage)
                    )}>
                      {log.afterStage ? STAGE_MAP[log.afterStage] : '状态变更'}
                    </span>
                  </div>

                  <h4 className="font-medium text-slate-800 mb-2 flex items-center gap-2">
                    {!isLeft && <Icon className="w-4 h-4 text-slate-400" />}
                    {log.operationTypeName}
                    {isLeft && <Icon className="w-4 h-4 text-slate-400" />}
                  </h4>

                  {(log.beforeStatus !== log.afterStatus || log.beforeStage !== log.afterStage) && (
                    <div className={cn(
                      'flex items-center gap-2 mb-2 text-sm',
                      isLeft ? 'justify-end' : 'justify-start'
                    )}>
                      {log.beforeStage && log.afterStage && log.beforeStage !== log.afterStage && (
                        <div className="flex items-center gap-1">
                          <span className={cn('px-1.5 py-0.5 rounded text-xs', getStageBadgeColor(log.beforeStage))}>
                            {STAGE_MAP[log.beforeStage]}
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className={cn('px-1.5 py-0.5 rounded text-xs', getStageBadgeColor(log.afterStage))}>
                            {STAGE_MAP[log.afterStage]}
                          </span>
                        </div>
                      )}
                      {log.beforeStatus !== log.afterStatus && (
                        <div className="flex items-center gap-1">
                          <span className={cn('text-xs font-medium', STATUS_COLORS[log.beforeStatus])}>
                            {HOUSE_STATUS_MAP[log.beforeStatus]}
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className={cn('text-xs font-medium', STATUS_COLORS[log.afterStatus])}>
                            {HOUSE_STATUS_MAP[log.afterStatus]}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {log.remark && (
                    <div className={cn(
                      'p-3 rounded-lg bg-slate-50 mb-2',
                      isLeft ? 'text-right' : 'text-left'
                    )}>
                      <p className="text-sm text-slate-600">{log.remark}</p>
                      {log.remarkSource && (
                        <span className={cn(
                          'inline-block mt-1 text-xs text-slate-400',
                          isLeft ? 'text-right' : 'text-left'
                        )}>
                          来源：{getRemarkSourceLabel(log.remarkSource)}
                        </span>
                      )}
                    </div>
                  )}

                  <div className={cn(
                    'flex items-center gap-2 text-xs text-slate-500',
                    isLeft ? 'justify-end' : 'justify-start'
                  )}>
                    <span className="font-medium text-slate-700">{log.operatorName}</span>
                    <span className="text-slate-400">({log.operatorRoleName})</span>
                    <span className="text-slate-300">·</span>
                    <span>{formatDateTime(log.timestamp)}</span>
                  </div>
                </div>
              </div>

              <div className="absolute left-1/2 -translate-x-1/2 z-10">
                <div className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border-2 shadow-lg',
                  colorClass
                )}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
