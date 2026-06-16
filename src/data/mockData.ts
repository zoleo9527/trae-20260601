import type { Order, Measurement, FittingRecord, Adjustment, FollowUpRecord } from '@/types';

export const mockOrders: Order[] = [
  {
    id: 'ORD-2024-001',
    customerName: '张先生',
    productType: 'suit',
    status: 'adjusting',
    createdAt: '2024-01-15',
    expectedDelivery: '2024-02-15',
    assignee: '李版师',
    priority: 'high',
    pickupStatus: 'scheduled',
    originalPickupDate: '2024-02-15',
  },
  {
    id: 'ORD-2024-002',
    customerName: '王女士',
    productType: 'wedding-dress',
    status: 'adjusting',
    createdAt: '2024-01-10',
    expectedDelivery: '2024-02-10',
    assignee: '陈版师',
    priority: 'high',
    pickupStatus: 'scheduled',
    originalPickupDate: '2024-02-10',
  },
  {
    id: 'ORD-2024-003',
    customerName: '刘先生',
    productType: 'suit',
    status: 'fitting',
    createdAt: '2024-01-18',
    expectedDelivery: '2024-02-18',
    assignee: '张量体师',
    priority: 'medium',
    pickupStatus: 'scheduled',
    originalPickupDate: '2024-02-18',
  },
  {
    id: 'ORD-2024-004',
    customerName: '赵女士',
    productType: 'custom',
    status: 'pending',
    createdAt: '2024-01-20',
    expectedDelivery: '2024-02-20',
    assignee: '李客服',
    priority: 'low',
    pickupStatus: 'scheduled',
    originalPickupDate: '2024-02-20',
  },
  {
    id: 'ORD-2024-005',
    customerName: '孙先生',
    productType: 'suit',
    status: 'completed',
    createdAt: '2024-01-05',
    expectedDelivery: '2024-02-05',
    assignee: '王版师',
    priority: 'medium',
    pickupStatus: 'picked-up',
    originalPickupDate: '2024-02-05',
  },
  {
    id: 'ORD-2024-006',
    customerName: '周女士',
    productType: 'wedding-dress',
    status: 'fitting',
    createdAt: '2024-01-12',
    expectedDelivery: '2024-02-12',
    assignee: '吴量体师',
    priority: 'high',
    pickupStatus: 'delayed',
    originalPickupDate: '2024-02-12',
    newPickupDate: '2024-02-18',
    delayReason: '客户出差在外，无法按时取件',
  },
  {
    id: 'ORD-2024-007',
    customerName: '郑先生',
    productType: 'suit',
    status: 'completed',
    createdAt: '2024-01-08',
    expectedDelivery: '2024-02-08',
    assignee: '李版师',
    priority: 'medium',
    pickupStatus: 'delayed',
    originalPickupDate: '2024-02-08',
    newPickupDate: '2024-02-22',
    delayReason: '家中有事，申请延期取件',
  },
];

export const mockMeasurements: Measurement[] = [
  {
    id: 'MEAS-001',
    orderId: 'ORD-2024-001',
    shoulderWidth: 44,
    chest: 96,
    waist: 80,
    hip: 92,
    sleeveLength: 62,
    pantsLength: 105,
    note: '左肩略低，建议调整肩型',
  },
  {
    id: 'MEAS-002',
    orderId: 'ORD-2024-002',
    shoulderWidth: 38,
    chest: 86,
    waist: 68,
    hip: 90,
    sleeveLength: 58,
    pantsLength: 0,
    note: '婚纱款式，无裤长',
  },
  {
    id: 'MEAS-003',
    orderId: 'ORD-2024-003',
    shoulderWidth: 42,
    chest: 92,
    waist: 76,
    hip: 90,
    sleeveLength: 60,
    pantsLength: 102,
    note: '标准体型',
  },
  {
    id: 'MEAS-004',
    orderId: 'ORD-2024-004',
    shoulderWidth: 40,
    chest: 88,
    waist: 72,
    hip: 88,
    sleeveLength: 59,
    pantsLength: 98,
    note: '定制礼服',
  },
  {
    id: 'MEAS-005',
    orderId: 'ORD-2024-005',
    shoulderWidth: 43,
    chest: 94,
    waist: 78,
    hip: 91,
    sleeveLength: 61,
    pantsLength: 104,
    note: '已完成交付',
  },
  {
    id: 'MEAS-006',
    orderId: 'ORD-2024-006',
    shoulderWidth: 36,
    chest: 82,
    waist: 64,
    hip: 86,
    sleeveLength: 56,
    pantsLength: 0,
    note: '婚纱，高腰设计',
  },
];

