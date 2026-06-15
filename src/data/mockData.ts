import { SKU, Batch, BatchAdjustment, InventoryAlert, Notification, Task, User } from '../types';

export const mockSKUs: SKU[] = [
  { id: 'SKU001', name: '美赞臣蓝臻3段', brand: '美赞臣', spec: '900g/罐', unit: '罐', safetyStock: 30, maxStock: 100 },
  { id: 'SKU002', name: '惠氏启赋4段', brand: '惠氏', spec: '800g/罐', unit: '罐', safetyStock: 25, maxStock: 80 },
  { id: 'SKU003', name: '雅培菁挚有机3段', brand: '雅培', spec: '900g/罐', unit: '罐', safetyStock: 20, maxStock: 60 },
  { id: 'SKU004', name: '美素佳儿金装2段', brand: '美素佳儿', spec: '900g/罐', unit: '罐', safetyStock: 35, maxStock: 120 },
  { id: 'SKU005', name: '飞鹤星飞帆3段', brand: '飞鹤', spec: '700g/罐', unit: '罐', safetyStock: 40, maxStock: 150 },
  { id: 'SKU006', name: '伊利金领冠珍护3段', brand: '伊利', spec: '900g/罐', unit: '罐', safetyStock: 28, maxStock: 90 },
];

export const mockBatches: Batch[] = [
  { id: 'B001', skuId: 'SKU001', batchNo: 'MP20240115', quantity: 15, arrivalDate: '2024-01-15', expireDate: '2025-07-15', status: 'expiring' },
  { id: 'B002', skuId: 'SKU001', batchNo: 'MP20240320', quantity: 25, arrivalDate: '2024-03-20', expireDate: '2025-09-20', status: 'normal' },
  { id: 'B003', skuId: 'SKU002', batchNo: 'WH20240210', quantity: 10, arrivalDate: '2024-02-10', expireDate: '2025-08-10', status: 'normal' },
  { id: 'B004', skuId: 'SKU002', batchNo: 'WH20240401', quantity: 20, arrivalDate: '2024-04-01', expireDate: '2025-10-01', status: 'normal' },
  { id: 'B005', skuId: 'SKU003', batchNo: 'YB20240105', quantity: 8, arrivalDate: '2024-01-05', expireDate: '2024-07-05', status: 'expiring' },
  { id: 'B006', skuId: 'SKU003', batchNo: 'YB20240515', quantity: 15, arrivalDate: '2024-05-15', expireDate: '2025-11-15', status: 'normal' },
  { id: 'B007', skuId: 'SKU004', batchNo: 'MS20240601', quantity: 45, arrivalDate: '2024-06-01', expireDate: '2025-12-01', status: 'normal' },
  { id: 'B008', skuId: 'SKU005', batchNo: 'FH20240310', quantity: 12, arrivalDate: '2024-03-10', expireDate: '2025-09-10', status: 'normal' },
  { id: 'B009', skuId: 'SKU005', batchNo: 'FH20240701', quantity: 30, arrivalDate: '2024-07-01', expireDate: '2026-01-01', status: 'normal' },
  { id: 'B010', skuId: 'SKU006', batchNo: 'YL20240220', quantity: 22, arrivalDate: '2024-02-20', expireDate: '2025-08-20', status: 'normal' },
];

export const mockAdjustments: BatchAdjustment[] = [
  {
    id: 'ADJ001',
    skuId: 'SKU001',
    originalBatchId: 'B001',
    newBatchId: 'B002',
    adjustQuantity: 10,
    reason: '临期下架',
    applicant: '张三',
    applyTime: '2024-06-14 09:30',
    createTime: '2024-06-14 09:30',
    status: 'pending',
    attachments: []
  },
  {
    id: 'ADJ002',
    skuId: 'SKU003',
    originalBatchId: 'B005',
    newBatchId: 'B006',
    adjustQuantity: 8,
    reason: '批次优化',
    applicant: '李四',
    applyTime: '2024-06-13 14:20',
    createTime: '2024-06-13 14:20',
    status: 'approved',
    approver: '王经理',
    approveTime: '2024-06-13 15:00',
    attachments: []
  },
  {
    id: 'ADJ003',
    skuId: 'SKU005',
    originalBatchId: 'B008',
    newBatchId: 'B009',
    adjustQuantity: 5,
    reason: '换货入库',
    applicant: '张三',
    applyTime: '2024-06-12 11:15',
    createTime: '2024-06-12 11:15',
    status: 'completed',
    approver: '王经理',
    approveTime: '2024-06-12 11:45',
    attachments: []
  },
];

