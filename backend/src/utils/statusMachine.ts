import {
  ProjectStatus,
  UserRole,
  StatusTransition,
  ArrangementStatus,
  ArrangementTransition,
  Project,
  ProjectArrangement,
  ExpertSigninRecord,
  BlockAnalysis,
  SigninAnalysis,
  ResponsibilityMatrix,
  roleNames,
  ExceptionType,
} from '../types';

export const projectStatusTransitions: StatusTransition[] = [
  {
    from: null,
    to: 'draft',
    action: 'create_project',
    allowedRoles: ['project_specialist'],
    requiredHandlerRole: 'project_specialist',
    description: '创建项目',
  },
  {
    from: 'draft',
    to: 'arrangement_pending',
    action: 'submit_arrangement',
    allowedRoles: ['project_specialist'],
    requiredHandlerRole: 'review_secretary',
    description: '提交开评标安排待审核',
  },
  {
    from: 'arrangement_pending',
    to: 'arrangement_reviewing',
    action: 'start_review',
    allowedRoles: ['review_secretary'],
    requiredHandlerRole: 'review_secretary',
    description: '开始审核开评标安排',
  },
  {
    from: 'arrangement_reviewing',
    to: 'arrangement_approved',
    action: 'approve_arrangement',
    allowedRoles: ['review_secretary'],
    requiredHandlerRole: 'project_specialist',
    description: '开评标安排审核通过',
  },
  {
    from: 'arrangement_reviewing',
    to: 'arrangement_rejected',
    action: 'reject_arrangement',
    allowedRoles: ['review_secretary'],
    requiredHandlerRole: 'project_specialist',
    description: '开评标安排已退回',
    autoTriggerException: 'other',
  },
  {
    from: 'arrangement_rejected',
    to: 'arrangement_reviewing',
    action: 'resubmit_arrangement',
    allowedRoles: ['project_specialist'],
    requiredHandlerRole: 'review_secretary',
    description: '重新提交开评标安排',
  },
  {
    from: 'arrangement_approved',
    to: 'bidding_pending',
    action: 'confirm_finance',
    allowedRoles: ['finance'],
    requiredHandlerRole: 'project_specialist',
    description: '财务确认，待开标',
  },
  {
    from: 'bidding_pending',
    to: 'bidding_in_progress',
    action: 'start_bidding',
    allowedRoles: ['project_specialist', 'review_secretary'],
    requiredHandlerRole: 'review_secretary',
    description: '开标开始',
  },
  {
    from: 'bidding_in_progress',
    to: 'bidding_completed',
    action: 'complete_bidding',
    allowedRoles: ['review_secretary'],
    requiredHandlerRole: 'review_secretary',
    description: '开标完成',
  },
  {
    from: 'bidding_completed',
    to: 'expert_signin_pending',
    action: 'prepare_signin',
    allowedRoles: ['review_secretary'],
    requiredHandlerRole: 'review_secretary',
    description: '准备专家签到',
  },
  {
    from: 'expert_signin_pending',
    to: 'expert_signin_in_progress',
    action: 'start_signin',
    allowedRoles: ['review_secretary'],
    requiredHandlerRole: 'review_secretary',
    description: '专家签到开始',
  },
  {
    from: 'expert_signin_in_progress',
    to: 'expert_signin_completed',
    action: 'complete_signin',
    allowedRoles: ['review_secretary'],
    requiredHandlerRole: 'review_secretary',
    description: '专家签到完成',
  },
  {
    from: 'expert_signin_completed',
    to: 'evaluation_in_progress',
    action: 'start_evaluation',
    allowedRoles: ['review_secretary'],
    requiredHandlerRole: 'review_secretary',
    description: '评标开始',
  },
  {
    from: 'evaluation_in_progress',
    to: 'evaluation_completed',
    action: 'complete_evaluation',
    allowedRoles: ['review_secretary'],
    requiredHandlerRole: 'project_specialist',
    description: '评标完成',
  },
  {
    from: 'evaluation_completed',
    to: 'archived',
    action: 'archive_project',
    allowedRoles: ['project_specialist'],
    requiredHandlerRole: 'project_specialist',
    description: '项目归档',
  },
];

