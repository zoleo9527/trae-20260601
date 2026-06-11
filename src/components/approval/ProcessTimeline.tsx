import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ControlStage, StageRecord } from '@/types';
import { STAGE_MAP, getStageRecord } from '@/utils/status';
import { formatDateTime } from '@/utils/date';

interface ProcessNode {
  key: ControlStage;
  label: string;
  status: 'completed' | 'current' | 'pending';
  operator?: string;
  timestamp?: string;
}

interface ProcessTimelineProps {
  currentStage: ControlStage;
  stageHistory?: StageRecord[];
  className?: string;
}

const STAGE_ORDER: ControlStage[] = ['application', 'review', 'lock', 'completed'];

function getNodeStatus(
  stage: ControlStage,
  currentStage: ControlStage,
  index: number,
  currentIndex: number
): 'completed' | 'current' | 'pending' {
  if (currentStage === 'rejected') {
    return index < currentIndex ? 'completed' : 'pending';
  }
  if (index < currentIndex) return 'completed';
  if (index === currentIndex) return 'current';
  return 'pending';
}

function getNodeInfo(
  stage: ControlStage,
  stageHistory: StageRecord[] | undefined,
  status: 'completed' | 'current' | 'pending'
): { operator?: string; timestamp?: string } {
  if (status === 'pending') return {};

  const record = getStageRecord(stageHistory, stage);
  if (!record) return {};

  if (status === 'completed') {
    return {
      operator: record.handlerName,
      timestamp: record.completedAt,
    };
  }

  return {
    operator: record.handlerName,
    timestamp: record.receivedAt,
  };
}

export default function ProcessTimeline({
  currentStage,
  stageHistory,
  className,
}: ProcessTimelineProps) {
  const currentIndex = STAGE_ORDER.indexOf(currentStage as (typeof STAGE_ORDER)[number]);
  const actualCurrentIndex = currentIndex === -1 ? 0 : currentIndex;

  const nodes: ProcessNode[] = STAGE_ORDER.map((stage, index) => {
    const status = getNodeStatus(stage, currentStage, index, actualCurrentIndex);
    const info = getNodeInfo(stage, stageHistory, status);
    return {
      key: stage,
      label: STAGE_MAP[stage],
      status,
      ...info,
    };
  });

  return (
    <div className={cn('w-full py-6', className)}>
      <div className="relative flex items-start justify-between px-4">
        {nodes.map((node, index) => {
          const isLast = index === nodes.length - 1;
          const prevNode = nodes[index - 1];
          const isRejected = currentStage === 'rejected';

          return (
            <div key={node.key} className="relative flex flex-col items-center flex-1">
              {!isLast && (
                <div
                  className={cn(
                    'absolute top-4 left-1/2 h-0.5 w-full -translate-y-1/2',
                    node.status === 'completed' && prevNode?.status === 'completed'
                      ? 'bg-success'
                      : isRejected && node.status === 'completed'
                      ? 'bg-danger'
                      : 'bg-slate-200'
                  )}
                />
              )}

              <div className="relative z-10 flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300',
                    node.status === 'completed' && !isRejected && 'bg-success border-success',
                    node.status === 'completed' && isRejected && 'bg-danger border-danger',
                    node.status === 'current' && [
                      'bg-primary border-primary',
                      'animate-pulse ring-4 ring-primary/20',
                    ],
                    node.status === 'pending' && 'bg-white border-slate-300'
                  )}
                >
                  {node.status === 'completed' && !isRejected && (
                    <Check className="h-5 w-5 text-white" strokeWidth={3} />
                  )}
                  {node.status === 'completed' && isRejected && (
                    <span className="text-white text-xs font-bold">✕</span>
                  )}
                  {node.status === 'current' && (
                    <span className="h-3 w-3 rounded-full bg-white animate-ping" />
                  )}
                  {node.status === 'pending' && (
                    <span className="h-3 w-3 rounded-full bg-slate-300" />
                  )}
                </div>

                <span
                  className={cn(
                    'mt-2 text-sm font-medium text-center',
                    node.status === 'completed' && !isRejected && 'text-success',
                    node.status === 'completed' && isRejected && 'text-danger',
                    node.status === 'current' && 'text-primary',
                    node.status === 'pending' && 'text-slate-400'
                  )}
                >
                  {node.label}
                </span>

                {node.status !== 'pending' && node.operator && (
                  <span className="mt-1 text-xs text-slate-500 text-center">
                    {node.operator}
                  </span>
                )}

                {node.status !== 'pending' && node.timestamp && (
                  <span className="text-xs text-slate-400 text-center">
                    {formatDateTime(node.timestamp)}
                  </span>
                )}

                {node.status === 'pending' && (
                  <span className="mt-1 text-xs text-slate-400">未开始</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
