import { FileStatus, OperatorRole, FileRecord, OperationLog, Reminder, ActionType, ArchiveContext, HandoverRecord, CollectionContext, ResponsibilityRecord } from '../models/file-lifecycle.model';
import { v4 as uuidv4 } from 'uuid';

export class FileWorkflowService {
  private logs: OperationLog[] = [];
  private reminders: Reminder[] = [];
  private handoverRecords: HandoverRecord[] = [];
  private fileStore: Map<string, FileRecord> = new Map();

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData() {
    const sampleFiles: FileRecord[] = [
      {
        id: 'FILE-2024-001',
        applicationId: 'APP-2024-8892',
        appointmentNumber: 'YY20240615-0892',
        currentStatus: FileStatus.PENDING_COLLECTION,
        responsiblePerson: {
          role: OperatorRole.ARCHIVE_KEEPER,
          operatorId: 'USER-A001',
          operatorName: '李档案',
          assignedAt: new Date('2024-06-15')
        },
        responsibilityChain: [
          {
            role: OperatorRole.WINDOW_STAFF,
            operatorId: 'USER-W002',
            operatorName: '赵窗口',
            assignedAt: new Date('2024-06-15T09:30:00'),
            handoverTo: 'USER-A001'
          },
          {
            role: OperatorRole.ARCHIVE_KEEPER,
            operatorId: 'USER-A001',
            operatorName: '李档案',
            assignedAt: new Date('2024-06-15T11:00:00')
          }
        ],
        archiveInfo: {
          archiveLocation: '档案室A区-第3排-第12格',
          archiveDate: new Date('2024-06-15'),
          archiveNote: '房产继承公证，材料齐全，已核验',
          archiveReason: '审核通过，材料完整，符合归档条件',
          notarialApproval: {
            notaryId: 'USER-N001',
            notaryName: '刘公证员',
            approvalDate: new Date('2024-06-15T10:45:00'),
            approvalNote: '审核通过，签字盖章完毕'
          }
        },
        createdAt: new Date('2024-06-10'),
        updatedAt: new Date('2024-06-15'),
        expiresAt: new Date('2024-07-15'),
        correctionHistory: []
      },
      {
        id: 'FILE-2024-002',
        applicationId: 'APP-2024-8901',
        appointmentNumber: 'YY20240618-0901',
        currentStatus: FileStatus.ARCHIVING,
        responsiblePerson: {
          role: OperatorRole.WINDOW_STAFF,
          operatorId: 'USER-W003',
          operatorName: '王窗口',
          assignedAt: new Date('2024-06-18')
        },
        responsibilityChain: [],
        createdAt: new Date('2024-06-18'),
        updatedAt: new Date('2024-06-18'),
        correctionHistory: []
      },
      {
        id: 'FILE-2024-003',
        applicationId: 'APP-2024-8845',
        appointmentNumber: 'YY20240601-0845',
        currentStatus: FileStatus.EXPIRED_NOT_COLLECTED,
        responsiblePerson: {
          role: OperatorRole.ARCHIVE_KEEPER,
          operatorId: 'USER-A002',
          operatorName: '张档案',
          assignedAt: new Date('2024-06-05')
        },
        responsibilityChain: [
          {
            role: OperatorRole.WINDOW_STAFF,
            operatorId: 'USER-W002',
            operatorName: '赵窗口',
            assignedAt: new Date('2024-06-01T14:00:00')
          },
          {
            role: OperatorRole.ARCHIVE_KEEPER,
            operatorId: 'USER-A002',
            operatorName: '张档案',
            assignedAt: new Date('2024-06-05T16:30:00')
          }
        ],
        archiveInfo: {
          archiveLocation: '档案室B区-第1排-第5格',
          archiveDate: new Date('2024-06-05'),
          archiveNote: '委托公证，申请人表示近期无法领取',
          archiveReason: '委托公证办理完成，申请人表示近期无法领取'
        },
        createdAt: new Date('2024-05-28'),
        updatedAt: new Date('2024-06-05'),
        expiresAt: new Date('2024-07-05'),
        correctionHistory: []
      },
      {
        id: 'FILE-2024-004',
        applicationId: 'APP-2024-8920',
        appointmentNumber: 'YY20240620-0920',
        currentStatus: FileStatus.RETURNED_FOR_CORRECTION,
        responsiblePerson: {
          role: OperatorRole.WINDOW_STAFF,
          operatorId: 'USER-W001',
          operatorName: '陈窗口',
          assignedAt: new Date('2024-06-20')
        },
        responsibilityChain: [],
        createdAt: new Date('2024-06-20'),
        updatedAt: new Date('2024-06-21'),
        correctionHistory: [
          {
            timestamp: new Date('2024-06-21T14:20:00'),
            operatorRole: OperatorRole.NOTARY,
            operatorName: '孙公证员',
            correctionContent: '身份证明材料过期，请重新提供有效期内身份证件'
          },
          {
            timestamp: new Date('2024-06-21T14:25:00'),
            operatorRole: OperatorRole.NOTARY,
            operatorName: '孙公证员',
            correctionContent: '补充：还需提供户口本原件'
          }
        ]
      }
    ];

    sampleFiles.forEach(file => this.fileStore.set(file.id, file));

    this.logs = [
      {
        id: 'LOG-001',
        fileId: 'FILE-2024-001',
        operatorRole: OperatorRole.WINDOW_STAFF,
        operatorId: 'USER-W002',
        operatorName: '赵窗口',
        action: ActionType.START_ARCHIVE,
        toStatus: FileStatus.ARCHIVING,
        timestamp: new Date('2024-06-15T09:30:00'),
        responsibilityChainSnapshot: []
      },
      {
        id: 'LOG-002',
        fileId: 'FILE-2024-001',
        operatorRole: OperatorRole.NOTARY,
        operatorId: 'USER-N001',
        operatorName: '刘公证员',
        action: ActionType.COMPLETE_ARCHIVE,
        fromStatus: FileStatus.ARCHIVING,
        toStatus: FileStatus.ARCHIVED,
        reason: '审核通过，签字盖章完毕',
        timestamp: new Date('2024-06-15T10:45:00'),
        contextSnapshot: {
          archiveInfo: '房产继承公证，材料齐全，已核验'
        }
      },
      {
        id: 'LOG-003',
        fileId: 'FILE-2024-001',
        operatorRole: OperatorRole.WINDOW_STAFF,
        operatorId: 'USER-W002',
        operatorName: '赵窗口',
        action: ActionType.TRANSFER_TO_COLLECTION,
        fromStatus: FileStatus.ARCHIVED,
        toStatus: FileStatus.PENDING_COLLECTION,
        reason: '归档完成，转移至档案室等待领取',
        timestamp: new Date('2024-06-15T11:00:00')
      },
      {
        id: 'LOG-004',
        fileId: 'FILE-2024-004',
        operatorRole: OperatorRole.NOTARY,
        operatorId: 'USER-N002',
        operatorName: '孙公证员',
        action: ActionType.REQUEST_CORRECTION,
        fromStatus: FileStatus.ARCHIVING,
        toStatus: FileStatus.RETURNED_FOR_CORRECTION,
        reason: '身份证明材料过期，请重新提供有效期内身份证件',
        timestamp: new Date('2024-06-21T14:20:00'),
        contextSnapshot: {
          correctionHistory: ['身份证明材料过期', '还需提供户口本原件']
        }
      }
    ];

    this.reminders = [
      {
        id: 'REM-001',
        fileId: 'FILE-2024-001',
        type: 'COLLECTION_DEADLINE',
        recipientRole: OperatorRole.ARCHIVE_KEEPER,
        recipientId: 'USER-A001',
        recipientName: '李档案',
        message: '卷宗 YY20240615-0892 已归档，等待领取人确认。请在30天内完成领取确认',
        createdAt: new Date('2024-06-15'),
        priority: 'MEDIUM',
        acknowledged: false
      },
      {
        id: 'REM-002',
        fileId: 'FILE-2024-002',
        type: 'ARCHIVE_DEADLINE',
        recipientRole: OperatorRole.WINDOW_STAFF,
        recipientId: 'USER-W003',
        recipientName: '王窗口',
        message: '卷宗 YY20240618-0901 开始归档处理已超过2小时，请尽快完成审核',
        createdAt: new Date('2024-06-18T11:30:00'),
        priority: 'HIGH',
        acknowledged: false
      },
      {
        id: 'REM-003',
        fileId: 'FILE-2024-003',
        type: 'EXPIRATION_WARNING',
        recipientRole: OperatorRole.ARCHIVE_KEEPER,
        recipientId: 'USER-A002',
        recipientName: '张档案',
        message: '卷宗 YY20240601-0845 领取期限已过（2024-07-05），仍未领取，需要联系申请人',
        createdAt: new Date('2024-07-06'),
        triggeredBy: 'SYSTEM',
        triggeredByName: '系统自动',
        priority: 'URGENT',
        actionRequired: '请立即联系申请人确认领取意向',
        acknowledged: false
      },
      {
        id: 'REM-004',
        fileId: 'FILE-2024-004',
        type: 'CORRECTION_PENDING',
        recipientRole: OperatorRole.WINDOW_STAFF,
        recipientId: 'USER-W001',
        recipientName: '陈窗口',
        message: '卷宗 YY20240620-0920 需要补正: 身份证明材料过期，请重新提供有效期内身份证件',
        createdAt: new Date('2024-06-21'),
        priority: 'HIGH',
        actionRequired: '联系申请人补充材料',
        acknowledged: false
      },
      {
        id: 'REM-005',
        fileId: 'FILE-2024-001',
        type: 'RESPONSIBILITY_TRANSFER',
        recipientRole: OperatorRole.ARCHIVE_KEEPER,
        recipientId: 'USER-A001',
        recipientName: '李档案',
        message: '责任已从 赵窗口 转移至 李档案，请查收卷宗',
        createdAt: new Date('2024-06-15'),
        triggeredBy: 'USER-W002',
        triggeredByName: '赵窗口',
        priority: 'LOW',
        acknowledged: true,
        acknowledgedAt: new Date('2024-06-15T11:05:00')
      }
    ];

    this.handoverRecords = [
      {
        handoverId: 'HO-001',
        fileId: 'FILE-2024-001',
        fromRole: OperatorRole.WINDOW_STAFF,
        fromOperatorId: 'USER-W002',
        fromOperatorName: '赵窗口',
        toRole: OperatorRole.ARCHIVE_KEEPER,
        toOperatorId: 'USER-A001',
        toOperatorName: '李档案',
        handoverReason: '归档完成，转移至档案室等待领取',
        handoverContext: {
          archiveInfo: '档案室A区-第3排-第12格，房产继承公证，材料齐全',
          previousNotes: ['审核通过，签字盖章完毕']
        },
        timestamp: new Date('2024-06-15T11:00:00'),
        acknowledged: true,
        acknowledgedAt: new Date('2024-06-15T11:05:00')
      }
    ];
  }