export const arrangementTransitions: ArrangementTransition[] = [
  {
    from: null,
    to: 'pending',
    action: 'create_arrangement',
    allowedRoles: ['project_specialist'],
    description: '创建开评标安排',
  },
  {
    from: 'pending',
    to: 'reviewing',
    action: 'submit_review',
    allowedRoles: ['project_specialist'],
    description: '提交审核',
  },
  {
    from: 'reviewing',
    to: 'approved',
    action: 'approve',
    allowedRoles: ['review_secretary'],
    description: '审核通过',
  },
  {
    from: 'reviewing',
    to: 'rejected',
    action: 'reject',
    allowedRoles: ['review_secretary'],
    description: '审核退回',
  },
  {
    from: 'rejected',
    to: 'modified',
    action: 'modify',
    allowedRoles: ['project_specialist'],
    description: '修改安排',
  },
  {
    from: 'modified',
    to: 'reviewing',
    action: 'resubmit',
    allowedRoles: ['project_specialist'],
    description: '重新提交审核',
  },
  {
    from: 'approved',
    to: 'modified',
    action: 'modify_approved',
    allowedRoles: ['project_specialist', 'review_secretary'],
    description: '修改已批准的安排',
  },
];

export const getAvailableTransitions = (
  currentStatus: ProjectStatus,
  userRole: UserRole
): StatusTransition[] => {
  return projectStatusTransitions.filter(
    (t) => t.from === currentStatus && t.allowedRoles.includes(userRole)
  );
};

export const canTransition = (
  from: ProjectStatus,
  to: ProjectStatus,
  userRole: UserRole
): boolean => {
  return projectStatusTransitions.some(
    (t) => t.from === from && t.to === to && t.allowedRoles.includes(userRole)
  );
};

export const getTransitionAction = (
  from: ProjectStatus,
  to: ProjectStatus
): StatusTransition | undefined => {
  return projectStatusTransitions.find((t) => t.from === from && t.to === to);
};

export const getRequiredHandlerRole = (
  currentStatus: ProjectStatus
): UserRole | null => {
  const transition = projectStatusTransitions.find((t) => t.from === currentStatus);
  return transition?.requiredHandlerRole || null;
};

export const getArrangementAvailableTransitions = (
  currentStatus: ArrangementStatus,
  userRole: UserRole
): ArrangementTransition[] => {
  return arrangementTransitions.filter(
    (t) => t.from === currentStatus && t.allowedRoles.includes(userRole)
  );
};

