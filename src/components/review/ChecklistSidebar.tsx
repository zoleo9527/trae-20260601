import { useMemo } from 'react';
import { useReviewStore } from '@/stores/reviewStore';
import { REVIEW_CHECKLIST, CHECKLIST_CATEGORY_META, SEVERITY_META } from '@/data/reviewChecklist';
import type { Sample } from '@/types';
import { Check, X, Circle, AlertTriangle, TestTube, Info } from 'lucide-react';

interface Props {
  reviewMode: 'none' | 'reviewing' | 'rejecting';
  caseSamples: Sample[];
}

type Cat = keyof typeof CHECKLIST_CATEGORY_META;

export default function ChecklistSidebar({ reviewMode, caseSamples }: Props) {
  const checkedItems = useReviewStore((s) => s.checkedItems);
  const rejectedItems = useReviewStore((s) => s.rejectedItems);
  const toggleCheckItem = useReviewStore((s) => s.toggleCheckItem);
  const markRejected = useReviewStore((s) => s.markRejected);

  const grouped = useMemo(() => {
    const map = new Map<Cat, typeof REVIEW_CHECKLIST>();
    REVIEW_CHECKLIST.forEach((item) => {
      const cat = item.category as Cat;
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(item);
    });
    return map;
  }, []);

  const catStats = (cat: Cat) => {
    const items = grouped.get(cat) || [];
    const total = items.length;
    const pass = items.filter((i) => checkedItems.includes(i.id)).length;
    const fail = items.filter((i) => rejectedItems.includes(i.id)).length;
    return { total, pass, fail, pending: total - pass - fail };
  };

  const sampleExceptionCount = caseSamples.filter((s) => s.exceptionNote).length;

  return (
    <div className="flex h-full flex-col bg-slate-50/40">
      <div className="border-b border-slate-200 bg-white px-4 py-2">
        <div className="flex items-center justify-between text-[11.5px] font-semibold text-slate-700">
          <span>审核项清单（4大类 / {REVIEW_CHECKLIST.length}项）</span>
          {reviewMode === 'reviewing' && (
            <span className="text-[10px] text-slate-500">点击 ✓ 通过 / 点击 ✗ 标记驳回</span>
          )}
        </div>
      </div>

      {sampleExceptionCount > 0 && (
        <div className="mx-3 mt-2 rounded-md border-l-4 border-amber-500 bg-amber-50 p-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-800">
            <TestTube className="h-3.5 w-3.5" />
            关联样本提示：{sampleExceptionCount} 份样本有异常记录
          </div>
          <div className="mt-1 space-y-1">
            {caseSamples
              .filter((s) => s.exceptionNote)
              .map((s) => (
                <div key={s.id} className="rounded bg-white/70 p-1.5 text-[10.5px] text-amber-900">
                  <span className="font-mono font-semibold">{s.sampleNo}</span>
                  <span className="ml-1 text-slate-600">{s.sampleType}</span>
                  <div className="mt-0.5 text-[10px] text-amber-800">⚠ {s.exceptionNote}</div>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {(['entrust', 'sample', 'format', 'logic'] as Cat[]).map((cat) => {
          const meta = CHECKLIST_CATEGORY_META[cat];
          const items = grouped.get(cat) || [];
          const { total, pass, fail, pending } = catStats(cat);
          return (
            <div key={cat} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className={`flex items-center justify-between px-3 py-1.5 ${meta.bg}`}>
                <div className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                  <span className={`text-[12px] font-semibold ${meta.color}`}>{meta.label}</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[10.5px]">
                  {pass > 0 && (
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-700">
                      ✓{pass}
                    </span>
                  )}
                  {fail > 0 && (
                    <span className="rounded bg-rose-100 px-1.5 py-0.5 text-rose-700">
                      ✗{fail}
                    </span>
                  )}
                  {pending > 0 && reviewMode !== 'none' && (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">
                      ○{pending}
                    </span>
                  )}
                  <span className="text-slate-400">/ {total}</span>
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                {items.map((item) => {
                  const isPass = checkedItems.includes(item.id);
                  const isFail = rejectedItems.includes(item.id);
                  const sev = SEVERITY_META[item.severity];
                  return (
                    <div
                      key={item.id}
                      className={`relative px-3 py-2 transition-colors ${
                        isFail
                          ? 'bg-rose-50/70'
                          : isPass
                            ? 'bg-emerald-50/50'
                            : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 flex shrink-0 items-center gap-1">
                          {reviewMode === 'reviewing' ? (
                            <>
                              <button
                                onClick={() => toggleCheckItem(item.id)}
                                title="标记通过"
                                className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all ${
                                  isPass
                                    ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm shadow-emerald-200'
                                    : 'border-slate-300 bg-white text-transparent hover:border-emerald-400 hover:text-emerald-400'
                                }`}
                              >
                                <Check className="h-3 w-3" strokeWidth={3} />
                              </button>
                              <button
                                onClick={() => markRejected(item.id)}
                                title="标记驳回"
                                className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all ${
                                  isFail
                                    ? 'border-rose-500 bg-rose-500 text-white shadow-sm shadow-rose-200'
                                    : 'border-slate-300 bg-white text-transparent hover:border-rose-400 hover:text-rose-400'
                                }`}
                              >
                                <X className="h-3 w-3" strokeWidth={3} />
                              </button>
                            </>
                          ) : isPass ? (
                            <Check className="h-4 w-4 text-emerald-500" />
                          ) : isFail ? (
                            <X className="h-4 w-4 text-rose-500" />
                          ) : (
                            <Circle className="h-4 w-4 text-slate-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-block rounded-sm px-1 text-[9.5px] font-semibold text-white ring-1 ring-white ${sev.color}`}
                              title={`严重等级：${sev.label}`}
                            >
                              {item.severity === 'critical'
                                ? '严重'
                                : item.severity === 'major'
                                  ? '重要'
                                  : '一般'}
                            </span>
                            <span className="text-[12px] font-medium text-slate-800">{item.label}</span>
                          </div>
                          <div className="mt-0.5 flex items-start gap-1 text-[10.5px] text-slate-500">
                            <Info className="mt-0.5 h-3 w-3 shrink-0 opacity-50" />
                            <span>{item.description}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
