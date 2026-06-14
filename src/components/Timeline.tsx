import {
  FileText,
  UserCheck,
  Send,
  Download,
  CheckCircle2,
  Archive,
  AlertTriangle,
  Shield,
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
  final_approve: CheckCircle2,
  archive: Archive,
};

const stageColors = {
  receive: 'bg-blue-500',
  review: 'bg-navy-600',
  correction_sent: 'bg-amber-500',
  correction_received: 'bg-blue-500',
  final_approve: 'bg-emerald-500',
  archive: 'bg-slate-400',
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
                      isBoundary ? 'bg-amber-200' : 'bg-slate-100'
                    )}
                  />
                )}
              </div>

              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="font-semibold text-slate-800 text-xs">
                    {STAGE_LABELS[record.stage]}
                  </span>
                  <span className="text-[10px] text-slate-400 px-1.5 py-0.5 bg-slate-50 rounded">
                    {RESPONSIBLE_PARTY[record.stage]}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mb-1">{record.reviewTime}</p>
                <p className="text-[10px] text-slate-500">
                  操作人：{record.reviewer}
                </p>
                {record.remark && (
                  <div className="mt-1.5 p-2 bg-slate-50 rounded-md text-[11px] text-slate-600 leading-relaxed border border-slate-100">
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
