import { Appeal, Evidence, AuditLog, User, AppealSummary, AppealStatus } from '../../types';

export const mockUsers: User[] = [
  { id: 'u1', name: '王收货', role: 'receiver', phone: '13800138001' },
  { id: 'u2', name: '李检测', role: 'inspector', phone: '13800138002' },
  { id: 'u3', name: '张财务', role: 'finance', phone: '13800138003' },
  { id: 'u4', name: '赵管理员', role: 'admin', phone: '13800138004' },
];

export const mockEvidences: Evidence[] = [
  {
    id: 'e1',
    appealId: 'a1',
    type: 'photo',
    title: '商品外观照片',
    url: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=smartphone%20recycling%20inspection%20photo&image_size=square',
    uploadedAt: '2024-01-15T10:30:00Z',
    uploadedBy: 'u1',
    size: 2048000,
    description: '收到商品时拍摄的外观照片',
  },
  {
    id: 'e2',
    appealId: 'a1',
    type: 'document',
    title: '质检报告',
    url: '#',
    uploadedAt: '2024-01-15T11:00:00Z',
    uploadedBy: 'u2',
    description: '检测师出具的质检报告',
  },
  {
    id: 'e3',
    appealId: 'a2',
    type: 'video',
    title: '故障演示视频',
    url: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=smartphone%20screen%20defect%20video%20thumbnail&image_size=landscape_16_9',
    uploadedAt: '2024-01-14T14:20:00Z',
    uploadedBy: 'u2',
    size: 15728640,
    description: '用户反馈的暗病演示视频',
  },
  {
    id: 'e4',
    appealId: 'a3',
    type: 'chat_log',
    title: '客服聊天记录',
    url: '#',
    uploadedAt: '2024-01-13T09:15:00Z',
    uploadedBy: 'u1',
    description: '用户与客服的沟通记录',
  },
  {
    id: 'e5',
    appealId: 'a4',
    type: 'system_snapshot',
    title: '打款记录截图',
    url: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=payment%20transaction%20record%20screenshot&image_size=landscape_16_9',
    uploadedAt: '2024-01-12T16:45:00Z',
    uploadedBy: 'u3',
    description: '财务系统打款记录截图',
  },
  {
    id: 'e6',
    appealId: 'a5',
    type: 'photo',
    title: '电池健康度截图',
    url: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=smartphone%20battery%20health%20screenshot&image_size=square',
    uploadedAt: '2024-01-11T10:00:00Z',
    uploadedBy: 'u2',
    size: 1024000,
  },
];

export const mockAuditLogs: AuditLog[] = [
  {
    id: 'log1',
    appealId: 'a1',
    action: 'create',
    actorId: 'u1',
    actorName: '王收货',
    actorRole: 'receiver',
    timestamp: '2024-01-15T10:00:00Z',
    details: { orderId: 'ORD20240115001', customerName: '陈先生' },
  },
  {
    id: 'log2',
    appealId: 'a1',
    action: 'status_change',
    actorId: 'u1',
    actorName: '王收货',
    actorRole: 'receiver',
    timestamp: '2024-01-15T10:30:00Z',
    details: { comment: '确认收到商品，外观与描述一致' },
    previousStatus: 'pending_receipt',
    newStatus: 'pending_inspection',
  },
  {
    id: 'log3',
    appealId: 'a2',
    action: 'create',
    actorId: 'u2',
    actorName: '李检测',
    actorRole: 'inspector',
    timestamp: '2024-01-14T14:00:00Z',
    details: { orderId: 'ORD20240114002', customerName: '刘女士' },
  },
  {
    id: 'log4',
    appealId: 'a2',
    action: 'evidence_upload',
    actorId: 'u2',
    actorName: '李检测',
    actorRole: 'inspector',
    timestamp: '2024-01-14T14:20:00Z',
    details: { evidenceId: 'e3', evidenceType: 'video' },
  },
  {
    id: 'log5',
    appealId: 'a3',
    action: 'reject',
    actorId: 'u2',
    actorName: '李检测',
    actorRole: 'inspector',
    timestamp: '2024-01-13T11:30:00Z',
    details: { reason: '证据不足，无法证明暗病存在' },
    previousStatus: 'pending_inspection',
    newStatus: 'rejected',
  },
  {
    id: 'log6',
    appealId: 'a4',
    action: 'status_change',
    actorId: 'u3',
    actorName: '张财务',
    actorRole: 'finance',
    timestamp: '2024-01-12T17:00:00Z',
    details: { comment: '已重新打款至正确账号' },
    previousStatus: 'pending_finance',
    newStatus: 'pending_confirmation',
  },
  {
    id: 'log7',
    appealId: 'a4',
    action: 'resolve',
    actorId: 'u3',
    actorName: '张财务',
    actorRole: 'finance',
    timestamp: '2024-01-13T09:00:00Z',
    details: { resolutionAmount: 3200, method: 'bank_transfer' },
    previousStatus: 'pending_confirmation',
    newStatus: 'resolved',
  },
  {
    id: 'log8',
    appealId: 'a5',
    action: 'return',
    actorId: 'u1',
    actorName: '王收货',
    actorRole: 'receiver',
    timestamp: '2024-01-11T14:00:00Z',
    details: { reason: '缺少关键证据，需要用户补充' },
    previousStatus: 'pending_receipt',
    newStatus: 'returned',
  },
];

