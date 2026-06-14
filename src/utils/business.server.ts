import { prisma } from './db.server';
import type { BusinessStatus, UserRole, BusinessCase, TimelineEvent, DocumentIssue } from '@prisma/client';

export async function getDashboardData(userId: string, userRole: UserRole) {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

  const baseQuery = {
    createdAt: {
      gte: startOfDay,
      lte: endOfDay,
    },
  };

  const [
    pendingCases,
    timeoutCases,
    returnedCases,
    completedToday,
    totalToday,
  ] = await Promise.all([
    prisma.businessCase.findMany({
      where: {
        ...baseQuery,
        status: {
          in: ['ACCEPTED', 'DOCUMENT_CHECKING', 'DUE_DILIGENCE', 'PROCESSING', 'PENDING_AUTHORIZATION', 'AUTHORIZATION_REVIEW'] as BusinessStatus[],
        },
      },
      include: {
        customer: true,
        assignee: { select: { id: true, name: true, role: true } },
        acceptor: { select: { id: true, name: true, role: true } },
        documentCheck: true,
        dueDiligence: true,
        authReviews: { orderBy: { createdAt: 'desc' }, take: 1 },
        timeline: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    }),
    prisma.businessCase.findMany({
      where: {
        ...baseQuery,
        OR: [
          { status: 'TIMEOUT' as BusinessStatus },
          { timeoutWarning: true },
          { complaints: { some: { type: 'PROCESS_TIMEOUT' } } },
        ],
      },
      include: {
        customer: true,
        assignee: { select: { id: true, name: true, role: true } },
        acceptor: { select: { id: true, name: true, role: true } },
        documentCheck: true,
        complaints: true,
        timeline: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.businessCase.findMany({
      where: {
        ...baseQuery,
        status: 'RETURNED' as BusinessStatus,
      },
      include: {
        customer: true,
        assignee: { select: { id: true, name: true, role: true } },
        acceptor: { select: { id: true, name: true, role: true } },
        authReviews: {
          where: { result: 'RETURNED' },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { reviewedBy: { select: { id: true, name: true, role: true } } },
        },
        timeline: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.businessCase.count({
      where: {
        ...baseQuery,
        status: 'COMPLETED' as BusinessStatus,
      },
    }),
    prisma.businessCase.count({
      where: baseQuery,
    }),
  ]);

  const statistics = {
    totalToday,
    completedToday,
    pendingCount: pendingCases.length,
    timeoutCount: timeoutCases.length,
    returnedCount: returnedCases.length,
  };

  return {
    statistics,
    pendingCases,
    timeoutCases,
    returnedCases,
  };
}

export async function getCaseList(
  userId: string,
  userRole: UserRole,
  filters?: {
    status?: BusinessStatus;
    dateFrom?: Date;
    dateTo?: Date;
  }
) {
  const where: any = {};

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.dateFrom) {
    where.createdAt = { ...where.createdAt, gte: filters.dateFrom };
  }

  if (filters?.dateTo) {
    where.createdAt = { ...where.createdAt, lte: filters.dateTo };
  }

  return prisma.businessCase.findMany({
    where,
    include: {
      customer: true,
      assignee: { select: { id: true, name: true, role: true } },
      acceptor: { select: { id: true, name: true, role: true } },
      documentCheck: true,
      authReviews: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    take: 100,
  });
}

export async function getCaseDetail(caseId: string) {
  return prisma.businessCase.findUnique({
    where: { id: caseId },
    include: {
      customer: true,
      queueTicket: true,
      assignee: { select: { id: true, name: true, role: true, username: true } },
      acceptor: { select: { id: true, name: true, role: true, username: true } },
      documentCheck: true,
      dueDiligence: true,
      timeline: {
        include: { createdBy: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: 'asc' },
      },
      authReviews: {
        include: { reviewedBy: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: 'desc' },
      },
      complaints: {
        include: { reportedBy: { select: { id: true, name: true, role: true } } },
      },
    },
  }) as any;
}

export async function getAuthReviewList(userId: string, userRole: UserRole) {
  const where: any = {
    status: {
      in: ['PENDING_AUTHORIZATION', 'AUTHORIZATION_REVIEW'] as BusinessStatus[],
    },
  };

  return prisma.businessCase.findMany({
    where,
    include: {
      customer: true,
      assignee: { select: { id: true, name: true, role: true } },
      acceptor: { select: { id: true, name: true, role: true } },
      documentCheck: true,
      dueDiligence: true,
      authReviews: {
        include: { reviewedBy: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: 'desc' },
      },
      timeline: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
    orderBy: [{ priority: 'desc' }, { authPendingAt: 'asc' }],
  });
}

export async function updateCaseStatus(
  caseId: string,
  newStatus: BusinessStatus,
  userId: string,
  eventType: string,
  description: string,
  note?: string
) {
  return prisma.$transaction(async (tx) => {
    const businessCase = await tx.businessCase.update({
      where: { id: caseId },
      data: {
        status: newStatus,
        ...(newStatus === 'ACCEPTED' && { acceptedAt: new Date() }),
        ...(newStatus === 'PROCESSING' && { processingAt: new Date() }),
        ...(newStatus === 'PENDING_AUTHORIZATION' && { authPendingAt: new Date() }),
        ...(newStatus === 'COMPLETED' && { completedAt: new Date() }),
      },
    });

    await tx.timelineEvent.create({
      data: {
        caseId,
        eventType,
        status: newStatus,
        description,
        note,
        createdById: userId,
      },
    });

    return businessCase;
  });
}

export async function createAuthReview(
  caseId: string,
  userId: string,
  result: 'APPROVED' | 'REJECTED' | 'RETURNED' | 'ESCALATED',
  reason: string,
  note?: string,
  reviewLevel: number = 1,
  parentReviewId?: string
) {
  return prisma.$transaction(async (tx) => {
    const businessCase = await tx.businessCase.findUnique({ where: { id: caseId } });
    if (!businessCase) throw new Error('Case not found');

    const review = await tx.authorizationReview.create({
      data: {
        caseId,
        reviewLevel,
        result,
        reason,
        note,
        reviewedById: userId,
        reviewRequestAt: businessCase.authPendingAt || new Date(),
        parentReviewId,
      },
    });

    let newStatus: BusinessStatus = businessCase.status;
    let eventType = 'AUTH_REVIEW';
    let description = '授权复核处理';

    if (result === 'APPROVED') {
      newStatus = 'AUTHORIZED';
      eventType = 'AUTH_APPROVE';
      description = '授权已通过';
    } else if (result === 'REJECTED') {
      newStatus = 'REJECTED';
      eventType = 'AUTH_REJECT';
      description = '授权已拒绝';
    } else if (result === 'RETURNED') {
      newStatus = 'RETURNED';
      eventType = 'AUTH_RETURN';
      description = '授权已退回';
    } else if (result === 'ESCALATED') {
      newStatus = 'PENDING_AUTHORIZATION';
      eventType = 'AUTH_ESCALATE';
      description = '授权已升级';
    }

    await tx.businessCase.update({
      where: { id: caseId },
      data: { status: newStatus },
    });

    await tx.timelineEvent.create({
      data: {
        caseId,
        eventType,
        status: newStatus,
        description,
        note: reason,
        createdById: userId,
      },
    });

    return { review, businessCase: { ...businessCase, status: newStatus } };
  });
}

export async function updateDocumentCheck(
  caseId: string,
  userId: string,
  docData: {
    idCardCopy?: boolean;
    idCardOriginal?: boolean;
    accountBook?: boolean;
    proofOfAddress?: boolean;
    incomeProof?: boolean;
    otherDocs?: string;
    issues?: DocumentIssue[];
    issueNote?: string;
  }
) {
  return prisma.$transaction(async (tx) => {
    const docCheck = await tx.documentCheck.upsert({
      where: { caseId },
      update: {
        ...docData,
        checkedById: userId,
        checkedAt: new Date(),
      },
      create: {
        caseId,
        ...docData,
        checkedById: userId,
        checkedAt: new Date(),
      },
    });

    const hasIssues = docData.issues && docData.issues.length > 0;
    const status = hasIssues ? 'DOCUMENT_CHECKING' : 'DOCUMENT_CHECKING';
    const description = hasIssues ? '资料检查发现问题' : '资料检查完成';

    await tx.timelineEvent.create({
      data: {
        caseId,
        eventType: 'DOCUMENT_CHECK',
        status,
        description,
        note: docData.issueNote,
        createdById: userId,
      },
    });

    return docCheck;
  });
}

export function getBlockedReason(businessCase: any): string | null {
  if (businessCase.status === 'DOCUMENT_CHECKING' && businessCase.documentCheck?.issues?.length > 0) {
    return `资料问题: ${businessCase.documentCheck.issues.map((i: DocumentIssue) => {
      const labels: Record<DocumentIssue, string> = {
        MISSING_COPY: '资料复印缺页',
        INCOMPLETE_DUE_DILIGENCE: '尽调补件',
        EXPIRED_DOCUMENT: '证件过期',
        SIGNATURE_MISMATCH: '签字不符',
        MISSING_SIGNATURE: '缺少签字',
        OTHER: '其他',
      };
      return labels[i];
    }).join(', ')}`;
  }

  if (businessCase.status === 'DUE_DILIGENCE' && businessCase.dueDiligence?.needsSupplement) {
    return `尽调补件: ${businessCase.dueDiligence.supplementNote || '需要补充材料'}`;
  }

  if (businessCase.status === 'RETURNED' && businessCase.authReviews?.[0]) {
    return `授权退回: ${businessCase.authReviews[0].reason}`;
  }

  if (businessCase.status === 'PENDING_AUTHORIZATION') {
    if (businessCase.authReviews?.length > 0) {
      const lastReview = businessCase.authReviews[0];
      if (lastReview.result === 'ESCALATED') {
        return `等待${lastReview.reviewLevel + 1}级授权: ${lastReview.reason}`;
      }
    }
    return '等待运营主管授权';
  }

  return null;
}

export function getHandlerInfo(businessCase: any): string {
  const roleMap: Record<string, string> = {
    HALL_MANAGER: '大堂经理',
    ACCOUNT_MANAGER: '客户经理',
    OPERATION_SUPERVISOR: '运营主管',
  };
  if (businessCase.assignee) {
    return `${roleMap[businessCase.assignee.role] || ''} ${businessCase.assignee.name}`;
  }
  if (businessCase.acceptor) {
    return `${roleMap[businessCase.acceptor.role] || ''} ${businessCase.acceptor.name} (受理)`;
  }
  return '暂未分配';
}

export async function updateDueDiligence(
  caseId: string,
  userId: string,
  dueDiligenceData: {
    riskLevel?: string;
    pepCheck?: boolean;
    sanctionCheck?: boolean;
    adverseMedia?: boolean;
    sourceOfFunds?: string;
    purpose?: string;
    needsSupplement?: boolean;
    supplementNote?: string;
  }
) {
  return prisma.$transaction(async (tx) => {
    const businessCase = await tx.businessCase.findUnique({ where: { id: caseId } });
    if (!businessCase) throw new Error('Case not found');

    const dueDiligence = await tx.dueDiligenceRecord.upsert({
      where: { caseId },
      update: {
        ...dueDiligenceData,
        completedById: userId,
        completedAt: new Date(),
      },
      create: {
        caseId,
        customerId: businessCase.customerId,
        riskLevel: dueDiligenceData.riskLevel || '低',
        pepCheck: dueDiligenceData.pepCheck || false,
        sanctionCheck: dueDiligenceData.sanctionCheck || false,
        adverseMedia: dueDiligenceData.adverseMedia || false,
        sourceOfFunds: dueDiligenceData.sourceOfFunds,
        purpose: dueDiligenceData.purpose,
        needsSupplement: dueDiligenceData.needsSupplement || false,
        supplementNote: dueDiligenceData.supplementNote,
        completedById: userId,
        completedAt: new Date(),
      },
    });

    const needsSupp = dueDiligenceData.needsSupplement;
    const status = needsSupp ? 'DUE_DILIGENCE' : 'DUE_DILIGENCE';
    const description = needsSupp ? '尽调审查需要补件' : '尽调审查完成';

    await tx.timelineEvent.create({
      data: {
        caseId,
        eventType: 'DUE_DILIGENCE',
        status,
        description,
        note: dueDiligenceData.supplementNote,
        createdById: userId,
      },
    });

    return dueDiligence;
  });
}

export async function advanceCaseStatus(
  caseId: string,
  userId: string,
  note?: string
) {
  return prisma.$transaction(async (tx) => {
    const businessCase = await tx.businessCase.findUnique({ where: { id: caseId } });
    if (!businessCase) throw new Error('Case not found');

    const statusFlow: BusinessStatus[] = [
      'QUEUED', 'ACCEPTED', 'DOCUMENT_CHECKING', 'DUE_DILIGENCE',
      'PROCESSING', 'PENDING_AUTHORIZATION', 'AUTHORIZATION_REVIEW',
      'AUTHORIZED', 'COMPLETED'
    ];
    const currentIndex = statusFlow.indexOf(businessCase.status);
    if (currentIndex === -1 || currentIndex >= statusFlow.length - 1) {
      throw new Error('当前状态无法继续推进');
    }

    const newStatus = statusFlow[currentIndex + 1];
    const eventTypeMap: Record<string, string> = {
      'QUEUED': 'ACCEPT',
      'ACCEPTED': 'DOCUMENT_CHECK',
      'DOCUMENT_CHECKING': 'DUE_DILIGENCE',
      'DUE_DILIGENCE': 'PROCESSING',
      'PROCESSING': 'AUTH_REQUEST',
      'PENDING_AUTHORIZATION': 'AUTH_REVIEW',
      'AUTHORIZED': 'COMPLETE',
    };
    const descriptionMap: Record<string, string> = {
      'QUEUED': '大堂经理受理业务',
      'ACCEPTED': '开始资料检查',
      'DOCUMENT_CHECKING': '开始尽调审查',
      'DUE_DILIGENCE': '柜面业务处理中',
      'PROCESSING': '提交授权复核',
      'PENDING_AUTHORIZATION': '授权复核处理中',
      'AUTHORIZED': '业务完成',
    };

    const eventType = eventTypeMap[businessCase.status] || 'STATUS_CHANGE';
    const description = descriptionMap[businessCase.status] || '状态变更';

    const updatedCase = await tx.businessCase.update({
      where: { id: caseId },
      data: {
        status: newStatus,
        ...(newStatus === 'ACCEPTED' && { acceptedAt: new Date() }),
        ...(newStatus === 'PROCESSING' && { processingAt: new Date() }),
        ...(newStatus === 'PENDING_AUTHORIZATION' && { authPendingAt: new Date() }),
        ...(newStatus === 'COMPLETED' && { completedAt: new Date() }),
      },
    });

    await tx.timelineEvent.create({
      data: {
        caseId,
        eventType,
        status: newStatus,
        description,
        note,
        createdById: userId,
      },
    });

    return updatedCase;
  });
}

export async function assignCase(
  caseId: string,
  userId: string,
  assigneeId: string
) {
  return prisma.$transaction(async (tx) => {
    const updatedCase = await tx.businessCase.update({
      where: { id: caseId },
      data: { assigneeId },
    });

    const assignee = await tx.user.findUnique({ where: { id: assigneeId } });

    await tx.timelineEvent.create({
      data: {
        caseId,
        eventType: 'ASSIGN',
        status: updatedCase.status,
        description: `分配给 ${assignee?.name || '未知用户'}`,
        createdById: userId,
      },
    });

    return updatedCase;
  });
}
