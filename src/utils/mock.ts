import { Order, OrderHistory, ReworkRecord, ColorConfirm, User } from '@/types';

export const DEMO_USERS: User[] = [
  {
    id: 'cs-1',
    name: '张小姐',
    role: 'customer_service',
    avatar: '👩‍💼'
  },
  {
    id: 'ds-1',
    name: '李工',
    role: 'designer',
    avatar: '👨‍💻'
  },
  {
    id: 'in-1',
    name: '王质检',
    role: 'inspector',
    avatar: '🔍'
  }
];

const now = new Date();

export const MOCK_ORDERS: Order[] = [
  {
    id: 'order-1',
    orderNo: 'YC20260601001',
    patientName: '张明',
    clinic: '阳光口腔诊所',
    status: 'color_confirmed',
    shade: 'A2',
    deliveryDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    reworkCount: 0,
    modelReceived: true,
    currentHandler: '李工',
    createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'order-2',
    orderNo: 'YC20260601002',
    patientName: '李华',
    clinic: '美佳口腔医院',
    status: 'rework',
    shade: 'B1',
    deliveryDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    reworkCount: 1,
    modelReceived: true,
    currentHandler: '李工',
    createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now.getTime() - 0.5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'order-3',
    orderNo: 'YC20260601003',
    patientName: '王芳',
    clinic: '康泰牙科',
    status: 'pending',
    deliveryDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    reworkCount: 0,
    modelReceived: false,
    currentHandler: '张小姐',
    createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'order-4',
    orderNo: 'YC20260601004',
    patientName: '赵强',
    clinic: '仁和口腔',
    status: 'quality_check',
    shade: 'A3',
    deliveryDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    reworkCount: 0,
    modelReceived: true,
    currentHandler: '王质检',
    createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'order-5',
    orderNo: 'YC20260601005',
    patientName: '刘洋',
    clinic: '博瑞牙科中心',
    status: 'in_production',
    shade: 'C2',
    deliveryDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    reworkCount: 0,
    modelReceived: true,
    currentHandler: '李工',
    createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'order-6',
    orderNo: 'YC20260601006',
    patientName: '陈静',
    clinic: '优齿口腔',
    status: 'completed',
    shade: 'D3',
    deliveryDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    reworkCount: 2,
    modelReceived: true,
    currentHandler: '张小姐',
    createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const MOCK_HISTORY: OrderHistory[] = [
  {
    id: 'h-1',
    orderId: 'order-1',
    action: '创建订单',
    operator: '张小姐',
    operatorRole: 'customer_service',
    remark: '患者信息已确认',
    createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'h-2',
    orderId: 'order-1',
    action: '模型已接收',
    operator: '李工',
    operatorRole: 'designer',
    remark: '口扫文件完整',
    createdAt: new Date(now.getTime() - 2.5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'h-3',
    orderId: 'order-1',
    action: '色号确认',
    operator: '李工',
    operatorRole: 'designer',
    remark: '确认色号 A2，与临床照片比对一致',
    createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'h-4',
    orderId: 'order-2',
    action: '创建订单',
    operator: '张小姐',
    operatorRole: 'customer_service',
    createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'h-5',
    orderId: 'order-2',
    action: '色号确认',
    operator: '李工',
    operatorRole: 'designer',
    remark: 'B1色号',
    createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'h-6',
    orderId: 'order-2',
    action: '提交返工',
    operator: '王质检',
    operatorRole: 'inspector',
    remark: '色号偏差，需要重新调色',
    createdAt: new Date(now.getTime() - 0.5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'h-7',
    orderId: 'order-3',
    action: '创建订单',
    operator: '张小姐',
    operatorRole: 'customer_service',
    remark: '等待模型接收',
    createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const MOCK_REWORKS: ReworkRecord[] = [
  {
    id: 'rw-1',
    orderId: 'order-2',
    reason: '色号不符',
    description: '试戴后发现色号与临床照片有偏差，颈部略黄',
    applicant: '王质检',
    handler: '李工',
    status: 'processing',
    createdAt: new Date(now.getTime() - 0.5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'rw-2',
    orderId: 'order-6',
    reason: '咬合问题',
    description: '第一次返工：咬合高点',
    applicant: '王质检',
    handler: '李工',
    status: 'resolved',
    createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'rw-3',
    orderId: 'order-6',
    reason: '边缘不密合',
    description: '第二次返工：边缘需要重做',
    applicant: '王质检',
    handler: '李工',
    status: 'resolved',
    createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    resolvedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const MOCK_COLOR_CONFIRMS: ColorConfirm[] = [
  {
    id: 'cc-1',
    orderId: 'order-1',
    shade: 'A2',
    operator: '李工',
    confirmed: true,
    remark: '与临床照片比对一致',
    createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'cc-2',
    orderId: 'order-2',
    shade: 'B1',
    operator: '李工',
    confirmed: true,
    createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'cc-3',
    orderId: 'order-4',
    shade: 'A3',
    operator: '李工',
    confirmed: true,
    createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'cc-4',
    orderId: 'order-5',
    shade: 'C2',
    operator: '李工',
    confirmed: true,
    createdAt: new Date(now.getTime() - 1.5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'cc-5',
    orderId: 'order-6',
    shade: 'D3',
    operator: '李工',
    confirmed: true,
    createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString()
  }
];