  startArchiveProcess(file: FileRecord, operatorId: string, operatorName: string): FileRecord {
    const now = new Date();
    const log: OperationLog = {
      id: uuidv4(),
      fileId: file.id,
      operatorRole: OperatorRole.WINDOW_STAFF,
      operatorId,
      operatorName,
      action: ActionType.START_ARCHIVE,
      toStatus: FileStatus.ARCHIVING,
      timestamp: now,
      responsibilityChainSnapshot: [...file.responsibilityChain]
    };

    file.currentStatus = FileStatus.ARCHIVING;
    file.responsiblePerson = {
      role: OperatorRole.WINDOW_STAFF,
      operatorId,
      operatorName,
      assignedAt: now
    };

    if (!file.responsibilityChain.find(r => r.operatorId === operatorId)) {
      file.responsibilityChain.push({
        role: OperatorRole.WINDOW_STAFF,
        operatorId,
        operatorName,
        assignedAt: now
      });
    }

    file.updatedAt = now;
    this.logs.push(log);

    this.createReminder(
      file.id,
      'ARCHIVE_DEADLINE',
      OperatorRole.WINDOW_STAFF,
      operatorId,
      operatorName,
      `卷宗 ${file.appointmentNumber} 开始归档处理，请注意处理时限`,
      'LOW'
    );

    return file;
  }

