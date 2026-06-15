import { FileStatus, OperatorRole, ActionType, Reminder } from '../models/file-lifecycle.model';
import { workflowService } from './file-workflow.service';
import { v4 as uuidv4 } from 'uuid';

export interface BatchOperationResult {
  success: boolean;
  processedCount: number;
  failedCount: number;
  results: Array<{
    fileId: string;
    success: boolean;
    error?: string;
  }>;
  reminders: Array<{
    id: string;
    type: string;
    message: string;
    recipientRole: string;
    recipientId: string;
    recipientName?: string;
    createdAt: Date;
  }>;
  logs: Array<{
    id: string;
    action: string;
    fileId: string;
    operatorId: string;
    operatorName: string;
    operatorRole: string;
    timestamp: Date;
  }>;
}

export class BatchProcessingService {
  processExpiredFiles(): BatchOperationResult {
    const files = workflowService.getAllFiles();
    const expiredFiles = files.filter(f => 
      f.expiresAt && new Date(f.expiresAt) < new Date() &&
      f.currentStatus === FileStatus.PENDING_COLLECTION
    );

    const results: BatchOperationResult['results'] = [];
    const reminders: BatchOperationResult['reminders'] = [];
    const logs: BatchOperationResult['logs'] = [];

    for (const file of expiredFiles) {
      try {
        const now = new Date();
        const targetFile = workflowService.getFileById(file.id);
        if (!targetFile) {
          results.push({ fileId: file.id, success: false, error: '卷宗不存在' });
          continue;
        }

        targetFile.currentStatus = FileStatus.EXPIRED_NOT_COLLECTED;
        targetFile.updatedAt = now;

        const reminder: Reminder = {
          id: uuidv4(),
          fileId: file.id,
          type: 'EXPIRATION_WARNING',
          recipientRole: OperatorRole.ARCHIVE_KEEPER,
          recipientId: file.responsiblePerson?.operatorId || 'USER-A001',
          recipientName: file.responsiblePerson?.operatorName || '李档案',
          message: `卷宗 ${file.appointmentNumber} 领取期限已过，需要档案员跟进联系申请人`,
          createdAt: now,
          triggeredBy: 'SYSTEM',
          triggeredByName: '系统自动',
          acknowledged: false,
          actionRequired: '联系申请人确认领取意向',
          priority: 'URGENT'
        };

        workflowService['reminders'].push(reminder);

        const log = {
          id: uuidv4(),
          fileId: file.id,
          operatorRole: OperatorRole.ARCHIVE_KEEPER,
          operatorId: 'SYSTEM',
          operatorName: '系统自动',
          action: ActionType.EXPIRE_WARNING,
          fromStatus: FileStatus.PENDING_COLLECTION,
          toStatus: FileStatus.EXPIRED_NOT_COLLECTED,
          reason: '领取期限已过，自动标记为过期',
          timestamp: now,
          responsibilityChainSnapshot: [...targetFile.responsibilityChain]
        };

        workflowService['logs'].push(log);

        results.push({ fileId: file.id, success: true });
        reminders.push({
          id: reminder.id,
          type: reminder.type,
          message: reminder.message,
          recipientRole: reminder.recipientRole,
          recipientId: reminder.recipientId,
          recipientName: reminder.recipientName,
          createdAt: reminder.createdAt
        });
        logs.push({
          id: log.id,
          action: ActionType.EXPIRE_WARNING,
          fileId: file.id,
          operatorId: log.operatorId,
          operatorName: log.operatorName,
          operatorRole: log.operatorRole,
          timestamp: log.timestamp
        });
      } catch (error) {
        results.push({ 
          fileId: file.id, 
          success: false, 
          error: error instanceof Error ? error.message : '未知错误' 
        });
      }
    }

    return {
      success: results.every(r => r.success),
      processedCount: results.filter(r => r.success).length,
      failedCount: results.filter(r => !r.success).length,
      results,
      reminders,
      logs
    };
  }

