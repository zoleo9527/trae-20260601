import {
  Lead,
  FollowupRecord,
  StatusTransition,
  ExceptionLog,
  User,
  Role,
  LeadStatus,
  ExceptionType,
  EXCEPTION_TYPE_LABELS,
} from '../types';
import {
  validateTransition,
  detectGap,
  getTransitionRule,
  RESPONSIBILITY_HANDOFF_MAP,
} from '../utils/stateMachine';
import * as dao from '../db/dao';
import { getUsersByRole } from '../db/dao';

export interface TransitionRequest {
  leadId: string;
  toStatus: LeadStatus;
  followup: Partial<FollowupRecord> | null;
  nextResponsible: string | null;
  nextResponsibleRole: string | null;
  remark: string;
}

export interface TransitionResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  lead?: Lead;
  transition?: StatusTransition;
  followup?: FollowupRecord;
  exception?: ExceptionLog;
}

export async function executeStatusTransition(
  req: TransitionRequest,
  currentUser: User
): Promise<TransitionResult> {
  const lead = await dao.getLeadById(req.leadId);
  if (!lead) {
    return {
      success: false,
      errors: ['线索不存在'],
      warnings: [],
    };
  }

  let followupRecord: FollowupRecord | null = null;
  if (req.followup && Object.keys(req.followup).length > 0) {
    const now = new Date().toISOString();
    followupRecord = {
      id: '',
      leadId: lead.id,
      type: req.followup.type || 'other',
      content: req.followup.content || '',
      location: req.followup.location,
      scheduledAt: req.followup.scheduledAt || null,
      startedAt: req.followup.startedAt || now,
      completedAt: req.followup.completedAt || null,
      status: req.followup.status || 'in_progress',
      handledBy: currentUser.id,
      handledRole: currentUser.role,
      nextAction: req.followup.nextAction || '',
      nextActionAt: req.followup.nextActionAt || null,
      nextResponsible: req.nextResponsible,
      nextResponsibleRole: req.nextResponsibleRole as Role | null,
      createdAt: now,
      updatedAt: now,
      attachments: req.followup.attachments || [],
    };
  }

  const validation = validateTransition(
    lead,
    req.toStatus,
    currentUser.role,
    followupRecord,
    req.nextResponsible,
    req.nextResponsibleRole as any
  );

  if (!validation.valid) {
    return {
      success: false,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }

  let finalNextResponsible = req.nextResponsible;
  let finalNextResponsibleRole = req.nextResponsibleRole;

  if (validation.autoAssignRole && !finalNextResponsible) {
    const users = await getUsersByRole(validation.autoAssignRole);
    if (users.length > 0) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      finalNextResponsible = randomUser.id;
      finalNextResponsibleRole = randomUser.role;
    }
  }

  if (validation.autoSetFollowupStatus && followupRecord) {
    followupRecord.status = validation.autoSetFollowupStatus;
    if (
      validation.autoSetFollowupStatus === 'completed' ||
      validation.autoSetFollowupStatus === 'approved'
    ) {
      followupRecord.completedAt = new Date().toISOString();
    }
  }

  const now = new Date();

  let followupId: string | null = null;
  if (followupRecord) {
    followupId = await dao.insertFollowup(followupRecord);
    followupRecord.id = followupId;
  }

  const terminalStatuses: LeadStatus[] = ['converted', 'lost', 'returned'];
  const isGapStart =
    !finalNextResponsible &&
    !terminalStatuses.includes(req.toStatus) &&
    RESPONSIBILITY_HANDOFF_MAP[req.toStatus];

  const transition: Omit<StatusTransition, 'id'> = {
    leadId: lead.id,
    followupId,
    fromStatus: lead.status,
    toStatus: req.toStatus,
    fromFollowupStatus: followupRecord ? null : null,
    toFollowupStatus: followupRecord?.status || null,
    fromResponsible: lead.currentResponsible,
    toResponsible: finalNextResponsible,
    fromResponsibleRole: lead.currentResponsibleRole,
    toResponsibleRole: finalNextResponsibleRole as any,
    transitionedAt: now.toISOString(),
    transitionedBy: currentUser.id,
    transitionedByRole: currentUser.role,
    remark: req.remark,
    isGapDetected: false,
    gapDurationMinutes: isGapStart ? 0 : 0,
  };

  const transitionId = await dao.insertTransition(transition);

  const leadUpdates: Partial<Lead> = {
    status: req.toStatus,
    currentResponsible: finalNextResponsible,
    currentResponsibleRole: finalNextResponsibleRole as any,
  };

  if (req.toStatus === 'assigned' && finalNextResponsible) {
    leadUpdates.assignedTo = finalNextResponsible;
    leadUpdates.assignedRole = finalNextResponsibleRole as any;
    leadUpdates.assignedAt = now.toISOString();
  }

  await dao.updateLead(lead.id, leadUpdates);

  const updatedLeadForGap = (await dao.getLeadById(lead.id)) as Lead;
  const thisTransition = (await dao.getLastTransitionByLeadId(lead.id)) as StatusTransition;
  const gapDetection = detectGap(updatedLeadForGap, thisTransition, now);

  if (gapDetection.hasGap) {
    await dao.updateTransition(transitionId, {
      isGapDetected: true,
      gapDurationMinutes: gapDetection.gapDuration,
    });
  }

  let exception: ExceptionLog | undefined;
  if (gapDetection.hasGap && gapDetection.exceptionType) {
    exception = {
      id: '',
      leadId: lead.id,
      followupId,
      type: gapDetection.exceptionType,
      message: `状态流转检测到异常: ${EXCEPTION_TYPE_LABELS[gapDetection.exceptionType]}，空档时长: ${gapDetection.gapDuration.toFixed(2)}小时`,
      detectedAt: now.toISOString(),
      handled: false,
      handledAt: null,
      handledBy: null,
      handledRemark: null,
      triggeredByTransitionId: transitionId,
    };
    const exceptionId = await dao.insertException(exception);
    exception.id = exceptionId;

    await dao.updateLead(lead.id, {
      hasException: true,
      exceptionType: gapDetection.exceptionType,
      exceptionMessage: exception.message,
      exceptionAt: exception.detectedAt,
    });
  }

  const updatedLead = await dao.getLeadById(lead.id);

  return {
    success: true,
    errors: [],
    warnings: validation.warnings,
    lead: updatedLead || undefined,
    transition: {
      ...transition,
      id: transitionId,
      isGapDetected: gapDetection.hasGap,
      gapDurationMinutes: gapDetection.gapDuration,
    },
    followup: followupRecord || undefined,
    exception,
  };
}

