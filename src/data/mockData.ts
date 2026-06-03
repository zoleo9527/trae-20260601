import type { Order, ScanFile, Assignment, Technician, Remark, AuditLog, OrderStatus } from '@/types';

const generateId = () => Math.random().toString(36).substring(2, 9);

const formatDate = (date: Date) => date.toISOString().split('T')[0];
const formatDateTime = (date: Date) => date.toISOString();

const daysFromNow = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatDate(date);
};

const hoursAgo = (hours: number) => {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return formatDateTime(date);
};

export const mockTechnicians: Technician[] = [
  { id: 'tech-1', name: '张伟', specialty: '烤瓷冠/全瓷冠', status: 'AVAILABLE' },
  { id: 'tech-2', name: '李明', specialty: '贴面/嵌体', status: 'AVAILABLE' },
  { id: 'tech-3', name: '王芳', specialty: '活动义齿', status: 'BUSY' },
  { id: 'tech-4', name: '刘强', specialty: '种植牙', status: 'AVAILABLE' },
  { id: 'tech-5', name: '陈静', specialty: '正畸矫治器', status: 'BUSY' },
];

const orderStatuses: OrderStatus[] = ['PENDING', 'SCAN_UPLOADED', 'PROCESSING', 'ASSIGNED', 'IN_PRODUCTION', 'PENDING_INSPECTION', 'COMPLETED', 'REWORK'];
const customers = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑十一', '冯十二'];
const toothTypes = ['烤瓷冠', '全瓷冠', '贴面', '嵌体', '活动义齿', '种植牙', '正畸矫治器'];
const shades = ['A1', 'A2', 'A3', 'A3.5', 'B1', 'B2', 'C1', 'C2'];

export const mockOrders: Order[] = Array.from({ length: 25 }, (_, i) => {
  const status = orderStatuses[i % orderStatuses.length];
  return {
    id: `order-${i + 1}`,
    orderNo: `YC${202606}${String(i + 1).padStart(4, '0')}`,
    customerName: customers[i % customers.length],
    toothType: toothTypes[i % toothTypes.length],
    shade: shades[i % shades.length],
    deliveryDate: daysFromNow((i % 14) + 1),
    status,
    createdAt: hoursAgo(i * 24),
    createdBy: '客服小王',
    reworkCount: status === 'REWORK' ? 1 : 0,
  };
});

export const mockScanFiles: ScanFile[] = mockOrders
  .filter(o => o.status !== 'PENDING')
  .slice(0, 20)
  .map((order, i) => ({
    id: `scan-${i + 1}`,
    orderId: order.id,
    fileName: `${order.orderNo}_${order.customerName}_口扫.stl`,
    fileUrl: `/mock/scans/${order.orderNo}.stl`,
    fileType: 'model/stl',
    fileSize: Math.floor(Math.random() * 50 + 10) * 1024 * 1024,
    uploadedAt: hoursAgo(i * 24 + 2),
    uploadedBy: '客服小王',
    status: ['SCAN_UPLOADED'].includes(order.status) ? 'UPLOADED' : 'PROCESSED',
    customerServiceRemark: i % 3 === 0 ? '患者对色泽要求较高，请特别注意色号匹配。咬合面需要保留原有形态。' :
                           i % 3 === 1 ? '21号牙位，邻面接触点略紧，设计时请适当调整。' :
                           '',
  }));

