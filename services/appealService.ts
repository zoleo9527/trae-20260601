import { 
  Appeal, 
  AppealStatus, 
  UserRole, 
  AuditLog, 
  Evidence, 
  AppealSummary,
  ERROR_CODES,
  STATUS_TRANSITIONS,
  ROLE_ALLOWED_STATUS
} from '../types';
import {
  getAppeals as getAppealsFromData,
  getAppealById as getAppealByIdFromData,
  getEvidencesByAppealId as getEvidencesFromData,
  getAuditLogsByAppealId as getLogsFromData,
  getUserById as getUserFromData,
  getSummary as getSummaryFromData,
  updateAppeal as updateAppealInData,
  addAuditLog as addLogInData,
  addEvidence as addEvidenceInData,
  generateId as generateIdFromData
} from '../server/data';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface HandleAppealRequest {
  appealId: string;
  action: 'forward' | 'reject' | 'return' | 'resolve';
  comment?: string;
  resolutionAmount?: number;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
}

export interface UploadEvidenceRequest {
  appealId: string;
  type: string;
  title: string;
  url: string;
  uploadedBy: string;
  description?: string;
}

class AppealService {
  private getNextAssignee(currentStatus: AppealStatus, newStatus: AppealStatus): string | undefined {
    const assigneeMap: Record<AppealStatus, string | undefined> = {
      pending_receipt: 'u1',
      pending_inspection: 'u2',
      pending_finance: 'u3',
      pending_confirmation: 'u3',
      resolved: undefined,
      rejected: undefined,
      returned: undefined,
    };
    return assigneeMap[newStatus];
  }

