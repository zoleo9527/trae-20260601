import type {
  CaseStage,
  StageMeta,
  UserRole,
  RoleMeta,
  RejectNode,
  RejectNodeMeta,
  BlockReason,
  BlockReasonMeta,
  ExceptionType,
  SceneType,
} from '@/types';

export const STAGE_META: Record<CaseStage, StageMeta> = {
  entrust_register: {
    label: '委托书登记',
    color: 'text-slate-700',
    bgColor: 'bg-slate-100',
    borderColor: 'border-slate-400',
  },
  sample_receive: {
    label: '样本接收',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-500',
  },
  expert_examine: {
    label: '鉴定检验中',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-500',
  },
  opinion_draft: {
    label: '意见书起草',
    color: 'text-violet-700',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-500',
  },
  quality_review: {
    label: '质控审核中',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-500',
  },
  correction_pending: {
    label: '补录/修改中',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-500',
  },
  dispatch_notice: {
    label: '发放待领取',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-500',
  },
  dispatch_sign: {
    label: '签收确认中',
    color: 'text-teal-700',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-500',
  },
  archived: {
    label: '已归档',
    color: 'text-slate-500',
    bgColor: 'bg-slate-100',
    borderColor: 'border-slate-300',
  },
};

export const ROLE_META: Record<UserRole, RoleMeta> = {
  receptionist: {
    label: '受理员',
    color: 'text-blue-700',
    avatarBg: 'bg-blue-600',
  },
  expert: {
    label: '鉴定人',
    color: 'text-indigo-700',
    avatarBg: 'bg-indigo-600',
  },
  quality_controller: {
    label: '质控审核',
    color: 'text-amber-700',
    avatarBg: 'bg-amber-600',
  },
  director: {
    label: '所领导',
    color: 'text-slate-700',
    avatarBg: 'bg-slate-600',
  },
};

export const REJECT_NODE_META: Record<RejectNode, RejectNodeMeta> = {
  back_to_entrust: {
    label: '退回受理员',
    targetRole: 'receptionist',
    description: '委托书信息、委托事项、委托人身份材料等存在问题',
  },
  back_to_expert: {
    label: '退回鉴定人',
    targetRole: 'expert',
    description: '检验流程、意见书内容、结论逻辑、格式规范等存在问题',
  },
  back_to_sample: {
    label: '样本异常退回',
    targetRole: 'receptionist',
    description: '样本污染、缺失、编号不符等异常，需通知委托方重新取样',
  },
};

export const BLOCK_REASON_META: Record<BlockReason, BlockReasonMeta> = {
  awaiting_pickup: {
    label: '等待委托方领取',
    suggestion: '电话催促或发送二次领取通知',
  },
  sign_missing: {
    label: '签收凭证缺失',
    suggestion: '补录签收人身份证信息或上传签收单照片',
  },
  recorrection_needed: {
    label: '退回后未重审通过',
    suggestion: '跟进补录任务完成后重新提交审核',
  },
  correction_unfinished: {
    label: '关联补录任务未完成',
    suggestion: '查看补录任务列表并催办责任人',
  },
  approval_pending: {
    label: '发放批准待签字',
    suggestion: '提醒所领导完成发放批准签字',
  },
};

export const EXCEPTION_TYPE_LABEL: Record<ExceptionType, string> = {
  sample_abnormal: '样本异常',
  opinion_rejected: '意见书被驳回',
  dispatch_delay: '发放延迟',
  correction_missed: '补录遗漏',
};

export const SCENE_LABEL: Record<SceneType, string> = {
  normal: '正常全流程',
  multi_reject: '多次驳回',
  sample_abnormal: '样本异常',
  dispatch_delay: '发放延迟',
  correction_missed: '补录遗漏',
};

export const STAGE_ORDER: CaseStage[] = [
  'entrust_register',
  'sample_receive',
  'expert_examine',
  'opinion_draft',
  'quality_review',
  'correction_pending',
  'dispatch_notice',
  'dispatch_sign',
  'archived',
];

export const DISPATCH_STEPS = [
  { key: 'review_pass', label: '审核通过', icon: 'check-circle-2' },
  { key: 'notice', label: '通知领取', icon: 'bell' },
  { key: 'sign', label: '签收确认', icon: 'signature' },
  { key: 'archive', label: '归档完成', icon: 'archive' },
] as const;
