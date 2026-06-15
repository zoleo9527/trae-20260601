import { FileRecord, FileStatus } from '../models/file-lifecycle.model';

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
    type: string;
    message: string;
    recipientRole: string;
  }>;
}

export class BatchProcessingService {
  processExpiredFiles(files: FileRecord[]): BatchOperationResult {
    const expiredFiles = files.filter(f => 
      f.expiresAt && new Date(f.expiresAt) < new Date() &&
      f.currentStatus === FileStatus.PENDING_COLLECTION
    );

    const results = expiredFiles.map(file => {
      try {
        file.currentStatus = FileStatus.EXPIRED_NOT_COLLECTED;
        file.updatedAt = new Date();
        return { fileId: file.id, success: true };
      } catch (error) {
        return { 
          fileId: file.id, 
          success: false, 
          error: error instanceof Error ? error.message : '未知错误' 
        };
      }
    });

    return {
      success: results.every(r => r.success),
      processedCount: results.filter(r => r.success).length,
      failedCount: results.filter(r => !r.success).length,
      results,
      reminders: expiredFiles.map(f => ({
        type: 'COLLECTION_DEADLINE',
        message: `卷宗 ${f.appointmentNumber} 领取期限已过，需要档案员跟进`,
        recipientRole: f.responsiblePerson?.role || 'ARCHIVE_KEEPER'
      }))
    };
  }

  sendPendingReminders(files: FileRecord[]): BatchOperationResult {
    const pendingFiles = files.filter(f => 
      f.currentStatus === FileStatus.PENDING_COLLECTION ||
      f.currentStatus === FileStatus.ARCHIVING
    );

    const results = pendingFiles.map(file => {
      try {
        const now = new Date();
        const fileAge = now.getTime() - file.updatedAt.getTime();
        const hoursSinceUpdate = fileAge / (1000 * 60 * 60);

        if (hoursSinceUpdate > 24) {
          return { 
            fileId: file.id, 
            success: true,
            reminderSent: true 
          };
        }
        return { fileId: file.id, success: true, reminderSent: false };
      } catch (error) {
        return { 
          fileId: file.id, 
          success: false, 
          error: error instanceof Error ? error.message : '未知错误' 
        };
      }
    });

    return {
      success: results.every(r => r.success),
      processedCount: results.length,
      failedCount: 0,
      results,
      reminders: pendingFiles.map(f => ({
        type: 'RESPONSIBILITY_TRANSFER',
        message: `卷宗 ${f.appointmentNumber} 等待处理中，请及时跟进`,
        recipientRole: f.responsiblePerson?.role || 'WINDOW_STAFF'
      }))
    };
  }

  transferResponsibility(
    files: FileRecord[],
    fromRole: string,
    toRole: string,
    reason: string
  ): BatchOperationResult {
    const targetFiles = files.filter(f => 
      f.responsiblePerson?.role === fromRole &&
      (f.currentStatus === FileStatus.PENDING_COLLECTION || 
       f.currentStatus === FileStatus.ARCHIVING)
    );

    const results = targetFiles.map(file => {
      try {
        const previousResponsible = file.responsiblePerson;
        file.responsiblePerson = {
          ...file.responsiblePerson!,
          role: toRole as any,
          assignedAt: new Date()
        };
        file.updatedAt = new Date();
        return { 
          fileId: file.id, 
          success: true,
          previousResponsible 
        };
      } catch (error) {
        return { 
          fileId: file.id, 
          success: false, 
          error: error instanceof Error ? error.message : '未知错误' 
        };
      }
    });

    return {
      success: results.filter(r => r.success).length > 0,
      processedCount: results.filter(r => r.success).length,
      failedCount: results.filter(r => !r.success).length,
      results,
      reminders: [{
        type: 'RESPONSIBILITY_TRANSFER',
        message: `批量责任转移：${reason}`,
        recipientRole: toRole
      }]
    };
  }
}
