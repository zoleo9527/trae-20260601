import { NextResponse } from 'next/server';
import { getAppealById, updateAppeal, addAuditLog, generateId } from '@/server/data';
import { AppealStatus, AuditLog, ERROR_CODES, STATUS_TRANSITIONS, ROLE_ALLOWED_STATUS, STATUS_ASSIGNEE_MAP, UserRole } from '@/types';
import { getErrorResponse } from '@/utils/errors';

interface HandleAppealRequest {
  action: 'forward' | 'reject' | 'return' | 'resolve';
  comment?: string;
  resolutionAmount?: number;
  actorId: string;
  actorName: string;
  actorRole: string;
}

const isValidUserRole = (role: string): role is UserRole => {
  return ['receiver', 'inspector', 'finance', 'admin'].includes(role);
};

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(getErrorResponse('APPEAL_NOT_FOUND', '缺少申诉ID'), { status: 400 });
    }

    const body: HandleAppealRequest = await request.json();

    const appeal = getAppealById(id);
    if (!appeal) {
      return NextResponse.json(getErrorResponse('APPEAL_NOT_FOUND'), { status: 404 });
    }

    if (!isValidUserRole(body.actorRole)) {
      return NextResponse.json(getErrorResponse('ROLE_PERMISSION_DENIED', '无效的角色'), { status: 400 });
    }

    if (!ROLE_ALLOWED_STATUS[body.actorRole].includes(appeal.status)) {
      return NextResponse.json(getErrorResponse('ROLE_PERMISSION_DENIED'), { status: 403 });
    }

    let newStatus: AppealStatus = appeal.status;
    const previousStatus = appeal.status;

    switch (body.action) {
      case 'forward': {
        const transitions = STATUS_TRANSITIONS[appeal.status];
        const forwardTarget = transitions.find(t => t !== 'rejected' && t !== 'returned');
        if (!forwardTarget) {
          return NextResponse.json(getErrorResponse('INVALID_STATUS_TRANSITION', '无法转交到下一环节'), { status: 400 });
        }
        newStatus = forwardTarget;
        break;
      }

      case 'reject':
        if (!STATUS_TRANSITIONS[appeal.status].includes('rejected')) {
          return NextResponse.json(getErrorResponse('INVALID_STATUS_TRANSITION', '当前状态不允许驳回'), { status: 400 });
        }
        newStatus = 'rejected';
        break;

      case 'return':
        if (!STATUS_TRANSITIONS[appeal.status].includes('returned')) {
          return NextResponse.json(getErrorResponse('INVALID_STATUS_TRANSITION', '当前状态不允许退回'), { status: 400 });
        }
        newStatus = 'returned';
        break;

      case 'resolve':
        if (!STATUS_TRANSITIONS[appeal.status].includes('resolved')) {
          return NextResponse.json(getErrorResponse('INVALID_STATUS_TRANSITION', '当前状态不允许直接解决'), { status: 400 });
        }
        newStatus = 'resolved';
        break;

      default:
        return NextResponse.json(getErrorResponse('INVALID_STATUS_TRANSITION', '无效的操作类型'), { status: 400 });
    }

    const actionLabels: Record<string, string> = {
      forward: '转交下一环节',
      reject: '驳回申诉',
      return: '退回补充',
      resolve: '确认解决',
    };

    const auditLog: AuditLog = {
      id: generateId(),
      appealId: appeal.id,
      action: body.action,
      actorId: body.actorId,
      actorName: body.actorName,
      actorRole: body.actorRole,
      timestamp: new Date().toISOString(),
      details: {
        actionLabel: actionLabels[body.action],
        comment: body.comment,
        resolutionAmount: body.resolutionAmount,
      },
      previousStatus,
      newStatus,
    };

    const updatedAppeal = {
      ...appeal,
      status: newStatus,
      updatedAt: new Date().toISOString(),
      assignedTo: STATUS_ASSIGNEE_MAP[newStatus],
      auditLogIds: [...appeal.auditLogIds, auditLog.id],
      rejectionReason: body.action === 'reject' ? body.comment : appeal.rejectionReason,
      returnReason: body.action === 'return' ? body.comment : appeal.returnReason,
      resolutionAmount: body.action === 'resolve' && body.resolutionAmount ? body.resolutionAmount : appeal.resolutionAmount,
    };

    const success = updateAppeal(updatedAppeal);
    if (!success) {
      return NextResponse.json(getErrorResponse('INTERNAL_ERROR', '更新申诉失败'), { status: 500 });
    }

    addAuditLog(auditLog);

    return NextResponse.json({
      success: true,
      data: {
        appeal: updatedAppeal,
        auditLog,
        meta: {
          previousStatus,
          newStatus,
          previousAssignee: appeal.assignedTo,
          newAssignee: updatedAppeal.assignedTo,
        },
      },
    });

  } catch (error) {
    console.error('Handle appeal error:', error);
    return NextResponse.json(getErrorResponse('INTERNAL_ERROR'), { status: 500 });
  }
}