  completeArchive(
    file: FileRecord,
    archiveLocation: string,
    archiveReason: string,
    archiveNote: string,
    operatorId: string,
    operatorName: string,
    operatorRole: OperatorRole,
    notarialApproval?: { notaryId: string; notaryName: string; approvalNote?: string }
  ): FileRecord {
    const now = new Date();

    const log: OperationLog = {
      id: uuidv4(),
      fileId: file.id,
      operatorRole,
      operatorId,
      operatorName,
      action: ActionType.COMPLETE_ARCHIVE,
      fromStatus: file.currentStatus,
      toStatus: FileStatus.ARCHIVED,
      reason: archiveNote,
      timestamp: now,
      responsibilityChainSnapshot: [...file.responsibilityChain],
      contextSnapshot: {
        archiveInfo: archiveNote,
        correctionHistory: file.correctionHistory.map(c => c.correctionContent)
      }
    };

    file.currentStatus = FileStatus.ARCHIVED;
    file.archiveInfo = {
      archiveLocation,
      archiveDate: now,
      archiveNote,
      archiveReason,
      completionNote: archiveNote,
      notarialApproval: notarialApproval ? {
        ...notarialApproval,
        approvalDate: now
      } : undefined
    };

    file.responsiblePerson = {
      role: operatorRole,
      operatorId,
      operatorName,
      assignedAt: now
    };

    file.responsibilityChain.push({
      role: operatorRole,
      operatorId,
      operatorName,
      assignedAt: now
    });

    file.updatedAt = now;

    this.logs.push(log);
    return file;
  }

