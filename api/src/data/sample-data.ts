import { FileRecord, OperationLog, Reminder, FileStatus, OperatorRole } from '../models/file-lifecycle.model';

export const sampleFiles: FileRecord[] = [
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
    archiveInfo: {
      archiveLocation: '档案室A区-第3排-第12格',
      archiveDate: new Date('2024-06-15'),
      archiveNote: '房产继承公证，材料齐全，已核验'
    },
    createdAt: new Date('2024-06-10'),
    updatedAt: new Date('2024-06-15'),
    expiresAt: new Date('2024-07-15')
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
    createdAt: new Date('2024-06-18'),
    updatedAt: new Date('2024-06-18')
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
    archiveInfo: {
      archiveLocation: '档案室B区-第1排-第5格',
      archiveDate: new Date('2024-06-05'),
      archiveNote: '委托公证，申请人表示近期无法领取'
    },
    createdAt: new Date('2024-05-28'),
    updatedAt: new Date('2024-06-05'),
    expiresAt: new Date('2024-07-05')
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
    createdAt: new Date('2024-06-20'),
    updatedAt: new Date('2024-06-21')
  }
];

export const sampleOperationLogs: OperationLog[] = [
  {
    id: 'LOG-001',
    fileId: 'FILE-2024-001',
    operatorRole: OperatorRole.WINDOW_STAFF,
    operatorId: 'USER-W002',
    operatorName: '赵窗口',
    action: 'START_ARCHIVE',
    toStatus: FileStatus.ARCHIVING,
    timestamp: new Date('2024-06-15T09:30:00')
  },
  {
    id: 'LOG-002',
    fileId: 'FILE-2024-001',
    operatorRole: OperatorRole.NOTARY,
    operatorId: 'USER-N001',
    operatorName: '刘公证员',
    action: 'COMPLETE_ARCHIVE',
    fromStatus: FileStatus.ARCHIVING,
    toStatus: FileStatus.ARCHIVED,
    reason: '审核通过，签字盖章完毕',
    timestamp: new Date('2024-06-15T10:45:00')
  },
  {
    id: 'LOG-003',
    fileId: 'FILE-2024-001',
    operatorRole: OperatorRole.WINDOW_STAFF,
    operatorId: 'USER-W002',
    operatorName: '赵窗口',
    action: 'TRANSFER_TO_COLLECTION',
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
    action: 'REQUEST_CORRECTION',
    fromStatus: FileStatus.ARCHIVING,
    toStatus: FileStatus.RETURNED_FOR_CORRECTION,
    reason: '身份证明材料过期，请重新提供有效期内身份证件',
    timestamp: new Date('2024-06-21T14:20:00')
  }
];

export const sampleReminders: Reminder[] = [
  {
    id: 'REM-001',
    fileId: 'FILE-2024-001',
    type: 'COLLECTION_DEADLINE',
    recipientRole: OperatorRole.ARCHIVE_KEEPER,
    recipientId: 'USER-A001',
    message: '卷宗 YY20240615-0892 已归档，等待领取人确认。请在30天内完成领取确认',
    createdAt: new Date('2024-06-15'),
    acknowledged: false
  },
  {
    id: 'REM-002',
    fileId: 'FILE-2024-002',
    type: 'ARCHIVE_DEADLINE',
    recipientRole: OperatorRole.WINDOW_STAFF,
    recipientId: 'USER-W003',
    message: '卷宗 YY20240618-0901 开始归档处理已超过2小时，请尽快完成审核',
    createdAt: new Date('2024-06-18T11:30:00'),
    acknowledged: false
  },
  {
    id: 'REM-003',
    fileId: 'FILE-2024-003',
    type: 'COLLECTION_DEADLINE',
    recipientRole: OperatorRole.ARCHIVE_KEEPER,
    recipientId: 'USER-A002',
    message: '卷宗 YY20240601-0845 领取期限已过（2024-07-05），仍未领取，需要联系申请人',
    createdAt: new Date('2024-07-06'),
    triggeredBy: 'SYSTEM',
    acknowledged: false
  },
  {
    id: 'REM-004',
    fileId: 'FILE-2024-004',
    type: 'CORRECTION_PENDING',
    recipientRole: OperatorRole.WINDOW_STAFF,
    recipientId: 'USER-W001',
    message: '卷宗 YY20240620-0920 需要补正: 身份证明材料过期，请重新提供有效期内身份证件',
    createdAt: new Date('2024-06-21'),
    acknowledged: false
  },
  {
    id: 'REM-005',
    fileId: 'FILE-2024-001',
    type: 'RESPONSIBILITY_TRANSFER',
    recipientRole: OperatorRole.ARCHIVE_KEEPER,
    recipientId: 'USER-A001',
    message: '责任已从 赵窗口 转移至 李档案，请查收卷宗',
    createdAt: new Date('2024-06-15'),
    triggeredBy: 'USER-W002',
    acknowledged: true,
    acknowledgedAt: new Date('2024-06-15T11:05:00')
  }
];

export const imperfectScenarioExamples = [
  {
    scenario: '责任人变更但未同步',
    fileId: 'FILE-2024-005',
    description: '窗口人员A启动了归档，但临时请假，工作转交给窗口人员B，但系统记录仍显示A为责任人',
    currentStatus: FileStatus.ARCHIVING,
    responsiblePerson: {
      role: OperatorRole.WINDOW_STAFF,
      operatorId: 'USER-W001',
      operatorName: '陈窗口',
      assignedAt: new Date('2024-06-20')
    },
    actualHandler: 'USER-W004',
    actualHandlerName: '周窗口',
    issue: '责任人与实际操作人不一致，可能导致补正通知发送错误'
  },
  {
    scenario: '领取确认超时但无人跟进',
    fileId: 'FILE-2024-003',
    description: '卷宗已超过领取期限，档案员未及时标记处理状态',
    currentStatus: FileStatus.EXPIRED_NOT_COLLECTED,
    responsiblePerson: {
      role: OperatorRole.ARCHIVE_KEEPER,
      operatorId: 'USER-A002',
      operatorName: '张档案',
      assignedAt: new Date('2024-06-05')
    },
    issue: '超期卷宗需要人工介入，但系统未自动升级处理',
    reminderNeeded: '需要提醒档案员联系申请人确认领取意向'
  },
  {
    scenario: '补正内容在状态转换中丢失',
    fileId: 'FILE-2024-004',
    description: '公证员发起了补正，但卷宗状态变更后，补正说明未完整传递给下一个处理人',
    currentStatus: FileStatus.RETURNED_FOR_CORRECTION,
    responsiblePerson: {
      role: OperatorRole.WINDOW_STAFF,
      operatorId: 'USER-W001',
      operatorName: '陈窗口',
      assignedAt: new Date('2024-06-20')
    },
    correctionHistory: [
      {
        timestamp: new Date('2024-06-21T14:20:00'),
        operator: '孙公证员',
        content: '身份证明材料过期'
      },
      {
        timestamp: new Date('2024-06-21T14:25:00'),
        operator: '孙公证员',
        content: '补充：还需提供户口本原件'
      }
    ],
    issue: '多次补正说明分散记录，可能遗漏部分要求'
  }
];
