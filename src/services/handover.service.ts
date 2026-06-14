import { db } from '../database';
import { Application, ApplicationStatus, UserRole } from '../types';
import { OperationLogService } from './operationLog.service';

export interface HandoverTodoItem {
  applicationId: string;
  applicationNo: string;
  applicantName: string;
  notaryType: string;
  status: ApplicationStatus;
  stuckStep: string;
  lastOperatorName: string;
  lastOperatorRole: UserRole;
  lastOperationTime: Date;
  supplementReason?: string;
  supplementDeadline?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface HandoverTodoGroup {
  count: number;
  items: HandoverTodoItem[];
}

export interface HandoverTodoOverview {
  WINDOW_STAFF: HandoverTodoGroup;
  NOTARY: HandoverTodoGroup;
  ARCHIVIST: HandoverTodoGroup;
  totalCount: number;
}

const STATUS_TO_ROLE: Record<ApplicationStatus, UserRole | null> = {
  PENDING_MATERIALS: 'WINDOW_STAFF',
  MATERIALS_SUBMITTED: 'NOTARY',
  PENDING_PAYMENT: 'WINDOW_STAFF',
  PAYMENT_REGISTERED: 'NOTARY',
  PENDING_CERTIFICATE_ARRANGEMENT: 'ARCHIVIST',
  CERTIFICATE_ARRANGED: 'ARCHIVIST',
  SUPPLEMENT_NEEDED: 'WINDOW_STAFF',
  COMPLETED: null,
  REJECTED: null,
};

const STATUS_STUCK_STEP: Record<ApplicationStatus, string> = {
  PENDING_MATERIALS: '待提交材料',
  MATERIALS_SUBMITTED: '待审核材料',
  PENDING_PAYMENT: '待缴费登记',
  PAYMENT_REGISTERED: '待缴费确认',
  PENDING_CERTIFICATE_ARRANGEMENT: '待出证安排',
  CERTIFICATE_ARRANGED: '待发证',
  SUPPLEMENT_NEEDED: '待补正材料',
  COMPLETED: '已完成',
  REJECTED: '已驳回',
};

export class HandoverService {
  static getTodoOverview(): HandoverTodoOverview {
    const allApps = db.getApplications();
    const users = db.getUsers();

    const findUserName = (id: string): string => {
      const user = users.find(u => u.id === id);
      return user ? user.name : '未知用户';
    };

    const groups: Record<UserRole, HandoverTodoItem[]> = {
      WINDOW_STAFF: [],
      NOTARY: [],
      ARCHIVIST: [],
    };

    for (const app of allApps) {
      const nextRole = STATUS_TO_ROLE[app.status];
      if (!nextRole) continue;

      const logs = OperationLogService.getApplicationLogs(app.id);
      const lastLog = logs.length > 0 ? logs[0] : null;

      let supplementReason: string | undefined;
      let supplementDeadline: Date | undefined;

      if (app.supplementNotices && app.supplementNotices.length > 0) {
        const sorted = [...app.supplementNotices].sort(
          (a, b) => b.issuedAt.getTime() - a.issuedAt.getTime()
        );
        const latest = sorted[0];
        supplementReason = latest.reason;
        supplementDeadline = latest.deadline;
      }

      const item: HandoverTodoItem = {
        applicationId: app.id,
        applicationNo: app.applicationNo,
        applicantName: app.applicantName,
        notaryType: app.notaryType,
        status: app.status,
        stuckStep: STATUS_STUCK_STEP[app.status],
        lastOperatorName: lastLog ? lastLog.operatorName : '系统',
        lastOperatorRole: lastLog ? lastLog.operatorRole : 'WINDOW_STAFF',
        lastOperationTime: lastLog ? lastLog.timestamp : app.createdAt,
        supplementReason,
        supplementDeadline,
        createdAt: app.createdAt,
        updatedAt: app.updatedAt,
      };

      groups[nextRole].push(item);
    }

    const sortItems = (items: HandoverTodoItem[]): HandoverTodoItem[] => {
      return items.sort(
        (a, b) => a.updatedAt.getTime() - b.updatedAt.getTime()
      );
    };

    return {
      WINDOW_STAFF: {
        count: groups.WINDOW_STAFF.length,
        items: sortItems(groups.WINDOW_STAFF),
      },
      NOTARY: {
        count: groups.NOTARY.length,
        items: sortItems(groups.NOTARY),
      },
      ARCHIVIST: {
        count: groups.ARCHIVIST.length,
        items: sortItems(groups.ARCHIVIST),
      },
      totalCount:
        groups.WINDOW_STAFF.length +
        groups.NOTARY.length +
        groups.ARCHIVIST.length,
    };
  }

  static getTodoByRole(role: UserRole): HandoverTodoGroup {
    const overview = this.getTodoOverview();
    return overview[role];
  }
}