export async function returnLead(
  leadId: string,
  reason: string,
  currentUser: User
): Promise<TransitionResult> {
  return executeStatusTransition(
    {
      leadId,
      toStatus: 'returned',
      followup: {
        type: 'other',
        content: `退回原因: ${reason}`,
        status: 'rejected',
      },
      nextResponsible: null,
      nextResponsibleRole: null,
      remark: reason,
    },
    currentUser
  );
}

export async function flagException(
  leadId: string,
  followupId: string | null,
  type: ExceptionType,
  message: string,
  currentUser: User
): Promise<ExceptionLog> {
  const now = new Date().toISOString();

  const exception: Omit<ExceptionLog, 'id'> = {
    leadId,
    followupId,
    type,
    message,
    detectedAt: now,
    handled: false,
    handledAt: null,
    handledBy: null,
    handledRemark: null,
    triggeredByTransitionId: null,
  };

  const exceptionId = await dao.insertException(exception);

  await dao.updateLead(leadId, {
    hasException: true,
    exceptionType: type,
    exceptionMessage: message,
    exceptionAt: now,
  });

  return { ...exception, id: exceptionId };
}

async function syncLeadExceptionFields(leadId: string): Promise<void> {
  const remaining = await dao.getUnhandledExceptions(leadId);
  if (remaining.length === 0) {
    await dao.updateLead(leadId, {
      hasException: false,
      exceptionType: null,
      exceptionMessage: null,
      exceptionAt: null,
    });
  } else {
    const latest = remaining.sort((a, b) => b.detectedAt.localeCompare(a.detectedAt))[0];
    await dao.updateLead(leadId, {
      hasException: true,
      exceptionType: latest.type,
      exceptionMessage: latest.message,
      exceptionAt: latest.detectedAt,
    });
  }
}

