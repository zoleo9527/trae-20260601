import { NextApiRequest, NextApiResponse } from 'next';
import { getAppealById, updateAppeal, addAuditLog, generateId } from '@/server/data';
import { AppealStatus, AuditLog, ERROR_CODES, STATUS_TRANSITIONS, ROLE_ALLOWED_STATUS, STATUS_ASSIGNEE_MAP, UserRole } from '@/types';

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

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const body: HandleAppealRequest = req.body;

  if (req.method !== 'POST') {
    res.status(405).json({ 
      success: false, 
      error: { 
        code: ERROR_CODES.METHOD_NOT_ALLOWED, 
        message: 'Method not allowed' 
      } 
    });
    return;
  }

  try {
    if (!id) {
      res.status(400).json({ 
        success: false, 
        error: { 
          code: ERROR_CODES.APPEAL_NOT_FOUND, 
          message: '缺少申诉ID' 
        } 
      });
      return;
    }

    const appeal = getAppealById(id as string);
    if (!appeal) {
      res.status(404).json({ 
        success: false, 
        error: { 
          code: ERROR_CODES.APPEAL_NOT_FOUND, 
          message: '申诉不存在' 
        } 
      });
      return;
    }

    if (!isValidUserRole(body.actorRole)) {
      res.status(400).json({ 
        success: false, 
        error: { 
          code: ERROR_CODES.ROLE_PERMISSION_DENIED, 
          message: '无效的角色' 
        } 
      });
      return;
    }

    if (!ROLE_ALLOWED_STATUS[body.actorRole].includes(appeal.status)) {
      res.status(403).json({ 
        success: false, 
        error: { 
          code: ERROR_CODES.ROLE_PERMISSION_DENIED, 
          message: '当前角色无权处理此状态的申诉' 
        } 
      });
      return;
    }

    let newStatus: AppealStatus = appeal.status;
    const previousStatus = appeal.status;

    switch (body.action) {
      case 'forward': {
        const transitions = STATUS_TRANSITIONS[appeal.status];
        const forwardTarget = transitions.find(t => t !== 'rejected' && t !== 'returned');
        if (!forwardTarget) {
          res.status(400).json({ 
            success: false, 
            error: { 
              code: ERROR_CODES.INVALID_STATUS_TRANSITION, 
              message: '无法转交到下一环节' 
            } 
          });
          return;
        }
        newStatus = forwardTarget;
        break;
      }

      case 'reject':
        if (!STATUS_TRANSITIONS[appeal.status].includes('rejected')) {
          res.status(400).json({ 
            success: false, 
            error: { 
              code: ERROR_CODES.INVALID_STATUS_TRANSITION, 
              message: '当前状态不允许驳回' 
            } 
          });
          return;
        }
        newStatus = 'rejected';
        break;

      case 'return':
        if (!STATUS_TRANSITIONS[appeal.status].includes('returned')) {
          res.status(400).json({ 
            success: false, 
            error: { 
              code: ERROR_CODES.INVALID_STATUS_TRANSITION, 
              message: '当前状态不允许退回' 
            } 
          });
          return;
        }
        newStatus = 'returned';
        break;

      case 'resolve':
        if (!STATUS_TRANSITIONS[appeal.status].includes('resolved')) {
          res.status(400).json({ 
            success: false, 
            error: { 
              code: ERROR_CODES.INVALID_STATUS_TRANSITION, 
              message: '当前状态不允许直接解决' 
            } 
          });
          return;
        }
        newStatus = 'resolved';
        break;

      default:
        res.status(400).json({ 
          success: false, 
          error: { 
            code: ERROR_CODES.INVALID_STATUS_TRANSITION, 
            message: '无效的操作类型' 
          } 
        });
        return;
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
      res.status(500).json({ 
        success: false, 
        error: { 
          code: ERROR_CODES.INTERNAL_ERROR, 
          message: '更新申诉失败' 
        } 
      });
      return;
    }

    addAuditLog(auditLog);

    res.status(200).json({ 
      success: true, 
      data: { 
        appeal: updatedAppeal, 
        auditLog,
        meta: {
          previousStatus,
          newStatus,
          previousAssignee: appeal.assignedTo,
          newAssignee: updatedAppeal.assignedTo,
        }
      } 
    });

  } catch (error) {
    console.error('Handle appeal error:', error);
    res.status(500).json({ 
      success: false, 
      error: { 
        code: ERROR_CODES.INTERNAL_ERROR, 
        message: '服务器内部错误' 
      } 
    });
  }
}