export const mockAssignments: Assignment[] = mockScanFiles
  .filter(s => s.status === 'PROCESSED')
  .slice(0, 15)
  .map((scan, i) => {
    const order = mockOrders.find(o => o.id === scan.orderId)!;
    const technician = mockTechnicians[i % mockTechnicians.length];
    return {
      id: `assign-${i + 1}`,
      scanFileId: scan.id,
      orderId: order.id,
      technicianId: technician.id,
      technicianName: technician.name,
      customerServiceRemark: scan.customerServiceRemark,
      designerRemark: i % 2 === 0 ? '已完成数字模型设计，边缘封闭良好，就位道已确认。' : '模型厚度已调整，咬合面形态参照对颌牙设计。',
      combinedRemark: `${scan.customerServiceRemark ? `【客服】${scan.customerServiceRemark}\n` : ''}【设计师】${i % 2 === 0 ? '已完成数字模型设计，边缘封闭良好，就位道已确认。' : '模型厚度已调整，咬合面形态参照对颌牙设计。'}`,
      assignedAt: hoursAgo(i * 24 + 8),
      assignedBy: '设计师老李',
      status: order.status === 'COMPLETED' ? 'COMPLETED' :
              order.status === 'REWORK' ? 'REWORK' :
              order.status === 'IN_PRODUCTION' || order.status === 'PENDING_INSPECTION' ? 'ACCEPTED' : 'PENDING',
      completedAt: (order.status === 'COMPLETED' || order.status === 'REWORK') ? hoursAgo(i * 24 + 20) : undefined,
      estimatedDays: 3 + (i % 4),
    };
  });

export const mockRemarks: Remark[] = mockOrders.slice(0, 15).flatMap((order, i) => {
  const remarks: Remark[] = [];
  if (i % 3 === 0) {
    remarks.push({
      id: `remark-${i * 3 + 1}`,
      orderId: order.id,
      content: '患者对色泽要求较高，请特别注意色号匹配。',
      createdBy: '客服小王',
      role: 'CUSTOMER_SERVICE',
      createdAt: hoursAgo(i * 24 + 1),
    });
  }
  if (i % 4 !== 0) {
    remarks.push({
      id: `remark-${i * 3 + 2}`,
      orderId: order.id,
      content: '已完成数字模型设计，边缘封闭良好。',
      createdBy: '设计师老李',
      role: 'DESIGNER',
      createdAt: hoursAgo(i * 24 + 6),
    });
  }
  if (order.status === 'COMPLETED' || order.status === 'REWORK') {
    remarks.push({
      id: `remark-${i * 3 + 3}`,
      orderId: order.id,
      content: order.status === 'COMPLETED' ? '质检合格，色泽匹配良好，边缘密合。' : '色号偏差，需要返工调整。',
      createdBy: '质检小张',
      role: 'QUALITY',
      createdAt: hoursAgo(i * 24 + 18),
    });
  }
  return remarks;
});

