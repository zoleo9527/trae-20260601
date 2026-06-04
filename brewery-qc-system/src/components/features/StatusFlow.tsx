import { BATCH_STATUS_LABELS, ROLE_DOT_COLORS } from '@/types';
import type { BatchStatus, StatusLog, UserRole } from '@/types';
import { Check, AlertTriangle, X, Clock } from 'lucide-react';

const FLOW_STEPS: BatchStatus[] = ['PENDING_TEST', 'TESTING', 'TEST_PASSED', 'RELEASED'];
const ABNORMAL_BRANCH: BatchStatus = 'TEST_ABNORMAL';
const REJECT_BRANCH: BatchStatus = 'REJECTED';

function getStepIndex(status: BatchStatus): number {
  if (status === 'REJECTED') return 2;
  if (status === 'TEST_ABNORMAL') return 2;
  return FLOW_STEPS.indexOf(status);
}

function isCurrentStep(status: BatchStatus, step: BatchStatus): boolean {
  if (step === 'TEST_PASSED' && (status === 'TEST_ABNORMAL' || status === 'REJECTED')) return true;
  return status === step;
}

function isStepCompleted(currentStatus: BatchStatus, step: BatchStatus): boolean {
  const currentIdx = getStepIndex(currentStatus);
  const stepIdx = FLOW_STEPS.indexOf(step);
  if (currentIdx > stepIdx) return true;
  if (currentStatus === 'RELEASED' || currentStatus === 'REJECTED') return stepIdx <= 2;
  return false;
}

interface StatusFlowProps {
  currentStatus: BatchStatus;
  statusLogs: StatusLog[];
  compact?: boolean;
}

export function StatusFlow({ currentStatus, statusLogs, compact = false }: StatusFlowProps) {
  const hasAbnormal = currentStatus === 'TEST_ABNORMAL';
  const hasRejected = currentStatus === 'REJECTED';

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {FLOW_STEPS.map((step, i) => {
          const completed = isStepCompleted(currentStatus, step);
          const current = isCurrentStep(currentStatus, step);
          return (
            <div key={step} className="flex items-center">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  completed
                    ? 'bg-hop-green text-white'
                    : current
                    ? step === 'TEST_PASSED' && (hasAbnormal || hasRejected)
                      ? 'bg-warning-orange text-white'
                      : 'bg-amber-900 text-white'
                    : 'bg-neutral-200 text-neutral-400'
                }`}
              >
                {completed ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              {i < FLOW_STEPS.length - 1 && (
                <div className={`w-4 h-0.5 ${completed ? 'bg-hop-green' : 'bg-neutral-200'}`} />
              )}
            </div>
          );
        })}
        {(hasAbnormal || hasRejected) && (
          <>
            <div className={`w-4 h-0.5 ${hasRejected ? 'bg-red-500' : 'bg-warning-orange'}`} />
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                hasRejected ? 'bg-red-500 text-white' : 'bg-warning-orange text-white'
              }`}
            >
              {hasRejected ? <X className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 rounded-xl p-4">
      <h4 className="text-sm font-semibold text-neutral-800 mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4" />
        状态流转
      </h4>

      <div className="flex items-center gap-2">
        {FLOW_STEPS.map((step, i) => {
          const completed = isStepCompleted(currentStatus, step);
          const current = isCurrentStep(currentStatus, step);
          const isAbnormalStep = step === 'TEST_PASSED' && (hasAbnormal || hasRejected);
          const lastLog = statusLogs.find((l) => l.toStatus === step);

          return (
            <div key={step} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    completed && !isAbnormalStep
                      ? 'bg-hop-green text-white shadow-sm'
                      : current && isAbnormalStep
                      ? 'bg-warning-orange text-white shadow-sm animate-pulse-warning'
                      : current
                      ? 'bg-amber-900 text-white shadow-sm'
                      : 'bg-neutral-200 text-neutral-400'
                  }`}
                >
                  {completed && !isAbnormalStep ? (
                    <Check className="w-5 h-5" />
                  ) : current && isAbnormalStep ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    i + 1
                  )}
                </div>
                <span className={`text-xs mt-1.5 font-medium ${current ? 'text-neutral-800' : 'text-neutral-500'}`}>
                  {BATCH_STATUS_LABELS[step]}
                </span>
                {lastLog && (
                  <div className="flex items-center gap-1 mt-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: ROLE_DOT_COLORS[lastLog.role] }}
                    />
                    <span className="text-xs text-neutral-400">{lastLog.operatedBy}</span>
                  </div>
                )}
              </div>
              {i < FLOW_STEPS.length - 1 && (
                <div className={`w-8 h-0.5 mb-6 ${completed ? 'bg-hop-green' : 'bg-neutral-200'}`} />
              )}
            </div>
          );
        })}

        {(hasAbnormal || hasRejected) && (
          <>
            <div className={`w-8 h-0.5 mb-6 ${hasRejected ? 'bg-red-500' : 'bg-warning-orange'}`} />
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  hasRejected ? 'bg-red-500 text-white' : 'bg-warning-orange text-white'
                } animate-pulse-warning`}
              >
                {hasRejected ? <X className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              </div>
              <span className={`text-xs mt-1.5 font-medium ${hasRejected ? 'text-red-600' : 'text-warning-orange'}`}>
                {BATCH_STATUS_LABELS[hasRejected ? REJECT_BRANCH : ABNORMAL_BRANCH]}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
