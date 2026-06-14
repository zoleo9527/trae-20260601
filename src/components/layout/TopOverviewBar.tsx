import { useMemo } from 'react';
import { useCaseStore } from '@/stores/caseStore';
import { ROLE_META, STAGE_META, BLOCK_REASON_META, STAGE_ORDER } from '@/data/constants';
import type { UserRole, CaseStage, BlockReason } from '@/types';
import { Users, GitPullRequest, PackageX } from 'lucide-react';

function computeBlockReasons(c: ReturnType<typeof useCaseStore.getState>['cases'][number]): BlockReason[] {
  if (!c.dispatch || c.dispatch.status === 'completed') return [];
  const d = c.dispatch;
  const reasons: BlockReason[] = [];
  if (d.noticeDate && !d.pickupDate) reasons.push('awaiting_pickup');
  if (d.pickupDate && !d.receiverIdCard) reasons.push('sign_missing');
  if (c.corrections.some((co) => co.status !== 'completed')) reasons.push('correction_unfinished');
  const latestOpinion = c.opinions[c.opinions.length - 1];
  if (latestOpinion) {
    const latestReview = [...c.reviews].reverse().find((r) => r.opinionId === latestOpinion.id);
    if (latestReview && latestReview.rejectedItems.length > 0) reasons.push('recorrection_needed');
  }
  if (!d.receiver && !d.pickupDate && d.noticeDate && c.stuckHours >= 168) reasons.push('approval_pending');
  return Array.from(new Set(reasons));
}