  sendPendingReminders(): BatchOperationResult {
    const files = workflowService.getAllFiles();
    const pendingFiles = files.filter(f => 
      f.currentStatus === FileStatus.PENDING_COLLECTION ||
      f.currentStatus === FileStatus.ARCHIVING
    );

    const results: BatchOperationResult['results'] = [];
    const reminders: BatchOperationResult['reminders'] = [];
    const logs: BatchOperationResult['logs'] = [];

    for (const file of pendingFiles) {
      try {
        const now = new Date();
        const fileAge = now.getTime() - new Date(file.updatedAt).getTime();
        const hoursSinceUpdate = fileAge / (1000 * 60 * 60);

        if (hoursSinceUpdate > 24) {
          const reminder: Reminder = {
            id: uuidv4(),
            fileId: file.id,
            type: 'COLLECTION_DEADLINE',
            recipientRole: file.responsiblePerson?.role || OperatorRole.WINDOW_STAFF,
            recipientId: file.responsiblePerson?.operatorId || 'USER-W001',
            recipientName: file.responsiblePerson?.operatorName || '陈窗口',
            message: `卷宗 ${file.appointmentNumber} 等待处理已超过24小时，请及时跟进`,
            createdAt: now,
            triggeredBy: 'SYSTEM',
            triggeredByName: '系统自动',
            acknowledged: false,
            actionRequired: '及时处理卷宗',
            priority: 'MEDIUM'
          };

          workflowService['reminders'].push(reminder);

          const log = {
            id: uuidv4(),
            fileId: file.id,
            operatorRole: file.responsiblePerson?.role || OperatorRole.WINDOW_STAFF,
            operatorId: 'SYSTEM',
            operatorName: '系统自动',
            action: ActionType.EXPIRE_WARNING,
            fromStatus: file.currentStatus,
            toStatus: file.currentStatus,
            reason: '处理超时提醒',
            timestamp: now,
            responsibilityChainSnapshot: [...file.responsibilityChain]
          };

          workflowService['logs'].push(log);

          results.push({ fileId: file.id, success: true });
          reminders.push({
            id: reminder.id,
            type: reminder.type,
            message: reminder.message,
            recipientRole: reminder.recipientRole,
            recipientId: reminder.recipientId,
            recipientName: reminder.recipientName,
            createdAt: reminder.createdAt
          });
          logs.push({
            id: log.id,
            action: ActionType.EXPIRE_WARNING,
            fileId: file.id,
            operatorId: log.operatorId,
            operatorName: log.operatorName,
            operatorRole: log.operatorRole,
            timestamp: log.timestamp
          });
        } else {
          results.push({ fileId: file.id, success: true });
        }
      } catch (error) {
        results.push({ 
          fileId: file.id, 
          success: false, 
          error: error instanceof Error ? error.message : '未知错误' 
        });
      }
    }

    return {
      success: results.every(r => r.success),
      processedCount: results.length,
      failedCount: results.filter(r => !r.success).length,
      results,
      reminders,
      logs
    };
  }