  transferToCollectionConfirmation(
    file: FileRecord,
    assignedTo: { role: OperatorRole; operatorId: string; operatorName: string },
    transferReason: string,
    operatorId: string,
    operatorName: string,
    operatorRole: OperatorRole
  ): { file: FileRecord; handoverRecord: HandoverRecord } {
    const now = new Date();

    const handoverRecord: HandoverRecord = {
      handoverId: uuidv4(),
      fileId: file.id,
      fromRole: file.responsiblePerson?.role || OperatorRole.WINDOW_STAFF,
      fromOperatorId: file.responsiblePerson?.operatorId || '',
      fromOperatorName: file.responsiblePerson?.operatorName || '',
      toRole: assignedTo.role,
      toOperatorId: assignedTo.operatorId,
      toOperatorName: assignedTo.operatorName,
      handoverReason: transferReason,
      handoverContext: {
        archiveInfo: file.archiveInfo ? `存放位置：${file.archiveInfo.archiveLocation}` : undefined,
        correctionHistory: file.correctionHistory.length > 0
          ? file.correctionHistory.map(c => `${c.operatorName}：${c.correctionContent}`)
          : undefined
      },
      timestamp: now,
      acknowledged: false
    };

    const log: OperationLog = {
      id: uuidv4(),
      fileId: file.id,
      operatorRole,
      operatorId,
      operatorName,
      action: ActionType.TRANSFER_TO_COLLECTION,
      fromStatus: file.currentStatus,
      toStatus: FileStatus.PENDING_COLLECTION,
      reason: transferReason,
      timestamp: now,
      responsibilityChainSnapshot: [...file.responsibilityChain],
      contextSnapshot: {
        archiveInfo: file.archiveInfo?.archiveNote,
        correctionHistory: file.correctionHistory.map(c => c.correctionContent)
      }
    };

    file.currentStatus = FileStatus.PENDING_COLLECTION;
    file.responsiblePerson = {
      role: assignedTo.role,
      operatorId: assignedTo.operatorId,
      operatorName: assignedTo.operatorName,
      assignedAt: now,
      handoverReason: transferReason,
      handoverFrom: operatorName
    };

    if (!file.responsibilityChain.find(r => r.operatorId === assignedTo.operatorId)) {
      file.responsibilityChain.push({
        role: assignedTo.role,
        operatorId: assignedTo.operatorId,
        operatorName: assignedTo.operatorName,
        assignedAt: now,
        handoverReason: transferReason,
        handoverFrom: operatorName
      });
    }

    file.updatedAt = now;
    file.expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    this.logs.push(log);
    this.handoverRecords.push(handoverRecord);

    this.createReminder(
      file.id,
      'COLLECTION_DEADLINE',
      assignedTo.role,
      assignedTo.operatorId,
      assignedTo.operatorName,
      `卷宗 ${file.appointmentNumber} 已归档，等待领取人确认。请在30天内完成领取确认`,
      'MEDIUM'
    );

    this.createReminder(
      file.id,
      'RESPONSIBILITY_TRANSFER',
      assignedTo.role,
      assignedTo.operatorId,
      assignedTo.operatorName,
      `责任已从 ${operatorName} 转移至 ${assignedTo.operatorName}，请查收卷宗`,
      'LOW',
      operatorId,
      operatorName
    );

    return { file, handoverRecord };
  }

