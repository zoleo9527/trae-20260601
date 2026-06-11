import type { TransitionRule, StateMachineConfig, TransitionInput } from "~/models/types";

const TEST_RECORD_TRANSITIONS: TransitionRule[] = [
  {
    from: "DRAFT",
    to: "SUBMITTED",
    allowedRoles: ["CONSTRUCTION_TEAM"],
    action: "提交测试记录",
    nextHolderRole: "PROJECT_MANAGER",
  },
  {
    from: "SUBMITTED",
    to: "UNDER_REVIEW",
    allowedRoles: ["PROJECT_MANAGER"],
    action: "开始审核",
    nextHolderRole: "PROJECT_MANAGER",
  },
  {
    from: "UNDER_REVIEW",
    to: "ACCEPTED",
    allowedRoles: ["PROJECT_MANAGER"],
    action: "审核通过",
    nextHolderRole: "DOCUMENT_CLERK",
  },
  {
    from: "UNDER_REVIEW",
    to: "REJECTED",
    allowedRoles: ["PROJECT_MANAGER"],
    action: "审核退回",
    nextHolderRole: "CONSTRUCTION_TEAM",
    requiresRework: true,
  },
  {
    from: "REJECTED",
    to: "SUBMITTED",
    allowedRoles: ["CONSTRUCTION_TEAM"],
    action: "重新提交（整改后）",
    nextHolderRole: "PROJECT_MANAGER",
  },
  {
    from: "ACCEPTED",
    to: "ARCHIVED",
    allowedRoles: ["DOCUMENT_CLERK"],
    action: "归档",
  },
  {
    from: "SUBMITTED",
    to: "DRAFT",
    allowedRoles: ["PROJECT_MANAGER"],
    action: "退回草稿（补充材料）",
    nextHolderRole: "CONSTRUCTION_TEAM",
    requiresSupplement: true,
  },
  {
    from: "REJECTED",
    to: "DRAFT",
    allowedRoles: ["CONSTRUCTION_TEAM"],
    action: "退回草稿（补充材料）",
    nextHolderRole: "CONSTRUCTION_TEAM",
    requiresSupplement: true,
  },
];

const REWORK_ORDER_TRANSITIONS: TransitionRule[] = [
  {
    from: "GENERATED",
    to: "ASSIGNED",
    allowedRoles: ["PROJECT_MANAGER"],
    action: "分配整改任务",
    nextHolderRole: "CONSTRUCTION_TEAM",
  },
  {
    from: "ASSIGNED",
    to: "RECTIFYING",
    allowedRoles: ["CONSTRUCTION_TEAM"],
    action: "开始整改",
    nextHolderRole: "CONSTRUCTION_TEAM",
  },
  {
    from: "RECTIFYING",
    to: "RESUBMITTED",
    allowedRoles: ["CONSTRUCTION_TEAM"],
    action: "提交整改结果",
    nextHolderRole: "PROJECT_MANAGER",
  },
  {
    from: "RESUBMITTED",
    to: "VERIFIED",
    allowedRoles: ["PROJECT_MANAGER"],
    action: "验证通过",
    nextHolderRole: "DOCUMENT_CLERK",
  },
  {
    from: "RESUBMITTED",
    to: "RECTIFYING",
    allowedRoles: ["PROJECT_MANAGER"],
    action: "验证不通过，继续整改",
    nextHolderRole: "CONSTRUCTION_TEAM",
  },
  {
    from: "VERIFIED",
    to: "CLOSED",
    allowedRoles: ["DOCUMENT_CLERK"],
    action: "关闭整改单",
  },
];

export const TEST_RECORD_MACHINE: StateMachineConfig = {
  entity: "TEST_RECORD",
  transitions: TEST_RECORD_TRANSITIONS,
};

export const REWORK_ORDER_MACHINE: StateMachineConfig = {
  entity: "REWORK_ORDER",
  transitions: REWORK_ORDER_TRANSITIONS,
};

export function findTransition(
  config: StateMachineConfig,
  fromStatus: string,
  toStatus: string,
  operatorRole: string
): TransitionRule | null {
  const rule = config.transitions.find(
    (t) => t.from === fromStatus && t.to === toStatus
  );
  if (!rule) return null;
  if (!rule.allowedRoles.includes(operatorRole as typeof rule.allowedRoles[number])) return null;
  return rule;
}

export function getAvailableTransitions(
  config: StateMachineConfig,
  currentStatus: string,
  operatorRole: string
): TransitionRule[] {
  return config.transitions.filter(
    (t) =>
      t.from === currentStatus &&
      t.allowedRoles.includes(operatorRole as typeof t.allowedRoles[number])
  );
}

export function validateTransition(input: TransitionInput, config: StateMachineConfig): {
  valid: boolean;
  rule: TransitionRule | null;
  error?: string;
} {
  const rule = findTransition(config, input.fromStatus, input.toStatus, input.operatorRole);
  if (!rule) {
    return {
      valid: false,
      rule: null,
      error: `不允许从 ${input.fromStatus} 转到 ${input.toStatus}，或角色 ${input.operatorRole} 无权执行此操作`,
    };
  }
  return { valid: true, rule };
}