  async getAppeals(): Promise<ApiResponse<Appeal[]>> {
    try {
      const appeals = getAppealsFromData();
      return { success: true, data: appeals };
    } catch (error) {
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '获取申诉列表失败' },
      };
    }
  }

  async getAppealById(id: string): Promise<ApiResponse<Appeal>> {
    try {
      const appeal = getAppealByIdFromData(id);
      if (!appeal) {
        return {
          success: false,
          error: { code: ERROR_CODES.APPEAL_NOT_FOUND, message: '申诉不存在' },
        };
      }
      return { success: true, data: appeal };
    } catch (error) {
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '获取申诉详情失败' },
      };
    }
  }

  async getEvidencesByAppealId(appealId: string): Promise<ApiResponse<Evidence[]>> {
    try {
      const evidences = getEvidencesFromData(appealId);
      return { success: true, data: evidences };
    } catch (error) {
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '获取证据列表失败' },
      };
    }
  }

  async getAuditLogsByAppealId(appealId: string): Promise<ApiResponse<AuditLog[]>> {
    try {
      const logs = getLogsFromData(appealId);
      return { success: true, data: logs };
    } catch (error) {
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '获取审计日志失败' },
      };
    }
  }

  async getSummary(): Promise<ApiResponse<AppealSummary>> {
    try {
      const summary = getSummaryFromData();
      return { success: true, data: summary };
    } catch (error) {
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '获取统计信息失败' },
      };
    }
  }

  async handleAppeal(request: HandleAppealRequest): Promise<ApiResponse<{ appeal: Appeal; auditLog: AuditLog }>> {
    try {
      const appeal = getAppealByIdFromData(request.appealId);
      if (!appeal) {
        return {
          success: false,
          error: { code: ERROR_CODES.APPEAL_NOT_FOUND, message: '申诉不存在' },
        };
      }

      if (!ROLE_ALLOWED_STATUS[request.actorRole].includes(appeal.status)) {
        return {
          success: false,
          error: { code: ERROR_CODES.ROLE_PERMISSION_DENIED, message: '当前角色无权处理此状态的申诉' },
        };
      }

      let newStatus: AppealStatus = appeal.status;
      const previousStatus = appeal.status;

      switch (request.action) {
        case 'forward':
          const transitions = STATUS_TRANSITIONS[appeal.status];
          const forwardTarget = transitions.find(t => t !== 'rejected' && t !== 'returned');
          if (!forwardTarget) {
            return {
              success: false,
              error: { code: ERROR_CODES.INVALID_STATUS_TRANSITION, message: '无法转交到下一环节' },
            };
          }
          newStatus = forwardTarget;
          break;

        case 'reject':
          if (!STATUS_TRANSITIONS[appeal.status].includes('rejected')) {
            return {
              success: false,
              error: { code: ERROR_CODES.INVALID_STATUS_TRANSITION, message: '当前状态不允许驳回' },
            };
          }
          newStatus = 'rejected';
          break;

        case 'return':
          if (!STATUS_TRANSITIONS[appeal.status].includes('returned')) {
            return {
              success: false,
              error: { code: ERROR_CODES.INVALID_STATUS_TRANSITION, message: '当前状态不允许退回' },
            };
          }
          newStatus = 'returned';
          break;

        case 'resolve':
          if (!STATUS_TRANSITIONS[appeal.status].includes('resolved')) {
            return {
              success: false,
              error: { code: ERROR_CODES.INVALID_STATUS_TRANSITION, message: '当前状态不允许直接解决' },
            };
          }
          newStatus = 'resolved';
          break;
      }

      const auditLogId = generateIdFromData();
      const actionLabels: Record<string, string> = {
        forward: '转交下一环节',
        reject: '驳回申诉',
        return: '退回补充',
        resolve: '确认解决',
      };

      const auditLog: AuditLog = {
        id: auditLogId,
        appealId: appeal.id,
        action: request.action,
        actorId: request.actorId,
        actorName: request.actorName,
        actorRole: request.actorRole,
        timestamp: new Date().toISOString(),
        details: {
          actionLabel: actionLabels[request.action],
          comment: request.comment,
          resolutionAmount: request.resolutionAmount,
        },
        previousStatus,
        newStatus,
      };

      const updatedAppeal: Appeal = {
        ...appeal,
        status: newStatus,
        updatedAt: new Date().toISOString(),
        assignedTo: this.getNextAssignee(previousStatus, newStatus),
        auditLogIds: [...appeal.auditLogIds, auditLogId],
        rejectionReason: request.action === 'reject' ? request.comment : appeal.rejectionReason,
        returnReason: request.action === 'return' ? request.comment : appeal.returnReason,
        resolutionAmount: request.action === 'resolve' ? request.resolutionAmount : appeal.resolutionAmount,
      };

      updateAppealInData(updatedAppeal);
      addLogInData(auditLog);

      return { success: true, data: { appeal: updatedAppeal, auditLog } };
    } catch (error) {
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '处理申诉失败' },
      };
    }
  }

  async uploadEvidence(request: UploadEvidenceRequest): Promise<ApiResponse<{ evidence: Evidence; auditLog: AuditLog }>> {
    try {
      const appeal = getAppealByIdFromData(request.appealId);
      if (!appeal) {
        return {
          success: false,
          error: { code: ERROR_CODES.APPEAL_NOT_FOUND, message: '申诉不存在' },
        };
      }

      const user = getUserFromData(request.uploadedBy);

      const evidence: Evidence = {
        id: generateIdFromData(),
        appealId: request.appealId,
        type: request.type as any,
        title: request.title,
        url: request.url,
        uploadedAt: new Date().toISOString(),
        uploadedBy: request.uploadedBy,
        description: request.description,
      };

      const auditLog: AuditLog = {
        id: generateIdFromData(),
        appealId: request.appealId,
        action: 'evidence_upload',
        actorId: request.uploadedBy,
        actorName: user?.name || '未知用户',
        actorRole: user?.role || 'admin',
        timestamp: new Date().toISOString(),
        details: {
          evidenceId: evidence.id,
          evidenceType: request.type,
          evidenceTitle: request.title,
        },
      };

      addEvidenceInData(evidence);
      addLogInData(auditLog);

      const updatedAppeal: Appeal = {
        ...appeal,
        evidenceIds: [...appeal.evidenceIds, evidence.id],
        auditLogIds: [...appeal.auditLogIds, auditLog.id],
        updatedAt: new Date().toISOString(),
      };
      updateAppealInData(updatedAppeal);

      return { success: true, data: { evidence, auditLog } };
    } catch (error) {
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: '上传证据失败' },
      };
    }
  }

  getUserById(userId: string) {
    return getUserFromData(userId);
  }

  getUsersByRole(role: UserRole) {
    return getUserFromData(role);
  }
}

export const appealService = new AppealService();