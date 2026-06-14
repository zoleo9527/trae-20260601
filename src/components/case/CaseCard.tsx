import type { Case } from '@/types';
import { STAGE_META, EXCEPTION_TYPE_LABEL, ROLE_META } from '@/data/constants';
import StatusBadge from '@/components/case/StatusBadge';
import RoleAvatar from '@/components/common/RoleAvatar';
import { AlertTriangle, FileWarning, Clock, ChevronRight, ClipboardCheck } from 'lucide-react';

interface Props {
  caseData: Case;
  active: boolean;
  onClick: () => void;
}

export default function CaseCard({ caseData, active, onClick }: Props) {
  const meta = STAGE_META[caseData.currentStage];
  const latestLog = caseData.flowLogs[caseData.flowLogs.length - 1];

  return (
    <div
      onClick={onClick}
      className={`group relative cursor-pointer rounded-lg border-l-4 bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 ${
        meta.borderColor
      } ${
        active
          ? 'ring-2 ring-offset-1 ring-slate-400 shadow-md -translate-y-0.5'
          : 'border border-slate-200'
      } ${
        caseData.hasException ? 'animate-pulse-border-red' : ''
      }`}
    >
      {caseData.hasException && (
        <div className="absolute right-2 top-2 flex flex-col items-end gap-1">
          {caseData.exceptionTypes.slice(0, 2).map((t) => (
            <span
              key={t}
              className="flex items-center gap-1 rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-700 ring-1 ring-rose-200"
            >
              <AlertTriangle className="h-3 w-3" />
              {EXCEPTION_TYPE_LABEL[t]}
            </span>
          ))}
          {caseData.exceptionTypes.length > 2 && (
            <span className="rounded bg-slate-100 px-1 py-0.5 text-[10px] text-slate-500">
              +{caseData.exceptionTypes.length - 2}
            </span>
          )}
        </div>
      )}

      <div className="p-3.5 pr-16">
        <div className="flex items-start justify-between gap-2">
          <div className="font-mono text-[11px] font-semibold tracking-wide text-slate-500">
            {caseData.caseNo}
          </div>
          {caseData.corrections.length > 0 && (
            <span className="flex items-center gap-1 rounded bg-orange-50 px-1.5 py-0.5 text-[10px] font-medium text-orange-700 ring-1 ring-orange-200">
              <ClipboardCheck className="h-3 w-3" />
              补录{caseData.corrections.filter((c) => c.status !== 'completed').length}/
              {caseData.corrections.length}
            </span>
          )}
        </div>

        <h3 className="mt-1 line-clamp-2 text-[13px] font-semibold leading-snug text-slate-800 group-hover:text-slate-900">
          {caseData.title}
        </h3>

        <div className="mt-1.5 text-[11px] text-slate-500">
          委托方：<span className="text-slate-700">{caseData.entrustParty}</span>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <RoleAvatar name={caseData.currentHandler} role={caseData.currentHandlerRole} size="sm" />
            <div className="text-[11px] leading-tight">
              <div className={`font-medium ${ROLE_META[caseData.currentHandlerRole].color}`}>
                {caseData.currentHandler}
              </div>
              <div className="text-slate-500">{ROLE_META[caseData.currentHandlerRole].label}处理中</div>
            </div>
          </div>
          <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${active ? 'translate-x-0.5 text-slate-600' : ''}`} />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusBadge
            stage={caseData.currentStage}
            status={caseData.status}
            stuckHours={caseData.stuckHours}
            arrivedAt={latestLog?.timestamp}
            size="sm"
          />
          {caseData.stuckHours >= 24 && caseData.status !== 'completed' && (
            <span className="flex items-center gap-0.5 text-[10px] text-amber-700">
              <Clock className="h-3 w-3" />
              滞留预警
            </span>
          )}
          {caseData.reviews.some((r) => r.rejectedItems.length > 0) && (
            <span className="flex items-center gap-0.5 text-[10px] text-rose-700">
              <FileWarning className="h-3 w-3" />
              有驳回记录
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
