import { BaseService } from './BaseService';
import { STORAGE_KEYS } from '../utils/storage';
import type { OperationLog, LogFilter, TimelineItem } from '../types/log.types';
import { OperationType } from '../types/log.types';
import { mockLogs } from '../data/mockLogs';
import { getStorageData, setStorageData } from '../utils/storage';

export class LogService extends BaseService<OperationLog> {
  constructor() {
    super(STORAGE_KEYS.OPERATION_LOGS);
    this.initializeData();
  }

  private initializeData(): void {
    const existingData = getStorageData<OperationLog[]>(this.storageKey);
    if (!existingData) {
      setStorageData(this.storageKey, mockLogs);
    }
  }

  createLog(log: Omit<OperationLog, 'logId' | 'createdTime'>): OperationLog {
    const newLog: OperationLog = {
      ...log,
      logId: this.generateId(),
      createdTime: this.getCurrentTime()
    };

    const logs = this.getAll();
    logs.unshift(newLog);
    this.saveAll(logs);

    return newLog;
  }

  getLogs(filters?: LogFilter): { list: OperationLog[]; total: number; page: number; pageSize: number } {
    let logs = this.getAll();

    if (filters) {
      if (filters.taskId) {
        logs = logs.filter(log => log.taskId === filters.taskId);
      }
      if (filters.assessmentId) {
        logs = logs.filter(log => log.assessmentId === filters.assessmentId);
      }
      if (filters.operatorId) {
        logs = logs.filter(log => log.operatorId === filters.operatorId);
      }
      if (filters.operationType) {
        logs = logs.filter(log => log.operationType === filters.operationType);
      }
      if (filters.startDate) {
        logs = logs.filter(log => log.createdTime >= filters.startDate!);
      }
      if (filters.endDate) {
        logs = logs.filter(log => log.createdTime <= filters.endDate!);
      }

      logs.sort((a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime());

      const page = filters.page || 1;
      const pageSize = filters.pageSize || 20;
      const start = (page - 1) * pageSize;
      const end = start + pageSize;

      return {
        list: logs.slice(start, end),
        total: logs.length,
        page,
        pageSize
      };
    }

    logs.sort((a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime());
    return {
      list: logs,
      total: logs.length,
      page: 1,
      pageSize: logs.length
    };
  }

  getTaskLogs(taskId: string): OperationLog[] {
    const logs = this.getAll();
    return logs
      .filter(log => log.taskId === taskId)
      .sort((a, b) => new Date(a.createdTime).getTime() - new Date(b.createdTime).getTime());
  }

  getAssessmentLogs(assessmentId: string): OperationLog[] {
    const logs = this.getAll();
    return logs
      .filter(log => log.assessmentId === assessmentId)
      .sort((a, b) => new Date(a.createdTime).getTime() - new Date(b.createdTime).getTime());
  }

  buildTimeline(logs: OperationLog[]): TimelineItem[] {
    const iconMap: Record<OperationType, string> = {
      [OperationType.CREATE_TASK]: 'FilePlus',
      [OperationType.ASSIGN_TASK]: 'UserCheck',
      [OperationType.ACCEPT_TASK]: 'CheckCircle',
      [OperationType.START_SURVEY]: 'MapPin',
      [OperationType.COMPLETE_SURVEY]: 'Flag',
      [OperationType.CANCEL_TASK]: 'XCircle',
      [OperationType.UPDATE_TASK_STATUS]: 'RefreshCw',
      [OperationType.CREATE_ASSESSMENT]: 'ClipboardList',
      [OperationType.UPDATE_ASSESSMENT]: 'Edit',
      [OperationType.SUBMIT_ASSESSMENT]: 'Send',
      [OperationType.REVIEW_ASSESSMENT]: 'Eye',
      [OperationType.APPROVE_ASSESSMENT]: 'Check',
      [OperationType.REJECT_ASSESSMENT]: 'X'
    };

    const colorMap: Record<OperationType, string> = {
      [OperationType.CREATE_TASK]: 'text-blue-600',
      [OperationType.ASSIGN_TASK]: 'text-purple-600',
      [OperationType.ACCEPT_TASK]: 'text-green-600',
      [OperationType.START_SURVEY]: 'text-orange-600',
      [OperationType.COMPLETE_SURVEY]: 'text-teal-600',
      [OperationType.CANCEL_TASK]: 'text-red-600',
      [OperationType.UPDATE_TASK_STATUS]: 'text-gray-600',
      [OperationType.CREATE_ASSESSMENT]: 'text-indigo-600',
      [OperationType.UPDATE_ASSESSMENT]: 'text-yellow-600',
      [OperationType.SUBMIT_ASSESSMENT]: 'text-cyan-600',
      [OperationType.REVIEW_ASSESSMENT]: 'text-pink-600',
      [OperationType.APPROVE_ASSESSMENT]: 'text-emerald-600',
      [OperationType.REJECT_ASSESSMENT]: 'text-red-600'
    };

    return logs.map((log, index) => ({
      id: log.logId,
      timestamp: log.createdTime,
      title: log.operationDesc,
      description: log.remark || '-',
      operator: log.operatorName,
      role: log.operatorRole,
      icon: iconMap[log.operationType] || 'Activity',
      color: colorMap[log.operationType] || 'text-gray-600'
    }));
  }
}