export const analyzeBlock = (
  project: Project,
  arrangement: ProjectArrangement | null
): BlockAnalysis => {
  const pendingActions: string[] = [];
  let blockReason: string | null = null;
  let blockHandlerRole: UserRole | null = null;
  let blockHandlerId: string | null = null;
  let blockHandlerName: string | null = null;
  let blockAt: string | null = null;

  if (arrangement?.blockReason && arrangement.blockAt) {
    blockReason = arrangement.blockReason;
    blockAt = arrangement.blockAt;
    blockHandlerId = arrangement.blockHandlerId;
    blockHandlerName = arrangement.blockHandlerName;
  }

  switch (project.status) {
    case 'arrangement_pending':
      if (!arrangement) {
        blockReason = '尚未创建开评标安排';
        blockHandlerRole = 'project_specialist';
        blockHandlerId = project.projectSpecialistId;
        blockHandlerName = project.projectSpecialistName;
        pendingActions.push('创建开评标安排');
      } else if (arrangement.status === 'pending') {
        blockReason = '开评标安排尚未提交审核';
        blockHandlerRole = 'project_specialist';
        blockHandlerId = project.projectSpecialistId;
        blockHandlerName = project.projectSpecialistName;
        pendingActions.push('提交开评标安排审核');
      }
      break;

    case 'arrangement_reviewing':
      blockReason = '开评标安排正在等待评审秘书审核';
      blockHandlerRole = 'review_secretary';
      blockHandlerId = project.reviewSecretaryId;
      blockHandlerName = project.reviewSecretaryName;
      pendingActions.push('审核开评标安排');
      break;

    case 'arrangement_rejected':
      blockReason = arrangement?.rejectReason || '开评标安排被退回，需要修改';
      blockAt = arrangement?.rejectedAt || blockAt;
      blockHandlerRole = 'project_specialist';
      blockHandlerId = project.projectSpecialistId;
      blockHandlerName = project.projectSpecialistName;
      pendingActions.push('修改并重新提交开评标安排');
      break;

    case 'arrangement_approved':
      if (arrangement && !arrangement.financeConfirmed) {
        blockReason = '等待财务确认费用和押金';
        blockHandlerRole = 'finance';
        blockHandlerId = project.financeId;
        blockHandlerName = project.financeName;
        pendingActions.push('财务确认费用');
        pendingActions.push('确认押金到账');
      }
      break;

    case 'bidding_pending':
      blockReason = '等待开标开始';
      blockHandlerRole = 'project_specialist';
      blockHandlerId = project.projectSpecialistId;
      blockHandlerName = project.projectSpecialistName;
      pendingActions.push('确认开标准备工作完成');
      break;

    case 'expert_signin_in_progress':
      blockReason = '专家签到进行中';
      blockHandlerRole = 'review_secretary';
      blockHandlerId = project.reviewSecretaryId;
      blockHandlerName = project.reviewSecretaryName;
      pendingActions.push('完成专家签到');
      break;

    default:
      break;
  }

  if (arrangement) {
    if (!arrangement.documentPreparation) {
      pendingActions.push('完成招标文件准备');
    }
    if (!arrangement.venueReservation) {
      pendingActions.push('完成场地预约');
    }
    if (!arrangement.equipmentCheck) {
      pendingActions.push('完成设备检查');
    }
    if (!arrangement.materialPrinting) {
      pendingActions.push('完成资料打印');
    }
    if (!arrangement.financeConfirmed) {
      pendingActions.push('完成财务确认');
    }
    if (!arrangement.depositReceived) {
      pendingActions.push('确认押金到账');
    }
    if (!arrangement.feeCalculated) {
      pendingActions.push('完成费用计算');
    }
  }

  const nextHandlerRole = getRequiredHandlerRole(project.status);
  const nextHandler = nextHandlerRole
    ? {
        role: nextHandlerRole,
        roleName: roleNames[nextHandlerRole],
        userId:
          nextHandlerRole === 'project_specialist'
            ? project.projectSpecialistId
            : nextHandlerRole === 'review_secretary'
            ? project.reviewSecretaryId
            : project.financeId,
        userName:
          nextHandlerRole === 'project_specialist'
            ? project.projectSpecialistName
            : nextHandlerRole === 'review_secretary'
            ? project.reviewSecretaryName
            : project.financeName,
      }
    : null;

  const blockedDuration = blockAt
    ? Math.floor((Date.now() - new Date(blockAt).getTime()) / (1000 * 60 * 60))
    : 0;

  return {
    isBlocked: pendingActions.length > 0,
    blockReason,
    blockAt,
    blockHandlerId,
    blockHandlerName,
    blockHandlerRole,
    blockedDuration,
    pendingActions,
    nextHandler,
  };
};

export const analyzeSignin = (
  signinRecords: ExpertSigninRecord[]
): SigninAnalysis => {
  const totalExperts = signinRecords.length;
  const confirmedCount = signinRecords.filter((r) => r.status === 'confirmed').length;
  const absentCount = signinRecords.filter((r) => r.status === 'absent').length;
  const leaveCount = signinRecords.filter((r) => r.status === 'leave' || r.status === 'substituted').length;
  const pendingCount = signinRecords.filter((r) => r.status === 'pending').length;
  const signinRate = totalExperts > 0 ? Math.round((confirmedCount / totalExperts) * 100) : 0;
  const isComplete = totalExperts > 0 && pendingCount === 0;

  let incompleteReason: string | null = null;
  if (pendingCount > 0) {
    incompleteReason = `还有 ${pendingCount} 位专家尚未签到`;
  } else if (absentCount > 0) {
    incompleteReason = `有 ${absentCount} 位专家缺席，需要确认是否更换专家`;
  } else if (leaveCount > 0 && !isComplete) {
    incompleteReason = `有 ${leaveCount} 位专家请假/已更换，请确认替补专家是否签到`;
  }

  const pendingExperts = signinRecords
    .filter((r) => r.status === 'pending' || r.status === 'leave' || r.status === 'absent')
    .map((r) => ({
      recordId: r.id,
      expertId: r.expertId,
      expertName: r.expertName,
      status: r.status,
      scheduledTime: r.scheduledArrivalTime,
      remark: r.leaveReason || r.signinCompleteReason || null,
    }));

  return {
    totalExperts,
    confirmedCount,
    absentCount,
    leaveCount,
    pendingCount,
    signinRate,
    isComplete,
    incompleteReason,
    pendingExperts,
  };
};