export const mockAuditLogs: AuditLog[] = mockOrders.slice(0, 15).flatMap((order, i) => {
  const logs: AuditLog[] = [];
  logs.push({
    id: `log-${i * 5 + 1}`,
    orderId: order.id,
    action: '创建订单',
    oldStatus: undefined,
    newStatus: 'PENDING',
    operator: '客服小王',
    role: 'CUSTOMER_SERVICE',
    createdAt: hoursAgo(i * 24),
    detail: `创建订单 ${order.orderNo}，客户：${order.customerName}`,
  });

  if (order.status !== 'PENDING') {
    logs.push({
      id: `log-${i * 5 + 2}`,
      orderId: order.id,
      action: '上传扫描文件',
      oldStatus: 'PENDING',
      newStatus: 'SCAN_UPLOADED',
      operator: '客服小王',
      role: 'CUSTOMER_SERVICE',
      createdAt: hoursAgo(i * 24 + 2),
      detail: `上传扫描文件：${order.orderNo}_${order.customerName}_口扫.stl`,
    });
  }

  if (order.status === 'PROCESSING' || order.status === 'ASSIGNED' ||
      order.status === 'IN_PRODUCTION' || order.status === 'PENDING_INSPECTION' ||
      order.status === 'COMPLETED' || order.status === 'REWORK') {
    logs.push({
      id: `log-${i * 5 + 3}`,
      orderId: order.id,
      action: '开始处理扫描',
      oldStatus: 'SCAN_UPLOADED',
      newStatus: 'PROCESSING',
      operator: '设计师老李',
      role: 'DESIGNER',
      createdAt: hoursAgo(i * 24 + 4),
      detail: '设计师开始处理扫描文件',
    });
  }

  if (order.status === 'ASSIGNED' || order.status === 'IN_PRODUCTION' ||
      order.status === 'PENDING_INSPECTION' || order.status === 'COMPLETED' ||
      order.status === 'REWORK') {
    const tech = mockTechnicians[i % mockTechnicians.length];
    logs.push({
      id: `log-${i * 5 + 4}`,
      orderId: order.id,
      action: '派单给技师',
      oldStatus: 'PROCESSING',
      newStatus: 'ASSIGNED',
      operator: '设计师老李',
      role: 'DESIGNER',
      createdAt: hoursAgo(i * 24 + 8),
      detail: `派单给技师：${tech.name}（${tech.specialty}）`,
    });
  }

  if (order.status === 'IN_PRODUCTION' || order.status === 'PENDING_INSPECTION' ||
      order.status === 'COMPLETED' || order.status === 'REWORK') {
    logs.push({
      id: `log-${i * 5 + 5}`,
      orderId: order.id,
      action: '技师确认生产',
      oldStatus: 'ASSIGNED',
      newStatus: 'IN_PRODUCTION',
      operator: mockTechnicians[i % mockTechnicians.length].name,
      role: 'ADMIN',
      createdAt: hoursAgo(i * 24 + 10),
      detail: '技师已确认接单，开始生产',
    });
  }

  if (order.status === 'PENDING_INSPECTION' || order.status === 'COMPLETED' ||
      order.status === 'REWORK') {
    logs.push({
      id: `log-${i * 5 + 6}`,
      orderId: order.id,
      action: '生产完成待质检',
      oldStatus: 'IN_PRODUCTION',
      newStatus: 'PENDING_INSPECTION',
      operator: '系统',
      role: 'ADMIN',
      createdAt: hoursAgo(i * 24 + 16),
      detail: '生产已完成，提交质检',
    });
  }

  if (order.status === 'COMPLETED') {
    logs.push({
      id: `log-${i * 5 + 7}`,
      orderId: order.id,
      action: '质检通过',
      oldStatus: 'PENDING_INSPECTION',
      newStatus: 'COMPLETED',
      operator: '质检小张',
      role: 'QUALITY',
      createdAt: hoursAgo(i * 24 + 20),
      detail: '质检合格，色泽匹配良好，边缘密合',
    });
  }

  if (order.status === 'REWORK') {
    logs.push({
      id: `log-${i * 5 + 7}`,
      orderId: order.id,
      action: '质检不合格，发起返工',
      oldStatus: 'PENDING_INSPECTION',
      newStatus: 'REWORK',
      operator: '质检小张',
      role: 'QUALITY',
      createdAt: hoursAgo(i * 24 + 20),
      detail: '色号偏差，需要返工调整，已自动回退至设计师环节',
    });
  }

  return logs;
});

export const INTEGRATION_POINTS = [
  {
    id: 'int-1',
    name: '口扫设备对接',
    description: '直接从口扫设备获取扫描文件，无需手动上传',
    targetSystem: '口扫设备软件 API（如 3Shape、iTero）',
    status: 'pending',
    priority: 'high',
  },
  {
    id: 'int-2',
    name: '微信消息推送',
    description: '派单/状态变更自动推送至技师微信群，实时通知',
    targetSystem: '企业微信 API / 微信小程序',
    status: 'pending',
    priority: 'high',
  },
  {
    id: 'int-3',
    name: 'ERP 系统对接',
    description: '订单同步至 ERP 进行生产计划管理和物料需求计算',
    targetSystem: '现有 ERP 系统',
    status: 'pending',
    priority: 'medium',
  },
  {
    id: 'int-4',
    name: '财务系统对接',
    description: '订单完成后自动生成应收账单，减少人工录入',
    targetSystem: '财务系统（如用友、金蝶）',
    status: 'pending',
    priority: 'medium',
  },
  {
    id: 'int-5',
    name: '短信通知',
    description: '交付日期临近自动提醒客户，提升客户体验',
    targetSystem: '短信服务 API（如阿里云短信）',
    status: 'pending',
    priority: 'low',
  },
  {
    id: 'int-6',
    name: '云文件存储',
    description: '扫描文件云存储，支持多终端访问和版本管理',
    targetSystem: '阿里云 OSS / AWS S3',
    status: 'pending',
    priority: 'high',
  },
];