export default function TopOverviewBar() {
  const cases = useCaseStore((s) => s.cases);

  const handlerDist = useMemo(() => {
    const map = new Map<UserRole, number>();
    cases.forEach((c) => {
      if (c.status === 'completed') return;
      map.set(c.currentHandlerRole, (map.get(c.currentHandlerRole) || 0) + 1);
    });
    return map;
  }, [cases]);

  const totalActive = cases.filter((c) => c.status !== 'completed').length;

  const stuckTop = useMemo(() => {
    const map = new Map<CaseStage, number>();
    cases.forEach((c) => {
      if (c.status === 'completed') return;
      if (c.stuckHours >= 24) {
        map.set(c.currentStage, (map.get(c.currentStage) || 0) + 1);
      }
    });
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([stage, count]) => ({ stage, count }));
  }, [cases]);

  const dispatchBlock = useMemo(() => {
    const reasons: BlockReason[] = [];
    cases.forEach((c) => {
      if (c.dispatch && c.dispatch.status !== 'completed') {
        reasons.push(...computeBlockReasons(c));
      }
    });
    const map = new Map<BlockReason, number>();
    reasons.forEach((r) => map.set(r, (map.get(r) || 0) + 1));
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([r, count]) => ({ reason: r, count }));
  }, [cases]);

  const rolePct = (role: UserRole) =>
    totalActive > 0 ? Math.round(((handlerDist.get(role) || 0) / totalActive) * 100) : 0;

  return (
    <div className="flex items-stretch gap-3 bg-gradient-to-r from-[#1e3a5f] via-[#24436d] to-[#1e3a5f] px-5 py-3 text-white">
      <div className="flex items-center gap-3 pr-5 border-r border-white/15">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
          <span className="font-serif text-lg font-bold tracking-wider">司</span>
        </div>
        <div>
          <div className="font-serif text-[15px] font-semibold tracking-wide">司法鉴定意见书审核与发放登记</div>
          <div className="text-[11px] text-white/60">业务工作台 · 三问速览</div>
        </div>
      </div>

      <div className="flex flex-1 items-stretch gap-3">
        <div className="flex-1 rounded-lg bg-white/8 p-3 ring-1 ring-white/15 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-sky-300" />
            <span className="text-[12px] font-medium text-white/80">一问：谁在处理？</span>
          </div>
          <div className="mt-2 flex items-end gap-3">
            <div className="text-2xl font-bold tabular-nums">{totalActive}</div>
            <div className="flex-1 flex items-center gap-1 pb-1">
              {(['receptionist', 'expert', 'quality_controller'] as UserRole[]).map((role) => {
                const n = handlerDist.get(role) || 0;
                const pct = rolePct(role);
                return (
                  <div key={role} className="flex-1" title={`${ROLE_META[role].label}: ${n}件 (${pct}%)`}>
                    <div className="h-1.5 w-full rounded-full bg-white/15 overflow-hidden">
                      <div
                        className={`h-full ${ROLE_META[role].avatarBg.replace('bg-', 'bg-')}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="mt-1 flex justify-between text-[10px] text-white/60">
                      <span>{ROLE_META[role].label}</span>
                      <span className="font-mono text-white/80">{n}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex-1 rounded-lg bg-white/8 p-3 ring-1 ring-white/15 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <GitPullRequest className="h-4 w-4 text-amber-300" />
            <span className="text-[12px] font-medium text-white/80">二问：卡在哪里？</span>
          </div>
          <div className="mt-2 flex items-end gap-3">
            <div className="text-2xl font-bold tabular-nums">
              {cases.filter((c) => c.status !== 'completed' && c.stuckHours >= 24).length}
              <span className="ml-1 text-xs font-normal text-white/60">件滞留≥24h</span>
            </div>
            <div className="flex-1 flex items-end gap-2 pb-1">
              {stuckTop.length === 0 ? (
                <span className="text-[11px] text-emerald-300">当前无滞留超时案件</span>
              ) : (
                stuckTop.map(({ stage, count }) => {
                  const max = stuckTop[0]?.count || 1;
                  return (
                    <div key={stage} className="flex-1 flex flex-col items-stretch">
                      <div className="flex justify-between text-[10px] text-white/70">
                        <span className="truncate">{STAGE_META[stage].label}</span>
                        <span className="font-mono text-white">{count}</span>
                      </div>
                      <div className="mt-0.5 h-2 rounded bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-amber-400/80"
                          style={{ width: `${(count / max) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
              {stuckTop.length < 3 &&
                Array.from({ length: 3 - stuckTop.length }).map((_, i) => (
                  <div key={`e${i}`} className="flex-1 opacity-30">
                    <div className="flex justify-between text-[10px] text-white/50">
                      <span>—</span>
                      <span>0</span>
                    </div>
                    <div className="mt-0.5 h-2 rounded bg-white/10" />
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="flex-1 rounded-lg bg-white/8 p-3 ring-1 ring-white/15 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <PackageX className="h-4 w-4 text-rose-300" />
            <span className="text-[12px] font-medium text-white/80">三问：发放为何未完成？</span>
          </div>
          <div className="mt-2 flex items-end gap-3">
            <div className="text-2xl font-bold tabular-nums">
              {cases.filter((c) => c.dispatch && c.dispatch.status !== 'completed').length}
              <span className="ml-1 text-xs font-normal text-white/60">件待发放</span>
            </div>
            <div className="flex-1 flex flex-col justify-end gap-1 pb-0.5">
              {dispatchBlock.length === 0 ? (
                <span className="text-[11px] text-emerald-300">发放流程全部畅通</span>
              ) : (
                dispatchBlock.map(({ reason, count }) => (
                  <div
                    key={reason}
                    className="flex items-center justify-between gap-2 rounded bg-white/8 px-2 py-0.5 text-[10px]"
                    title={BLOCK_REASON_META[reason].suggestion}
                  >
                    <span className="text-white/80 truncate">
                      <span className="mr-1 inline-block h-1.5 w-1.5 rounded-sm bg-rose-400" />
                      {BLOCK_REASON_META[reason].label}
                    </span>
                    <span className="font-mono text-white">{count}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end justify-center gap-0.5 pl-3 border-l border-white/15">
        <span className="text-[11px] text-white/60">共登记案件</span>
        <span className="font-mono text-xl font-bold">{cases.length}</span>
        <span className="text-[10px] text-emerald-300">
          已归档 {cases.filter((c) => c.currentStage === 'archived').length} · 异常{' '}
          {cases.filter((c) => c.hasException).length}
        </span>
      </div>
    </div>
  );
}