  transferResponsibility(
    fromRole: OperatorRole,
    toRole: OperatorRole,
    reason: string
  ): BatchOperationResult {
    const files = workflowService.getAllFiles();
    const targetFiles = files.filter(f => 
      f.responsiblePerson?.role === fromRole &&
      (f.currentStatus === FileStatus.PENDING_COLLECTION || 
       f.currentStatus === FileStatus.ARCHIVING)
    );

    const results: BatchOperationResult['results'] = [];
    const reminders: BatchOperationResult['reminders'] = [];
    const logs: BatchOperationResult['logs'] = [];

    const defaultOperators: Record<OperatorRole, { operatorId: string; operatorName: string }> = {
      [OperatorRole.WINDOW_STAFF]: { operatorId: 'USER-W001', operatorName: '陈窗口' },
      [OperatorRole.NOTARY]: { operatorId: 'USER-N001', operatorName: '刘公证员' },
      [OperatorRole.ARCHIVE_KEEPER]: { operatorId: 'USER-A001', operatorName: '李档案' }
    };

    for (const file of targetFiles) {
      try {
        const now = new Date();
        const targetFile = workflowService.getFileById(file.id);
        if (!targetFile) {
          results.push({ fileId: file.id, success: false, error: '卷宗不存在' });
          continue;
        }

        const previousResponsible = { ...targetFile.responsiblePerson! };
        const targetOperator = defaultOperators[toRole];

        targetFile.responsiblePerson = {
          role: toRole,
          operatorId: targetOperator.operatorId,
          operatorName: targetOperator.operatorName,
          assignedAt: now,
          handoverReason: reason,
          handoverFrom: previousResponsible.operatorName
        };

        targetFile.responsibilityChain.push({
          role: toRole,
          operatorId: targetOperator.operatorId,
          operatorName: targetOperator.operatorName,
          assignedAt: now,
          handoverReason: reason,
          handoverFrom: previousResponsible.operatorName
        });

        targetFile.updatedAt = now;

        const reminder: Reminder = {
          id: uuidv4(),
          fileId: file.id,
          type: 'RESPONSIBILITY_TRANSFER',
          recipientRole: toRole,
          recipientId: targetOperator.operatorId,
          recipientName: targetOperator.operatorName,
          message: `卷宗 ${file.appointmentNumber} 责任已从 ${previousResponsible.operatorName} 转移至 ${targetOperator.operatorName}，请查收`,
          createdAt: now,
          triggeredBy: 'SYSTEM',
          triggeredByName: '系统自动',
          acknowledged: false,
          actionRequired: '确认接收卷宗',
          priority: 'LOW'
        };

        workflowService['reminders'].push(reminder);

        const log = {
          id: uuidv4(),
          fileId: file.id,
          operatorRole: previousResponsible.role,
          operatorId: 'SYSTEM',
          operatorName: '系统自动',
          action: ActionType.TAKE_OVER,
          fromStatus: file.currentStatus,
          toStatus: file.currentStatus,
          reason: `批量责任转移: ${reason}`,
          timestamp: now,
          responsibilityChainSnapshot: [...targetFile.responsibilityChain]
        };

        workflowService['logs'].push(log);

        results.push({ fileId: file.id, success: true });
        reminders.push({
          id: reminder.id,
          type: reminder.type,
          message: reminder.message,
          recipientRole: reminder.recipientRole,
          recipientId: reminder.recipientId,
          recipientName: reminder.recipientName,
          createdAt: reminder.createdAt
        });
        logs.push({
          id: log.id,
          action: ActionType.TAKE_OVER,
          fileId: file.id,
          operatorId: log.operatorId,
          operatorName: log.operatorName,
          operatorRole: log.operatorRole,
          timestamp: log.timestamp
        });
      } catch (error) {
        results.push({ 
          fileId: file.id, 
          success: false, 
          error: error instanceof Error ? error.message : '未知错误' 
        });
      }
    }

    return {
      success: results.filter(r => r.success).length > 0,
      processedCount: results.filter(r => r.success).length,
      failedCount: results.filter(r => !r.success).length,
      results,
      reminders,
      logs
    };
  }

  batchCompleteArchive(
    fileIds: string[],
    archiveLocation: string,
    archiveReason: string,
    operatorId: string,
    operatorName: string,
    operatorRole: OperatorRole
  ): BatchOperationResult {
    const results: BatchOperationResult['results'] = [];
    const reminders: BatchOperationResult['reminders'] = [];
    const logs: BatchOperationResult['logs'] = [];

    for (const fileId of fileIds) {
      const file = workflowService.getFileById(fileId);
      if (!file) {
        results.push({ fileId, success: false, error: '卷宗不存在' });
        continue;
      }

      try {
        workflowService.completeArchive(
          file,
          archiveLocation,
          archiveReason,
          `${archiveReason} (批量处理)`,
          operatorId,
          operatorName,
          operatorRole
        );

        const archiveResult = workflowService.autoTransferToCollection(
          fileId,
          operatorId,
          operatorName,
          operatorRole,
          OperatorRole.ARCHIVE_KEEPER
        );

        if (archiveResult) {
          const log = {
            id: uuidv4(),
            fileId,
            operatorRole,
            operatorId,
            operatorName,
            action: ActionType.COMPLETE_ARCHIVE,
            fromStatus: file.currentStatus,
            toStatus: FileStatus.PENDING_COLLECTION,
            reason: `${archiveReason} (批量处理，自动转移)`,
            timestamp: new Date(),
            responsibilityChainSnapshot: [...file.responsibilityChain]
          };

          workflowService['logs'].push(log);

          results.push({ fileId, success: true });
          logs.push({
            id: log.id,
            action: ActionType.COMPLETE_ARCHIVE,
            fileId,
            operatorId,
            operatorName,
            operatorRole,
            timestamp: log.timestamp
          });
        } else {
          results.push({ fileId, success: false, error: '自动转移失败' });
        }
      } catch (error) {
        results.push({ 
          fileId, 
          success: false, 
          error: error instanceof Error ? error.message : '未知错误' 
        });
      }
    }

    return {
      success: results.every(r => r.success),
      processedCount: results.filter(r => r.success).length,
      failedCount: results.filter(r => !r.success).length,
      results,
      reminders,
      logs
    };
  }
}

export const batchService = new BatchProcessingService();