  autoTransferToCollection(
    fileId: string,
    operatorId: string,
    operatorName: string,
    operatorRole: OperatorRole,
    targetRole: OperatorRole = OperatorRole.ARCHIVE_KEEPER
  ): { file: FileRecord; handoverRecord: HandoverRecord } | null {
    const file = this.getFileById(fileId);
    if (!file || file.currentStatus !== FileStatus.ARCHIVED) {
      return null;
    }

    const defaultArchiveKeeper = {
      operatorId: 'USER-A001',
      operatorName: '李档案'
    };

    return this.transferToCollectionConfirmation(
      file,
      {
        role: targetRole,
        operatorId: defaultArchiveKeeper.operatorId,
        operatorName: defaultArchiveKeeper.operatorName
      },
      '归档完成，自动转移至档案室等待领取',
      operatorId,
      operatorName,
      operatorRole
    );
  }

  getCollectionContext(fileId: string): CollectionContext | null {
    const file = this.getFileById(fileId);
    if (!file || !file.archiveInfo) {
      return null;
    }

    const handoverRecord = this.handoverRecords.find(h => h.fileId === fileId);
    if (!handoverRecord) {
      return null;
    }

    const recentHistory = this.getFileHistory(fileId);

    return {
      archiveContext: file.archiveInfo,
      handoverRecord,
      responsibilityChain: file.responsibilityChain,
      recentHistory: recentHistory.slice(0, 5),
      pendingCorrections: file.correctionHistory.map(c => c.correctionContent)
    };
  }

  confirmCollection(
    file: FileRecord,
    collectorName: string,
    collectorId: string,
    collectionNote: string,
    operatorId: string,
    operatorName: string
  ): FileRecord {
    const now = new Date();

    const collectionContext = this.getCollectionContext(file.id);

    const log: OperationLog = {
      id: uuidv4(),
      fileId: file.id,
      operatorRole: OperatorRole.ARCHIVE_KEEPER,
      operatorId,
      operatorName,
      action: ActionType.CONFIRM_COLLECTION,
      fromStatus: FileStatus.PENDING_COLLECTION,
      toStatus: FileStatus.COLLECTION_CONFIRMED,
      reason: collectionNote,
      timestamp: now,
      responsibilityChainSnapshot: [...file.responsibilityChain],
      contextSnapshot: collectionContext ? {
        archiveInfo: collectionContext.archiveContext.archiveNote,
        correctionHistory: collectionContext.pendingCorrections
      } : undefined
    };

    file.currentStatus = FileStatus.COLLECTION_CONFIRMED;
    file.collectionInfo = {
      collectorName,
      collectorId,
      collectedAt: now,
      collectionNote,
      collectionContext: collectionContext || undefined
    };
    file.updatedAt = now;

    this.logs.push(log);
    return file;
  }