export async function handleException(
  exceptionId: string,
  remark: string,
  currentUser: User
): Promise<void> {
  const now = new Date().toISOString();

  const exceptionRows = await dao.getUnhandledExceptions();
  const targetException = exceptionRows.find((e) => e.id === exceptionId);
  const leadId = targetException?.leadId;

  await dao.updateException(exceptionId, {
    handled: true,
    handledAt: now,
    handledBy: currentUser.id,
    handledRemark: remark,
  });

  if (leadId) {
    await syncLeadExceptionFields(leadId);
  }
}

export async function reassignLead(
  leadId: string,
  newResponsibleId: string,
  newResponsibleRole: string,
  reason: string,
  currentUser: User
): Promise<void> {
  const lead = await dao.getLeadById(leadId);
  if (!lead) {
    throw new Error('线索不存在');
  }

  const now = new Date().toISOString();

  await dao.insertFollowup({
    leadId,
    type: 'other',
    content: `重新分配责任人，原因: ${reason}`,
    location: undefined,
    scheduledAt: null,
    startedAt: now,
    completedAt: now,
    status: 'completed',
    handledBy: currentUser.id,
    handledRole: currentUser.role,
    nextAction: '',
    nextActionAt: null,
    nextResponsible: newResponsibleId,
    nextResponsibleRole: newResponsibleRole as any,
    createdAt: now,
    updatedAt: now,
    attachments: [],
  });

  await dao.insertTransition({
    leadId,
    followupId: null,
    fromStatus: lead.status,
    toStatus: lead.status,
    fromFollowupStatus: null,
    toFollowupStatus: null,
    fromResponsible: lead.currentResponsible,
    toResponsible: newResponsibleId,
    fromResponsibleRole: lead.currentResponsibleRole,
    toResponsibleRole: newResponsibleRole as any,
    transitionedAt: now,
    transitionedBy: currentUser.id,
    transitionedByRole: currentUser.role,
    remark: `重新分配: ${reason}`,
    isGapDetected: false,
    gapDurationMinutes: 0,
  });

  await dao.updateLead(leadId, {
    currentResponsible: newResponsibleId,
    currentResponsibleRole: newResponsibleRole as any,
    assignedTo: newResponsibleId,
    assignedRole: newResponsibleRole as any,
    assignedAt: now,
  });

  const exceptions = await dao.getUnhandledExceptions(leadId);
  const gapExceptions = exceptions.filter(
    (e) =>
      e.type === 'status_gap_detected' ||
      e.type === 'unassigned_over_24h' ||
      e.type === 'no_followup_over_48h' ||
      e.type === 'followup_overdue'
  );

  for (const ex of gapExceptions) {
    await dao.updateException(ex.id, {
      handled: true,
      handledAt: now,
      handledBy: currentUser.id,
      handledRemark: `通过重新分配责任人解决（新责任人: ${newResponsibleId}）`,
    });
  }

  await syncLeadExceptionFields(leadId);
}