export const mockFittingRecords: FittingRecord[] = [
  {
    id: 'FIT-001',
    orderId: 'ORD-2024-001',
    fittingDate: '2024-02-01',
    issues: '肩宽偏大，左右肩不平衡，左袖长偏长1cm',
    measurerName: '张量体师',
    result: 'needs-adjustment',
  },
  {
    id: 'FIT-002',
    orderId: 'ORD-2024-002',
    fittingDate: '2024-02-03',
    issues: '腰围偏大3cm，裙摆拖地需要缩短',
    measurerName: '吴量体师',
    result: 'needs-adjustment',
  },
  {
    id: 'FIT-003',
    orderId: 'ORD-2024-003',
    fittingDate: '2024-02-05',
    issues: '初次试穿，整体版型良好，裤脚略长',
    measurerName: '张量体师',
    result: 'needs-adjustment',
  },
  {
    id: 'FIT-004',
    orderId: 'ORD-2024-006',
    fittingDate: '2024-02-04',
    issues: '婚纱整体合身，胸前装饰需要微调',
    measurerName: '吴量体师',
    result: 'needs-adjustment',
  },
  {
    id: 'FIT-005',
    orderId: 'ORD-2024-005',
    fittingDate: '2024-02-01',
    issues: '试穿通过，客户满意',
    measurerName: '王量体师',
    result: 'passed',
  },
];

export const mockAdjustments: Adjustment[] = [
  {
    id: 'ADJ-001',
    orderId: 'ORD-2024-001',
    type: 'free',
    description: '肩宽收窄1.5cm，左肩垫高0.5cm，左袖缩短1cm',
    cost: 0,
    responsible: '李版师',
    targetDate: '2024-02-10',
    status: 'in-progress',
  },
  {
    id: 'ADJ-002',
    orderId: 'ORD-2024-002',
    type: 'free',
    description: '腰围收3cm，裙摆缩短5cm',
    cost: 0,
    responsible: '陈版师',
    targetDate: '2024-02-08',
    status: 'in-progress',
  },
  {
    id: 'ADJ-003',
    orderId: 'ORD-2024-003',
    type: 'size-change',
    description: '客户体重下降，需要整体改小一号',
    cost: 500,
    responsible: '李版师',
    targetDate: '2024-02-12',
    status: 'pending',
  },
  {
    id: 'ADJ-004',
    orderId: 'ORD-2024-006',
    type: 'paid',
    description: '客户要求增加珍珠装饰，属于额外定制',
    cost: 300,
    responsible: '陈版师',
    targetDate: '2024-02-09',
    status: 'pending',
  },
  {
    id: 'ADJ-005',
    orderId: 'ORD-2024-005',
    type: 'free',
    description: '裤脚改短2cm',
    cost: 0,
    responsible: '王版师',
    targetDate: '2024-02-03',
    status: 'completed',
    adjustedBy: '王版师',
    adjustedAt: '2024-02-03',
  },
];

export const mockFollowUpRecords: FollowUpRecord[] = [
  {
    id: 'FU-001',
    orderId: 'ORD-2024-006',
    followUpDate: '2024-02-10',
    follower: '李客服',
    note: '客户来电说明出差情况，无法按时取件，申请延期',
    action: '已确认延期申请，新取件时间定为2024-02-18',
  },
  {
    id: 'FU-002',
    orderId: 'ORD-2024-006',
    followUpDate: '2024-02-11',
    follower: '李客服',
    note: '再次致电确认取件时间，客户确认2月18日下午3点取件',
    action: '已记录取件时间，届时提前一天再次提醒',
  },
  {
    id: 'FU-003',
    orderId: 'ORD-2024-007',
    followUpDate: '2024-02-06',
    follower: '王客服',
    note: '客户微信联系，家中突发急事，希望延期取件',
    action: '同意延期申请，约定新取件时间为2024-02-22',
  },
  {
    id: 'FU-004',
    orderId: 'ORD-2024-007',
    followUpDate: '2024-02-08',
    follower: '王客服',
    note: '发送短信确认延期信息，客户已回复确认',
    action: '取件时间已更新至系统，等待客户取件',
  },
];

export const getOrders = (): Promise<Order[]> => {
  return new Promise((resolve) => setTimeout(() => resolve(mockOrders), 500));
};

export const getOrderById = (id: string): Promise<Order | undefined> => {
  return new Promise((resolve) => 
    setTimeout(() => resolve(mockOrders.find(o => o.id === id)), 500)
  );
};

export const getMeasurementsByOrderId = (orderId: string): Promise<Measurement[]> => {
  return new Promise((resolve) => 
    setTimeout(() => resolve(mockMeasurements.filter(m => m.orderId === orderId)), 500)
  );
};

export const getFittingRecordsByOrderId = (orderId: string): Promise<FittingRecord[]> => {
  return new Promise((resolve) => 
    setTimeout(() => resolve(mockFittingRecords.filter(f => f.orderId === orderId)), 500)
  );
};

export const getAdjustmentsByOrderId = (orderId: string): Promise<Adjustment[]> => {
  return new Promise((resolve) => 
    setTimeout(() => resolve(mockAdjustments.filter(a => a.orderId === orderId)), 500)
  );
};

export const getFollowUpRecordsByOrderId = (orderId: string): Promise<FollowUpRecord[]> => {
  return new Promise((resolve) => 
    setTimeout(() => resolve(mockFollowUpRecords.filter(f => f.orderId === orderId)), 500)
  );
};

export const updateAdjustmentStatus = (
  adjustmentId: string,
  status: Adjustment['status']
): Promise<Adjustment | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const adj = mockAdjustments.find(a => a.id === adjustmentId);
      if (adj) {
        adj.status = status;
        if (status === 'completed') {
          adj.adjustedBy = adj.responsible;
          adj.adjustedAt = new Date().toISOString().split('T')[0];
        }
      }
      resolve(adj);
    }, 500);
  });
};