export const mockAlerts: InventoryAlert[] = [
  {
    id: 'ALT001',
    skuId: 'SKU002',
    currentStock: 12,
    safetyStock: 25,
    alertLevel: 'red',
    status: 'pending',
    createTime: '2024-06-14 08:00',
    relatedAdjustments: ['ADJ001']
  },
  {
    id: 'ALT002',
    skuId: 'SKU003',
    currentStock: 18,
    safetyStock: 20,
    alertLevel: 'yellow',
    status: 'processing',
    createTime: '2024-06-13 10:30',
    handler: '采购刘',
    handleTime: '2024-06-13 11:00',
    relatedAdjustments: ['ADJ002']
  },
  {
    id: 'ALT003',
    skuId: 'SKU006',
    currentStock: 18,
    safetyStock: 28,
    alertLevel: 'orange',
    status: 'pending',
    createTime: '2024-06-14 09:00',
    relatedAdjustments: []
  },
];

export const mockNotifications: Notification[] = [
  {
    id: 'NOT001',
    type: 'adjustment',
    title: '批号调整申请待审核',
    content: '店员张三提交了美赞臣蓝臻3段的批号调整申请，请及时审核',
    targetRole: 'manager',
    read: false,
    createTime: '2024-06-14 09:30',
    relatedId: 'ADJ001'
  },
  {
    id: 'NOT002',
    type: 'alert',
    title: '库存预警触发',
    content: '惠氏启赋4段库存低于安全水位，请及时处理',
    targetRole: 'buyer',
    read: false,
    createTime: '2024-06-14 08:00',
    relatedId: 'ALT001'
  },
  {
    id: 'NOT003',
    type: 'adjustment',
    title: '批号调整已通过',
    content: '您提交的雅培菁挚有机3段批号调整申请已通过审核',
    targetRole: 'clerk',
    read: true,
    createTime: '2024-06-13 15:00',
    relatedId: 'ADJ002'
  },
];

export const mockTasks: Task[] = [
  {
    id: 'TSK001',
    type: 'adjustment_audit',
    title: '审核批号调整申请 ADJ001',
    priority: 'high',
    status: 'pending',
    assignee: '王经理',
    createTime: '2024-06-14 09:30',
    dueTime: '2024-06-14 11:30',
    relatedData: 'ADJ001'
  },
  {
    id: 'TSK002',
    type: 'alert_response',
    title: '处理库存预警 ALT001',
    priority: 'high',
    status: 'pending',
    assignee: '采购刘',
    createTime: '2024-06-14 08:00',
    dueTime: '2024-06-14 12:00',
    relatedData: 'ALT001'
  },
  {
    id: 'TSK003',
    type: 'alert_response',
    title: '处理库存预警 ALT003',
    priority: 'medium',
    status: 'pending',
    assignee: '采购刘',
    createTime: '2024-06-14 09:00',
    relatedData: 'ALT003'
  },
];

export const mockUsers: User[] = [
  { id: 'U001', name: '张三', role: 'clerk', storeId: 'ST001', storeName: '朝阳区店' },
  { id: 'U002', name: '李四', role: 'clerk', storeId: 'ST001', storeName: '朝阳区店' },
  { id: 'U003', name: '王经理', role: 'manager', storeId: 'ST001', storeName: '朝阳区店' },
  { id: 'U004', name: '采购刘', role: 'buyer', storeId: 'HQ', storeName: '总部' },
];

export const adjustReasons = [
  '临期下架',
  '批次优化',
  '换货入库',
  '质量回调',
  '其他'
];
