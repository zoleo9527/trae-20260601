import type { BlockReason } from '@/types';
import { BLOCK_REASON_META } from '@/data/constants';
import { AlertOctagon, ChevronDown, ChevronUp, Check, ArrowRight } from 'lucide-react';

interface Props {
  reasons: BlockReason[];
  onResolve: (r: BlockReason) => void;
  open: boolean;
  onToggle: () => void;
  replayMode: boolean;
}

export default function BlockDiagnosisPanel({
  reasons,
  onResolve,
  open,
  onToggle,
  replayMode,
}: Props) {
  if (reasons.length === 0) return null;

  return (
    <div
      className={`overflow-hidden rounded-lg border transition-all ${
        open ? 'border-rose-300 bg-rose-50/80 shadow-sm shadow-rose-100' : 'border-slate-200 bg-slate-50'
      }`}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
      >
        <div className="flex items-center gap-2">
          <AlertOctagon className="h-4 w-4 text-rose-600 animate-pulse" />
          <span className="text-[12px] font-bold text-rose-800">
            发放延迟诊断 · {reasons.length} 项阻塞原因
          </span>
          <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">
            {reasons.length}
          </span>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-rose-700" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-500" />
        )}
      </button>

      {open && (
        <div className="space-y-1.5 border-t border-rose-200/60 p-3 pt-2.5">
          {reasons.map((r) => {
            const meta = BLOCK_REASON_META[r];
            return (
              <div
                key={r}
                className="group rounded-md border border-rose-200/70 bg-white/85 p-2.5 ring-1 ring-rose-100"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full bg-rose-500 shadow-sm shadow-rose-200" />
                    <div>
                      <div className="text-[12px] font-semibold text-rose-800">
                        {meta.label}
                      </div>
                      <div className="mt-0.5 text-[11px] leading-relaxed text-rose-600/90">
                        <ArrowRight className="mr-0.5 inline h-2.5 w-2.5" />
                        建议：{meta.suggestion}
                      </div>
                    </div>
                  </div>
                  {!replayMode && (
                    <button
                      onClick={() => onResolve(r)}
                      className="flex shrink-0 items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-700 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-emerald-100"
                      title="标记此项已解决（演示用）"
                    >
                      <Check className="h-3 w-3" />
                      标记解决
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          <div className="rounded-md bg-white/70 p-2 text-[10.5px] leading-relaxed text-slate-500 ring-1 ring-slate-200">
            <span className="font-semibold text-slate-700">💡 说明：</span>
            诊断面板中的阻塞原因根据案件状态自动推断。发放完成后（签收+归档）所有原因将自动清除。悬停单个原因可手动标记「已解决」用于测试流程衔接。
          </div>
        </div>
      )}
    </div>
  );
}