  requestCorrection(
    file: FileRecord,
    correctionContent: string,
    operatorId: string,
    operatorName: string,
    operatorRole: OperatorRole
  ): FileRecord {
    const now = new Date();

    file.correctionHistory.push({
      timestamp: now,
      operatorRole,
      operatorName,
      correctionContent
    });

    const log: OperationLog = {
      id: uuidv4(),
      fileId: file.id,
      operatorRole,
      operatorId,
      operatorName,
      action: ActionType.REQUEST_CORRECTION,
      fromStatus: file.currentStatus,
      toStatus: FileStatus.RETURNED_FOR_CORRECTION,
      reason: correctionContent,
      timestamp: now,
      contextSnapshot: {
        correctionHistory: file.correctionHistory.map(c => c.correctionContent)
      }
    };

    file.currentStatus = FileStatus.RETURNED_FOR_CORRECTION;
    file.updatedAt = now;

    this.logs.push(log);

    this.createReminder(
      file.id,
      'CORRECTION_PENDING',
      OperatorRole.WINDOW_STAFF,
      file.responsiblePerson?.operatorId || '',
      file.responsiblePerson?.operatorName,
      `卷宗 ${file.appointmentNumber} 需要补正: ${correctionContent}`,
      'HIGH',
      operatorId,
      operatorName,
      '联系申请人补充材料'
    );

    return file;
  }

  private createReminder(
    fileId: string,
    type: Reminder['type'],
    recipientRole: OperatorRole,
    recipientId: string,
    recipientName: string | undefined,
    message: string,
    priority: Reminder['priority'],
    triggeredBy?: string,
    triggeredByName?: string,
    actionRequired?: string
  ): Reminder {
    const reminder: Reminder = {
      id: uuidv4(),
      fileId,
      type,
      recipientRole,
      recipientId,
      recipientName,
      message,
      createdAt: new Date(),
      triggeredBy,
      triggeredByName,
      priority,
      acknowledged: false,
      actionRequired
    };

    this.reminders.push(reminder);
    return reminder;
  }

