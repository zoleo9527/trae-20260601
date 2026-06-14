import { useMemo } from 'react';
import { useCaseStore } from '@/stores/caseStore';
import CaseCard from '@/components/case/CaseCard';
import { Inbox, Search } from 'lucide-react';

export default function CaseCardList() {
  const allCases = useCaseStore((s) => s.cases);
  const filter = useCaseStore((s) => s.filter);
  const activeCaseId = useCaseStore((s) => s.activeCaseId);
  const selectCase = useCaseStore((s) => s.selectCase);
  const setFilter = useCaseStore((s) => s.setFilter);

  const cases = useMemo(() => {
    return allCases.filter((c) => {
      if (filter.role !== 'all' && c.currentHandlerRole !== filter.role) return false;
      if (filter.stage !== 'all' && c.currentStage !== filter.stage) return false;
      if (filter.status !== 'all' && c.status !== filter.status) return false;
      if (filter.onlyException && !c.hasException) return false;
      if (filter.keyword) {
        const kw = filter.keyword.toLowerCase();
        if (
          !c.caseNo.toLowerCase().includes(kw) &&
          !c.title.toLowerCase().includes(kw) &&
          !c.entrustParty.toLowerCase().includes(kw) &&
          !c.currentHandler.toLowerCase().includes(kw)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [allCases, filter]);

  const sorted = useMemo(() => {
    return [...cases].sort((a, b) => {
      if (a.hasException !== b.hasException) return a.hasException ? -1 : 1;
      return b.stuckHours - a.stuckHours;
    });
  }, [cases]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50/60">
        <div>
          <div className="text-sm font-semibold text-slate-800">
            案件列表
            <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600">
              {sorted.length}/{allCases.length}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">异常案件优先 · 按滞留时长降序</div>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            value={filter.keyword}
            onChange={(e) => useCaseStore.getState().setFilter({ keyword: e.target.value })}
            placeholder="编号/标题/委托方..."
            className="h-8 w-52 rounded-md border border-slate-200 bg-white pl-8 pr-3 text-[11px] text-slate-700 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {sorted.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-16 text-slate-400">
            <Inbox className="h-12 w-12" />
            <div className="text-sm">当前筛选条件下无匹配案件</div>
            <button
              onClick={() =>
                useCaseStore.getState().setFilter({
                  role: 'all',
                  stage: 'all',
                  status: 'all',
                  keyword: '',
                  onlyException: false,
                })
              }
              className="mt-1 rounded-md bg-slate-100 px-3 py-1 text-xs text-slate-700 hover:bg-slate-200"
            >
              重置筛选
            </button>
          </div>
        ) : (
          sorted.map((c) => (
            <CaseCard
              key={c.id}
              caseData={c}
              active={activeCaseId === c.id}
              onClick={() => selectCase(activeCaseId === c.id ? null : c.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