export const mockAppeals: Appeal[] = [
  {
    id: 'a1',
    orderId: 'ORD20240115001',
    customerName: '陈先生',
    customerPhone: '13900139001',
    productName: 'iPhone 14 Pro',
    productModel: '256GB 深空黑',
    appealType: 'price_regret',
    status: 'pending_inspection',
    description: '用户认为估价偏低，希望重新评估。手机使用不到一年，电池健康度95%以上。',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    assignedTo: 'u2',
    estimatedAmount: 4500,
    actualAmount: 4200,
    claimedAmount: 4800,
    deadline: '2024-01-18T10:00:00Z',
    evidenceIds: ['e1', 'e2'],
    auditLogIds: ['log1', 'log2'],
  },
  {
    id: 'a2',
    orderId: 'ORD20240114002',
    customerName: '刘女士',
    customerPhone: '13900139002',
    productName: 'iPhone 13',
    productModel: '128GB 蓝色',
    appealType: 'hidden_defect',
    status: 'pending_finance',
    description: '用户反馈手机存在间歇性黑屏问题，检测时未发现，但用户提供了视频证据。',
    createdAt: '2024-01-14T14:00:00Z',
    updatedAt: '2024-01-14T16:00:00Z',
    assignedTo: 'u3',
    estimatedAmount: 2800,
    actualAmount: 2500,
    claimedAmount: 3000,
    deadline: '2024-01-19T14:00:00Z',
    evidenceIds: ['e3'],
    auditLogIds: ['log3', 'log4'],
  },
  {
    id: 'a3',
    orderId: 'ORD20240113003',
    customerName: '张先生',
    customerPhone: '13900139003',
    productName: '华为 Mate 60 Pro',
    productModel: '512GB 雅川青',
    appealType: 'hidden_defect',
    status: 'rejected',
    description: '用户声称手机摄像头有问题，但检测未发现异常，证据不足以支持申诉。',
    createdAt: '2024-01-13T09:00:00Z',
    updatedAt: '2024-01-13T11:30:00Z',
    estimatedAmount: 6000,
    actualAmount: 5800,
    claimedAmount: 6200,
    evidenceIds: ['e4'],
    auditLogIds: ['log5'],
    rejectionReason: '证据不足，无法证明暗病存在',
  },
  {
    id: 'a4',
    orderId: 'ORD20240112004',
    customerName: '赵女士',
    customerPhone: '13900139004',
    productName: '小米14',
    productModel: '256GB 黑色',
    appealType: 'payment_account_error',
    status: 'resolved',
    description: '打款时账号输入错误，已重新打款至正确账号。',
    createdAt: '2024-01-12T15:00:00Z',
    updatedAt: '2024-01-13T09:00:00Z',
    assignedTo: 'u3',
    estimatedAmount: 3200,
    actualAmount: 3200,
    resolutionAmount: 3200,
    deadline: '2024-01-14T15:00:00Z',
    evidenceIds: ['e5'],
    auditLogIds: ['log6', 'log7'],
  },
  {
    id: 'a5',
    orderId: 'ORD20240111005',
    customerName: '孙先生',
    customerPhone: '13900139005',
    productName: 'iPhone 15',
    productModel: '128GB 粉色',
    appealType: 'price_regret',
    status: 'returned',
    description: '用户希望重新估价，但缺少电池健康度证明，需要补充证据。',
    createdAt: '2024-01-11T09:00:00Z',
    updatedAt: '2024-01-11T14:00:00Z',
    estimatedAmount: 5000,
    actualAmount: 4700,
    claimedAmount: 5200,
    evidenceIds: ['e6'],
    auditLogIds: ['log8'],
    returnReason: '缺少关键证据，需要用户补充',
  },
  {
    id: 'a6',
    orderId: 'ORD20240116006',
    customerName: '周先生',
    customerPhone: '13900139006',
    productName: 'OPPO Find X7',
    productModel: '256GB 星空黑',
    appealType: 'hidden_defect',
    status: 'pending_receipt',
    description: '用户反馈屏幕有坏点，要求重新检测。',
    createdAt: '2024-01-16T08:30:00Z',
    updatedAt: '2024-01-16T08:30:00Z',
    assignedTo: 'u1',
    estimatedAmount: 3500,
    actualAmount: 3300,
    claimedAmount: 3800,
    deadline: '2024-01-21T08:30:00Z',
    evidenceIds: [],
    auditLogIds: [],
  },
  {
    id: 'a7',
    orderId: 'ORD20240116007',
    customerName: '吴女士',
    customerPhone: '13900139007',
    productName: 'vivo X100',
    productModel: '512GB 华夏红',
    appealType: 'payment_account_error',
    status: 'pending_finance',
    description: '用户提供的银行卡号有误，打款失败，需要确认正确账号。',
    createdAt: '2024-01-16T09:00:00Z',
    updatedAt: '2024-01-16T10:00:00Z',
    assignedTo: 'u3',
    estimatedAmount: 4200,
    actualAmount: 4200,
    deadline: '2024-01-18T09:00:00Z',
    evidenceIds: [],
    auditLogIds: [],
  },
  {
    id: 'a8',
    orderId: 'ORD20240110008',
    customerName: '郑先生',
    customerPhone: '13900139008',
    productName: '三星S24 Ultra',
    productModel: '512GB 钛灰色',
    appealType: 'price_regret',
    status: 'pending_confirmation',
    description: '重新估价后同意用户诉求，等待用户确认收款。',
    createdAt: '2024-01-10T11:00:00Z',
    updatedAt: '2024-01-15T15:00:00Z',
    assignedTo: 'u3',
    estimatedAmount: 8000,
    actualAmount: 7500,
    claimedAmount: 8200,
    resolutionAmount: 7800,
    deadline: '2024-01-17T11:00:00Z',
    evidenceIds: [],
    auditLogIds: [],
  },
];