  getFileHistory(fileId: string): OperationLog[] {
    return this.logs.filter(log => log.fileId === fileId).sort((a, b) =>
      b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  getPendingReminders(operatorId?: string): Reminder[] {
    let filtered = this.reminders.filter(r => !r.acknowledged);
    if (operatorId) {
      filtered = filtered.filter(r => r.recipientId === operatorId);
    }
    return filtered.sort((a, b) => {
      const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  acknowledgeReminder(reminderId: string, operatorId: string, operatorName: string): boolean {
    const reminder = this.reminders.find(r => r.id === reminderId);
    if (reminder && reminder.recipientId === operatorId) {
      reminder.acknowledged = true;
      reminder.acknowledgedAt = new Date();
      return true;
    }
    return false;
  }

  getTransferContext(fileId: string): {
    responsiblePerson?: ResponsibilityRecord;
    archiveInfo?: ArchiveContext;
    recentHistory: OperationLog[];
    collectionContext?: CollectionContext;
  } {
    const file = this.getFileById(fileId);
    if (!file) {
      return { recentHistory: [] };
    }

    const collectionContext = this.getCollectionContext(fileId);

    return {
      responsiblePerson: file.responsiblePerson,
      archiveInfo: file.archiveInfo,
      recentHistory: this.getFileHistory(fileId).slice(0, 5),
      collectionContext: collectionContext || undefined
    };
  }

  getHandoverRecord(fileId: string): HandoverRecord | undefined {
    return this.handoverRecords.find(h => h.fileId === fileId && !h.acknowledged);
  }

  acknowledgeHandover(handoverId: string, operatorId: string): boolean {
    const handover = this.handoverRecords.find(h => h.handoverId === handoverId);
    if (handover && handover.toOperatorId === operatorId) {
      handover.acknowledged = true;
      handover.acknowledgedAt = new Date();
      return true;
    }
    return false;
  }

  getAllFiles(): FileRecord[] {
    return Array.from(this.fileStore.values());
  }

  getFileById(fileId: string): FileRecord | undefined {
    return this.fileStore.get(fileId);
  }

  getFilesByStatus(status: FileStatus): FileRecord[] {
    return Array.from(this.fileStore.values()).filter(f => f.currentStatus === status);
  }

  getFilesByRole(role: OperatorRole): FileRecord[] {
    return Array.from(this.fileStore.values()).filter(f =>
      f.responsiblePerson?.role === role
    );
  }

  getOperationLogs(fileId?: string): OperationLog[] {
    if (fileId) {
      return this.getFileHistory(fileId);
    }
    return this.logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  generateImperfectScenarios() {
    return [
      {
        scenarioId: 'SCEN-001',
        scenario: '归档完成但未及时转移至档案员',
        fileId: 'FILE-2024-002',
        description: '窗口人员王窗口完成了归档审核，但忘记点击"转移至领取确认"按钮，导致卷宗一直停留在ARCHIVED状态',
        currentStatus: FileStatus.ARCHIVED,
        responsiblePerson: {
          role: OperatorRole.WINDOW_STAFF,
          operatorId: 'USER-W003',
          operatorName: '王窗口',
          assignedAt: new Date('2024-06-18')
        },
        issue: '缺少自动转移机制，依赖人工操作，容易遗漏',
        missingAction: '应触发提醒：归档已完成，请转移至档案室等待领取',
        triggerReminder: () => this.createReminder(
          'FILE-2024-002',
          'HANDOVER_PENDING',
          OperatorRole.WINDOW_STAFF,
          'USER-W003',
          '王窗口',
          '卷宗 YY20240618-0901 已完成归档，请立即转移至档案室等待领取',
          'HIGH',
          'SYSTEM',
          '系统自动',
          '点击"转移至领取确认"按钮'
        )
      },
      {
        scenarioId: 'SCEN-002',
        scenario: '补正通知发送给了错误的人员',
        fileId: 'FILE-2024-004',
        description: '公证员发起了补正，但因为窗口人员临时换班，补正通知发送给了陈窗口，但实际处理人是周窗口',
        currentStatus: FileStatus.RETURNED_FOR_CORRECTION,
        responsiblePerson: {
          role: OperatorRole.WINDOW_STAFF,
          operatorId: 'USER-W001',
          operatorName: '陈窗口',
          assignedAt: new Date('2024-06-20')
        },
        actualHandler: {
          operatorId: 'USER-W004',
          operatorName: '周窗口'
        },
        issue: '责任人信息未实时更新，导致通知发送错误',
        missingAction: '应在人员变更时同步更新责任人，并重新发送补正通知',
        triggerReminder: () => this.createReminder(
          'FILE-2024-004',
          'RESPONSIBILITY_TRANSFER',
          OperatorRole.WINDOW_STAFF,
          'USER-W004',
          '周窗口',
          '卷宗 YY20240620-0920 的补正通知已重新发送，请查收',
          'HIGH',
          'SYSTEM',
          '系统自动',
          '联系申请人补充材料'
        )
      },
      {
        scenarioId: 'SCEN-003',
        scenario: '领取确认时丢失了归档说明',
        fileId: 'FILE-2024-003',
        description: '卷宗已过期未被领取，档案员想联系申请人但找不到当时的归档说明，因为说明只存在于档案员本地的便签中',
        currentStatus: FileStatus.EXPIRED_NOT_COLLECTED,
        responsiblePerson: {
          role: OperatorRole.ARCHIVE_KEEPER,
          operatorId: 'USER-A002',
          operatorName: '张档案',
          assignedAt: new Date('2024-06-05')
        },
        archiveInfo: {
          archiveLocation: '档案室B区-第1排-第5格',
          archiveDate: new Date('2024-06-05'),
          archiveNote: '委托公证，申请人表示近期无法领取',
          archiveReason: '委托公证办理完成，申请人表示近期无法领取'
        },
        issue: '归档时的说明未能系统化记录，导致后续查询困难',
        missingAction: '应在归档时强制填写"归档原因"字段，并自动传递给后续处理人',
        triggerReminder: () => this.createReminder(
          'FILE-2024-003',
          'EXPIRATION_WARNING',
          OperatorRole.ARCHIVE_KEEPER,
          'USER-A002',
          '张档案',
          '卷宗 YY20240601-0845 领取期限已过，申请人曾表示"近期无法领取"，请联系确认最新意向',
          'URGENT',
          'SYSTEM',
          '系统自动',
          '查看归档说明并联系申请人'
        )
      }
    ];
  }
}

export const workflowService = new FileWorkflowService();