export const getResponsibilityMatrix = (
  project: Project,
  arrangement: ProjectArrangement | null,
  signinRecords: ExpertSigninRecord[]
): ResponsibilityMatrix => {
  const specialistTasks: string[] = [
    '创建并维护项目信息',
    '制定开评标安排',
    '准备招标文件',
    '预约开标场地',
    '协调专家抽取',
  ];

  const secretaryTasks: string[] = [
    '审核开评标安排',
    '主持开标会议',
    '组织专家签到',
    '维护现场秩序',
    '记录评标过程',
  ];

  const financeTasks: string[] = [
    '确认投标押金到账',
    '计算招标代理费用',
    '处理费用结算',
    '出具收费凭证',
  ];

  const specialistTotalChecks = 5;
  const secretaryTotalChecks = 5;
  const financeTotalChecks = 3;
  let specialistPending = 0;
  let secretaryPending = 0;
  let financePending = 0;

  if (arrangement) {
    if (!arrangement.documentPreparation) specialistPending++;
    if (!arrangement.venueReservation) specialistPending++;
    if (!arrangement.materialPrinting) specialistPending++;
    if (arrangement.status === 'pending') specialistPending++;
    if (arrangement.status === 'rejected') specialistPending++;

    if (arrangement.status === 'reviewing') secretaryPending++;
    if (!arrangement.equipmentCheck) secretaryPending++;

    if (!arrangement.financeConfirmed) financePending++;
    if (!arrangement.depositReceived) financePending++;
    if (!arrangement.feeCalculated) financePending++;
  }

  if (project.status === 'arrangement_reviewing') secretaryPending++;
  if (project.status === 'arrangement_rejected') specialistPending++;
  if (project.status === 'arrangement_approved') financePending++;
  if (project.status === 'expert_signin_in_progress') secretaryPending++;

  const signinAnalysis = analyzeSignin(signinRecords);
  if (signinAnalysis.pendingCount > 0) secretaryPending++;
  if (signinAnalysis.absentCount > 0) {
    specialistPending++;
    secretaryPending++;
  }

  const specialistCompleted = Math.max(0, specialistTotalChecks - specialistPending);
  const secretaryCompleted = Math.max(0, secretaryTotalChecks - secretaryPending);
  const financeCompleted = Math.max(0, financeTotalChecks - financePending);

  return {
    projectSpecialist: {
      userId: project.projectSpecialistId,
      userName: project.projectSpecialistName,
      responsibilities: specialistTasks,
      pendingTasks: specialistPending,
      completedTasks: specialistCompleted,
    },
    reviewSecretary: {
      userId: project.reviewSecretaryId,
      userName: project.reviewSecretaryName,
      responsibilities: secretaryTasks,
      pendingTasks: secretaryPending,
      completedTasks: secretaryCompleted,
    },
    finance: {
      userId: project.financeId,
      userName: project.financeName,
      responsibilities: financeTasks,
      pendingTasks: financePending,
      completedTasks: financeCompleted,
    },
  };
};

export const checkAutoTriggerException = (
  project: Project,
  arrangement: ProjectArrangement | null,
  signinRecords: ExpertSigninRecord[]
): ExceptionType | null => {
  if (arrangement && arrangement.status === 'reviewing') {
    const reviewTime = new Date(arrangement.createdAt).getTime();
    const hoursSinceReview = (Date.now() - reviewTime) / (1000 * 60 * 60);
    if (hoursSinceReview > 24) {
      return 'arrangement_timeout';
    }
  }

  const signinAnalysis = analyzeSignin(signinRecords);
  if (signinAnalysis.absentCount > 0) {
    return 'expert_absent';
  }

  if (signinAnalysis.pendingCount > 0 && project.status === 'expert_signin_in_progress') {
    const startTime = signinRecords[0]?.scheduledArrivalTime;
    if (startTime) {
      const scheduledTime = new Date(startTime).getTime();
      const minutesLate = (Date.now() - scheduledTime) / (1000 * 60);
      if (minutesLate > 30) {
        return 'signin_incomplete';
      }
    }
  }

  return null;
};