export async function scanForGaps(): Promise<ExceptionLog[]> {
  const { data: leads } = await dao.getLeads({
    pageSize: 1000,
  });

  const exceptions: ExceptionLog[] = [];
  const now = new Date();
  const terminalStatuses: LeadStatus[] = ['converted', 'lost', 'returned'];

  for (const lead of leads) {
    if (terminalStatuses.includes(lead.status)) {
      continue;
    }

    const lastTransition = await dao.getLastTransitionByLeadId(lead.id);
    const gapDetection = detectGap(lead, lastTransition, now);

    if (gapDetection.hasGap && gapDetection.exceptionType) {
      const existingExceptions = await dao.getUnhandledExceptions(lead.id);
      const alreadyHasException = existingExceptions.some(
        (e) => e.type === gapDetection.exceptionType
      );

      if (!alreadyHasException) {
        let triggeredByTransitionId: string | null = null;

        if (
          lastTransition &&
          (gapDetection.exceptionType === 'status_gap_detected' ||
            gapDetection.exceptionType === 'no_followup_over_48h')
        ) {
          triggeredByTransitionId = lastTransition.id;
          await dao.updateTransition(lastTransition.id, {
            isGapDetected: true,
            gapDurationMinutes: gapDetection.gapDuration,
          });
        }

        const exception: Omit<ExceptionLog, 'id'> = {
          leadId: lead.id,
          followupId: null,
          type: gapDetection.exceptionType,
          message: `自动检测到异常: ${EXCEPTION_TYPE_LABELS[gapDetection.exceptionType]}，空档时长: ${gapDetection.gapDuration.toFixed(2)}小时`,
          detectedAt: now.toISOString(),
          handled: false,
          handledAt: null,
          handledBy: null,
          handledRemark: null,
          triggeredByTransitionId,
        };

        const exceptionId = await dao.insertException(exception);
        exceptions.push({ ...exception, id: exceptionId });

        await dao.updateLead(lead.id, {
          hasException: true,
          exceptionType: gapDetection.exceptionType,
          exceptionMessage: exception.message,
          exceptionAt: exception.detectedAt,
        });
      }
    }
  }

  return exceptions;
}

export async function createLead(
  leadData: {
    companyName: string;
    contactPerson: string;
    contactPhone: string;
    industry?: string;
    requiredArea?: number;
    budget?: number;
    sourceType: 'old_ledger' | 'site_record' | 'chat_screenshot' | 'other';
    sourceReference: string;
    priority?: 'high' | 'medium' | 'low';
    tags?: string[];
    remark?: string;
  },
  currentUser: User
): Promise<Lead> {
  const now = new Date().toISOString();

  const lead: Omit<Lead, 'id'> = {
    companyName: leadData.companyName,
    contactPerson: leadData.contactPerson,
    contactPhone: leadData.contactPhone,
    industry: leadData.industry || '',
    requiredArea: leadData.requiredArea || 0,
    budget: leadData.budget || 0,
    status: 'new',
    source: {
      type: leadData.sourceType,
      reference: leadData.sourceReference,
      uploadedAt: now,
      uploadedBy: currentUser.id,
    },
    assignedTo: null,
    assignedRole: null,
    assignedAt: null,
    currentResponsible: null,
    currentResponsibleRole: null,
    createdAt: now,
    updatedAt: now,
    createdBy: currentUser.id,
    priority: leadData.priority || 'medium',
    tags: leadData.tags || [],
    remark: leadData.remark || '',
    hasException: false,
    exceptionType: null,
    exceptionMessage: null,
    exceptionAt: null,
  };

  const leadId = await dao.insertLead(lead);

  await dao.insertTransition({
    leadId,
    followupId: null,
    fromStatus: null,
    toStatus: 'new',
    fromFollowupStatus: null,
    toFollowupStatus: null,
    fromResponsible: null,
    toResponsible: null,
    fromResponsibleRole: null,
    toResponsibleRole: null,
    transitionedAt: now,
    transitionedBy: currentUser.id,
    transitionedByRole: currentUser.role,
    remark: '新建线索',
    isGapDetected: false,
    gapDurationMinutes: 0,
  });

  const createdLead = await dao.getLeadById(leadId);
  if (!createdLead) {
    throw new Error('创建线索失败');
  }

  return createdLead;
}
