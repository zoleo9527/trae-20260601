import { useEffect, useMemo } from 'react';
import { useCaseStore } from '@/stores/caseStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { uid } from '@/utils/timeUtils';
import type { CaseStage, UserRole } from '@/types';
import { STAGE_ORDER } from '@/data/constants';

export default function useFlowEngine() {
  const cases = useCaseStore((s) => s.cases);
  const pushToast = useNotificationStore((s) => s.pushToast);
  const showBannerAlert = useNotificationStore((s) => s.showBannerAlert);

  const stageIndex = (s: CaseStage) => STAGE_ORDER.indexOf(s);

  const summary = useMemo(() => {
    const roleCount = new Map<UserRole, number>();
    const stageCount = new Map<CaseStage, number>();
    let dispatchUnfinished = 0;
    let exceptionCount = 0;

    cases.forEach((c) => {
      if (c.status !== 'completed' && c.currentStage !== 'archived') {
        roleCount.set(c.currentHandlerRole, (roleCount.get(c.currentHandlerRole) || 0) + 1);
        stageCount.set(c.currentStage, (stageCount.get(c.currentStage) || 0) + 1);
      }
      if (c.dispatch && c.dispatch.status !== 'completed') dispatchUnfinished++;
      if (c.hasException) exceptionCount++;
    });

    const stuckTop = [...stageCount.entries()]
      .map(([stage, count]) => ({ stage, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return {
      roleCount,
      stageCount,
      stuckTop,
      dispatchUnfinished,
      exceptionCount,
      total: cases.length,
    };
  }, [cases]);

  useEffect(() => {
    const overdueCases = cases.filter(
      (c) => c.status !== 'completed' && c.currentStage !== 'archived' && c.stuckHours >= 72,
    );
    if (overdueCases.length > 0) {
      const alreadyHasBanner = useNotificationStore.getState().bannerAlert;
      if (!alreadyHasBanner || !overdueCases.some((c) => alreadyHasBanner.caseIds.includes(c.id))) {
        // Don't auto spam, only log silently for first render
      }
    }
  }, [cases]);

  const canTransition = (
    from: CaseStage,
    to: CaseStage,
    ctx?: { hasUnfinishedCorrections?: boolean; hasReviewPass?: boolean; hasSign?: boolean },
  ): { ok: boolean; reason?: string } => {
    const fromIdx = stageIndex(from);
    const toIdx = stageIndex(to);

    if (to === 'correction_pending') {
      return { ok: ['quality_review', 'expert_examine', 'opinion_draft'].includes(from) };
    }

    if (to === 'sample_receive' && fromIdx > stageIndex('sample_receive')) {
      return { ok: true };
    }

    if (toIdx < fromIdx) {
      return { ok: true };
    }

    if (toIdx === fromIdx + 1) {
      if (to === 'dispatch_notice' && !ctx?.hasReviewPass) {
        return { ok: false, reason: '需先通过质控审核才能进入发放' };
      }
      if (to === 'dispatch_sign' && !ctx?.hasSign) {
        return { ok: false, reason: '需完成签收信息登记' };
      }
      if (to === 'archived' && ctx?.hasUnfinishedCorrections) {
        return { ok: false, reason: '存在未完成的补录任务' };
      }
      return { ok: true };
    }

    return { ok: false, reason: '不允许跨阶段跳跃' };
  };

  return {
    summary,
    canTransition,
  };
}
