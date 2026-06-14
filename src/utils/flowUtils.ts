import type { CaseStage, RejectNode, UserRole } from '@/types';
import { STAGE_ORDER } from '@/data/constants';

export function getStageIndex(stage: CaseStage): number {
  return STAGE_ORDER.indexOf(stage);
}

export function isStageBefore(a: CaseStage, b: CaseStage): boolean {
  return getStageIndex(a) < getStageIndex(b);
}

export function isStageAfter(a: CaseStage, b: CaseStage): boolean {
  return getStageIndex(a) > getStageIndex(b);
}

export function rejectNodeToStage(node: RejectNode): CaseStage {
  switch (node) {
    case 'back_to_entrust':
      return 'correction_pending';
    case 'back_to_expert':
      return 'correction_pending';
    case 'back_to_sample':
      return 'sample_receive';
  }
}

export function rejectNodeToTargetHandlerRole(node: RejectNode): UserRole {
  switch (node) {
    case 'back_to_entrust':
      return 'receptionist';
    case 'back_to_expert':
      return 'expert';
    case 'back_to_sample':
      return 'receptionist';
  }
}

export function canMoveToStage(current: CaseStage, target: CaseStage): boolean {
  const curIdx = getStageIndex(current);
  const tgtIdx = getStageIndex(target);
  if (tgtIdx <= curIdx) return true;
  return tgtIdx === curIdx + 1;
}

export function validateSampleReject(
  sampleStatus: string,
  currentStage: CaseStage,
): { valid: boolean; reason?: string } {
  if (!['quality_review', 'expert_examine', 'opinion_draft'].includes(currentStage)) {
    return { valid: false, reason: '当前阶段不允许样本异常退回操作' };
  }
  if (sampleStatus === 'completed') {
    return { valid: false, reason: '样本已完成检验，无法退回' };
  }
  return { valid: true };
}
