import { db } from '../database';
import { User, Application, OperationLog, ApplicationStatus } from '../types';

export interface LogOperationParams {
  applicationId: string;
  operator: User;
  operation: string;
  previousStatus?: ApplicationStatus;
  newStatus?: ApplicationStatus;
  remark?: string;
}

export class OperationLogService {
  static logOperation(params: LogOperationParams): OperationLog {
    const { applicationId, operator, operation, previousStatus, newStatus, remark } = params;

    return db.addOperationLog({
      applicationId,
      operatorId: operator.id,
      operatorName: operator.name,
      operatorRole: operator.role,
      operation,
      previousStatus,
      newStatus,
      remark,
    });
  }

  static getApplicationLogs(applicationId: string): OperationLog[] {
    return db.getLogsByApplicationId(applicationId);
  }

  static formatStatusChange(prev?: ApplicationStatus, next?: ApplicationStatus): string {
    const statusMap: Record<ApplicationStatus, string> = {
      PENDING_MATERIALS: '待提交材料',
      MATERIALS_SUBMITTED: '材料已提交',
      PENDING_PAYMENT: '待缴费',
      PAYMENT_REGISTERED: '缴费已登记',
      PENDING_CERTIFICATE_ARRANGEMENT: '待出证安排',
      CERTIFICATE_ARRANGED: '出证已安排',
      COMPLETED: '已完成',
      REJECTED: '已驳回',
      SUPPLEMENT_NEEDED: '需补正材料',
    };

    const prevLabel = prev ? statusMap[prev] : '无';
    const nextLabel = next ? statusMap[next] : '无';
    return `${prevLabel} → ${nextLabel}`;
  }
}
