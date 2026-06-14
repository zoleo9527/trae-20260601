import { useCaseStore } from '@/stores/caseStore';
import { ROLE_META, STAGE_META, STAGE_ORDER } from '@/data/constants';
import type { UserRole, CaseStage, TaskStatus } from '@/types';
import { User, Filter, AlertOctagon, RotateCcw, CheckSquare } from 'lucide-react';

export default function LeftRolePanel() {
  const filter = useCaseStore((s) => s.filter);
  const setFilter = useCaseStore((s) => s.setFilter);
  const cases = useCaseStore((s) => s.cases);

  const countByRole = (role: 'all' | UserRole) =>
    cases.filter((c) => (role === 'all' ? true : c.currentHandlerRole === role) && c.status !== 'completed').length;

  const countByStage = (stage: 'all' | CaseStage) =>
    cases.filter((c) => (stage === 'all' ? c.status !== 'completed' : c.currentStage === stage)).length;

  const countByStatus = (status: 'all' | TaskStatus) =>
    cases.filter((c) => (status === 'all' ? true : c.status === status)).length;

  const isAllDefault =
    filter.role === 'all' &&
    filter.stage === 'all' &&
    filter.status === 'all' &&
    !filter.onlyException &&
    filter.keyword === '';

  return (
    <div className="flex h-full flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-100 p-3">
        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-700">
          <User className="h-4 w-4 text-slate-500" />
          按角色筛选
        </div>
        <div className="mt-2 space-y-1">
          {(
            [
              ['all', '全部角色'],
              ['receptionist', ROLE_META.receptionist.label],
              ['expert', ROLE_META.expert.label],
              ['quality_controller', ROLE_META.quality_controller.label],
            ] as const
          ).map(([key, label]) => {
            const active = filter.role === key;
            const n = countByRole(key);
            return (
              <button
                key={key}
                onClick={() => setFilter({ role: key } as any)}
                className={`flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-[12px] transition-colors ${
                  active
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {key !== 'all' && (
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        ROLE_META[key as UserRole].avatarBg
                      }`}
                    />
                  )}
                  {label}
                </span>
                <span
                  className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                    active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {n}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-b border-slate-100 p-3">
        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-700">
          <Filter className="h-4 w-4 text-slate-500" />
          按阶段筛选
        </div>
        <div className="mt-2 max-h-60 space-y-0.5 overflow-y-auto pr-1">
          <button
            onClick={() => setFilter({ stage: 'all' })}
            className={`flex w-full items-center justify-between gap-2 rounded-md px-2 py-1 text-[11px] ${
              filter.stage === 'all'
                ? 'bg-slate-100 font-medium text-slate-800'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>全部阶段</span>
            <span className="font-mono text-[10px] text-slate-500">{countByStage('all')}</span>
          </button>
          {STAGE_ORDER.map((stage) => {
            const n = countByStage(stage);
            if (n === 0 && filter.stage !== stage) return null;
            const active = filter.stage === stage;
            const meta = STAGE_META[stage];
            return (
              <button
                key={stage}
                onClick={() => setFilter({ stage: active ? 'all' : stage })}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-[11px] transition-colors ${
                  active ? 'bg-slate-100 font-medium text-slate-800' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className={`inline-block w-[3px] self-stretch rounded-sm ${meta.borderColor.replace('border-', 'bg-')}`} />
                <span className="flex-1 text-left">{meta.label}</span>
                <span className="font-mono text-[10px] text-slate-500">{n}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-b border-slate-100 p-3">
        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-700">
          <CheckSquare className="h-4 w-4 text-slate-500" />
          按状态筛选
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1">
          {(['all', 'in_progress', 'overdue', 'completed'] as const).map((key) => {
            const labels = { all: '全部', in_progress: '处理中', overdue: '超期', completed: '完成' };
            const active = filter.status === key;
            return (
              <button
                key={key}
                onClick={() => setFilter({ status: key })}
                className={`rounded-md px-1.5 py-1 text-[10px] ${
                  active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {labels[key]}
                <span className="ml-1 font-mono opacity-70">{countByStatus(key)}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-b border-slate-100 p-3">
        <label className="flex cursor-pointer items-center gap-2 text-[12px] text-slate-700">
          <input
            type="checkbox"
            checked={filter.onlyException}
            onChange={(e) => setFilter({ onlyException: e.target.checked })}
            className="h-3.5 w-3.5 rounded border-slate-300 text-rose-600 focus:ring-rose-400"
          />
          <AlertOctagon className="h-4 w-4 text-rose-500" />
          <span className="font-medium">仅看异常案件</span>
          <span className="ml-auto rounded bg-rose-50 px-1.5 py-0.5 font-mono text-[10px] text-rose-700 ring-1 ring-rose-200">
            {cases.filter((c) => c.hasException).length}
          </span>
        </label>
      </div>

      <div className="mt-auto border-t border-slate-100 p-3">
        <button
          disabled={isAllDefault}
          onClick={() =>
            setFilter({
              role: 'all',
              stage: 'all',
              status: 'all',
              keyword: '',
              onlyException: false,
            })
          }
          className={`flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] transition-colors ${
            isAllDefault
              ? 'cursor-not-allowed bg-slate-50 text-slate-400'
              : 'bg-slate-800 text-white hover:bg-slate-900'
          }`}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          重置全部筛选
        </button>
        <div className="mt-2 rounded-md bg-slate-50 p-2 text-[10px] leading-relaxed text-slate-500">
          <div className="font-semibold text-slate-600 mb-0.5">快捷提示</div>
          点击案件卡片查看详情 · 审核面板支持逐条通过/驳回 · 发放面板支持回看历史节点
        </div>
      </div>
    </div>
  );
}
