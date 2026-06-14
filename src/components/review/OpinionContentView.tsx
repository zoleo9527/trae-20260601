import { useMemo } from 'react';
import type { Opinion } from '@/types';
import { REVIEW_CHECKLIST, CHECKLIST_CATEGORY_META, SEVERITY_META } from '@/data/reviewChecklist';
import { AlertCircle, FileText } from 'lucide-react';

interface Props {
  opinion: Opinion;
  rejectedItems: string[];
}

export default function OpinionContentView({ opinion, rejectedItems }: Props) {
  const sections = useMemo(() => {
    return opinion.content.split(/\n(?=[一二三四五六七八九十]+、)/).map((s, i) => s.trim()).filter(Boolean);
  }, [opinion.content]);

  const rejectedLabels = rejectedItems
    .map((id) => REVIEW_CHECKLIST.find((i) => i.id === id))
    .filter(Boolean) as typeof REVIEW_CHECKLIST;

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {rejectedLabels.length > 0 && (
        <div className="absolute inset-0 pointer-events-none z-10 bg-rose-500/[0.02]" />
      )}

      <div className="flex items-center justify-between border-b border-slate-100 bg-white/80 px-4 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
          <FileText className="h-3.5 w-3.5 text-slate-400" />
          <span>意见书正文 · V{opinion.version}</span>
        </div>
        {rejectedLabels.length > 0 && (
          <div className="flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[10px] text-rose-700 ring-1 ring-rose-200">
            <AlertCircle className="h-3 w-3" />
            本轮驳回标记 {rejectedLabels.length} 处
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-5 font-serif text-[13px] leading-7 text-slate-800">
        <div className="mb-5 text-center">
          <h1 className="font-serif text-lg font-bold tracking-[0.25em] text-slate-900">
            司法鉴定意见书
          </h1>
          <div className="mt-2 font-mono text-xs text-slate-500">
            {sections?.[0]?.match(/SFJD\[[^\]]+\][^\n]+/)?.[0] || opinion.content.slice(0, 30)}
          </div>
        </div>

        {sections.length > 1 ? (
          sections.map((sec, idx) => {
            const matchSec = rejectedLabels.filter((r) => {
              const cat = CHECKLIST_CATEGORY_META[r.category];
              if (!cat) return false;
              if (r.category === 'logic' && idx >= 3) return true;
              if (r.category === 'format' && (idx === 0 || idx >= sections.length - 2)) return true;
              if (r.category === 'entrust' && idx <= 1) return true;
              return false;
            });
            return (
              <div
                key={idx}
                className={`mb-4 rounded-md p-3 transition-colors ${
                  matchSec.length > 0
                    ? 'relative bg-rose-50/60 ring-1 ring-rose-200'
                    : 'hover:bg-slate-50/60'
                }`}
              >
                {matchSec.length > 0 && (
                  <div className="absolute -left-1.5 top-3 flex flex-col gap-1">
                    {matchSec.map((r) => (
                      <span
                        key={r.id}
                        title={`${SEVERITY_META[r.severity].label}：${r.label}`}
                        className={`h-2 w-2 rounded-full ring-2 ${SEVERITY_META[r.severity].color} ${SEVERITY_META[r.severity].ring} animate-pulse`}
                      />
                    ))}
                  </div>
                )}
                <div className="whitespace-pre-wrap">{sec}</div>
                {matchSec.length > 0 && (
                  <div className="mt-2 space-y-1 border-t border-rose-200/60 pt-2">
                    {matchSec.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-start gap-1.5 text-[11px] text-rose-700"
                      >
                        <span className={`mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full ${SEVERITY_META[r.severity].color}`} />
                        <div>
                          <span className="font-semibold">{r.label}</span>
                          <span className="ml-1 text-rose-500/80">· {r.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="whitespace-pre-wrap">{opinion.content}</div>
        )}

        {opinion.conclusion && (
          <div className="mt-5 rounded-lg border-l-4 border-emerald-500 bg-emerald-50/60 p-4">
            <div className="text-[11px] font-semibold tracking-wider text-emerald-700">鉴定结论</div>
            <div className="mt-1 font-semibold text-slate-800">{opinion.conclusion}</div>
            {rejectedLabels.some((r) => r.category === 'logic') && (
              <div className="mt-2 rounded bg-rose-100/80 p-2 text-[11px] text-rose-700">
                ⚠ 结论逻辑部分存在驳回标记，请查看对应审核项详细说明
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