let appeals: Appeal[] = [...mockAppeals];
let evidences: Evidence[] = [...mockEvidences];
let auditLogs: AuditLog[] = [...mockAuditLogs];

export const getAppeals = (): Appeal[] => [...appeals];

export const getAppealById = (id: string): Appeal | undefined => {
  return appeals.find(a => a.id === id);
};

export const getEvidencesByAppealId = (appealId: string): Evidence[] => {
  return evidences.filter(e => e.appealId === appealId);
};

export const getAuditLogsByAppealId = (appealId: string): AuditLog[] => {
  return auditLogs.filter(log => log.appealId === appealId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const getUserById = (userId: string): User | undefined => {
  return mockUsers.find(u => u.id === userId);
};

export const getUsersByRole = (role: string): User[] => {
  return mockUsers.filter(u => u.role === role);
};

export const getSummary = (): AppealSummary => {
  const today = new Date().toISOString().split('T')[0];
  const pendingStatuses: AppealStatus[] = ['pending_receipt', 'pending_inspection', 'pending_finance', 'pending_confirmation'];
  
  const todayPending = appeals.filter(a => 
    a.createdAt.startsWith(today) && pendingStatuses.includes(a.status)
  ).length;
  
  const overdueCount = appeals.filter(a => 
    a.deadline && new Date(a.deadline) < new Date() && 
    !['resolved', 'rejected'].includes(a.status)
  ).length;
  
  const returnedCount = appeals.filter(a => a.status === 'returned').length;
  
  return {
    todayPending,
    overdueCount,
    returnedCount,
    totalAppeals: appeals.length,
    resolvedCount: appeals.filter(a => a.status === 'resolved').length,
  };
};

export const updateAppeal = (updatedAppeal: Appeal): boolean => {
  const index = appeals.findIndex(a => a.id === updatedAppeal.id);
  if (index === -1) return false;
  appeals[index] = updatedAppeal;
  return true;
};

export const addAuditLog = (log: AuditLog): void => {
  auditLogs.push(log);
};

export const addEvidence = (evidence: Evidence): void => {
  evidences.push(evidence);
};

export const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};