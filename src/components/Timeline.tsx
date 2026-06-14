import {
  FileText,
  UserCheck,
  Send,
  Download,
  CheckCircle2,
  Archive,
  Shield,
  StickyNote,
} from 'lucide-react';
import type { ReviewRecord } from '../types';
import { STAGE_LABELS, RESPONSIBLE_PARTY } from '../types';
import { cn } from '../lib/utils';

interface TimelineProps {
  records: ReviewRecord[];
}

const stageIcons = {
  receive: Download,
  review: UserCheck,
  correction_sent: Send,
  correction_received: Download,
  exception_note: StickyNote,
  final_approve: CheckCircle2,
  archive: Archive,
};

const stageColors = {
  receive: 'bg-blue-500',
  review: 'bg-navy-600',
  correction_sent: 'bg-amber-500',
  correction_received: 'bg-blue-500',
  exception_note: 'bg-gradient-to-br from-rose-500 to-rose-600',
  final_approve: 'bg-emerald-500',
  archive: 'bg-slate-400',
};

const stageBorders = {
  receive: 'border-blue-100',
  review: 'border-navy-100',
  correction_sent: 'border-amber-100',
  correction_received: 'border-blue-100',
  exception_note: 'border-rose-100',
  final_approve: 'border-emerald-100',
  archive: 'border-slate-100',
};

const stageRemarkBgs = {
  receive: 'bg-blue-50 text-blue-800 border-blue-100',
  review: 'bg-slate-50 text-slate-700 border-slate-100',
  correction_sent: 'bg-amber-50 text-amber-800 border-amber-100',
  correction_received: 'bg-blue-50 text-blue-800 border-blue-100',
  exception_note: 'bg-rose-50 text-rose-800 border-rose-100',
  final_approve: 'bg-emerald-50 text-emerald-800 border-emerald-100',
  archive: 'bg-slate-50 text-slate-600 border-slate-100',
};

export function Timeline({ records }: TimelineProps) {
  if (records.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-slate-400">
        暂无审核记录
      </div>
    );
  }

  return (
    <div className="relative">
      {records.map((record, index) => {
        const Icon = stageIcons[record.stage] || FileText;
        const isLast = index === records.length - 1;
        const isBoundary = record.isResponsibilityBoundary;
        const isException = record.stage === 'exception_note';

        return (
          <div key={record.id}>
            {isBoundary && (
              <div className="relative my-3 mx-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-dashed border-amber-300" />
                </div>
                <div className="relative flex justify-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-amber-800 bg-gradient-to-r from-amber-50 to-amber-100 rounded-full border border-amber-300 shadow-sm">
                    <Shield className="w-3 h-3" />
                    责任划分点
                  </span>
                </div>
                <p className="mt-1.5 text-[10px] text-amber-600 text-center leading-relaxed">
                  公证员审核 → 补正等待<br />此间责任由系统标注
                </p>
              </div>
            )}

            <div className="relative flex gap-3 pb-5">
              <div className="relative flex flex-col items-center">
                <div
                  className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center z-10 shadow-sm',
                    stageColors[record.stage]
                  )}
                >
                  <Icon className="w-3 h-3 text-white" />
                </div>
                {!isLast && (
                  <div
                    className={cn(
                      'w-px flex-1 mt-1',
                      isBoundary ? 'bg-amber-200' : isException ? 'bg-rose-200' : 'bg-slate-100'
                    )}
                  />
                )}
              </div>

              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                  <span className={cn(
                    'font-semibold text-xs',
                    isException ? 'text-rose-700' : 'text-slate-800'
                  )}>
                    {STAGE_LABELS[record.stage]}
                  </span>
                  {isException && (
                    <span className="text-[9px] text-rose-600 px-1.5 py-0.5 bg-rose-50 rounded border border-rose-200 font-bold">
                      可追溯
                    </span>
                  )}
                  <span className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded border font-medium',
                    isException
                      ? 'bg-rose-50 text-rose-600 border-rose-200'
                      : 'bg-slate-50 text-slate-400 border-slate-200'
                  )}>
                    {RESPONSIBLE_PARTY[record.stage]}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mb-1">{record.reviewTime}</p>
                <p className="text-[10px] text-slate-500">
                  操作人：{record.reviewer}
                </p>
                {record.remark && (
                  <div
                    className={cn(
                      'mt-1.5 p-2 rounded-md text-[11px] leading-relaxed border',
                      stageRemarkBgs[record.stage]
                    )}
                  >
                    {isException && (
                      <div className="flex items-center gap-1 mb-0.5">
                        <StickyNote className="w-3 h-3 text-rose-500" />
                        <span className="text-[10px] font-bold text-rose-700">
                          异常说明
                        </span>
                      </div>
                    )}
                    {record.remark}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
