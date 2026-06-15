export const users = [
  { id: '1', username: 'warehouse', password: '123456', role: 'warehouse', name: '仓库主管' },
  { id: '2', username: 'driver', password: '123456', role: 'driver', name: '司机张师傅' },
  { id: '3', username: 'customer', password: '123456', role: 'customer', name: '客服小李' },
];

export const salesOrders = [
  { id: 'SO20240115001', customerName: '万科地产', productName: '水泥', quantity: 50, unit: '吨', status: 'pending' },
  { id: 'SO20240115002', customerName: '恒大建设', productName: '钢筋', quantity: 30, unit: '吨', status: 'pending' },
  { id: 'SO20240115003', customerName: '碧桂园', productName: '砂石', quantity: 100, unit: '吨', status: 'pending' },
  { id: 'SO20240114001', customerName: '融创集团', productName: '砖块', quantity: 5000, unit: '块', status: 'delivered' },
  { id: 'SO20240114002', customerName: '保利地产', productName: '涂料', quantity: 200, unit: '桶', status: 'damaged' },
];

export const deliveryRecords = [
  {
    id: 'DR20240115001',
    salesOrderId: 'SO20240115001',
    driverId: '2',
    warehouseId: '1',
    status: 'pending',
    deliveryAddress: '北京市朝阳区望京SOHO',
    plannedTime: '2024-01-15 09:00',
    createdAt: '2024-01-15 08:00',
  },
  {
    id: 'DR20240115002',
    salesOrderId: 'SO20240115002',
    driverId: '2',
    warehouseId: '1',
    status: 'pending',
    deliveryAddress: '上海市浦东新区陆家嘴',
    plannedTime: '2024-01-15 14:00',
    createdAt: '2024-01-15 08:30',
  },
  {
    id: 'DR20240115003',
    salesOrderId: 'SO20240115003',
    driverId: '2',
    warehouseId: '1',
    status: 'in_transit',
    deliveryAddress: '广州市天河区珠江新城',
    plannedTime: '2024-01-15 16:00',
    createdAt: '2024-01-15 09:00',
    dispatchedAt: '2024-01-15 10:00',
  },
  {
    id: 'DR20240114001',
    salesOrderId: 'SO20240114001',
    driverId: '2',
    warehouseId: '1',
    status: 'signed',
    deliveryAddress: '深圳市南山区科技园',
    plannedTime: '2024-01-14 10:00',
    createdAt: '2024-01-14 08:00',
    dispatchedAt: '2024-01-14 08:30',
    signedAt: '2024-01-14 11:30',
    signerName: '王经理',
    signerPhone: '13800138001',
  },
  {
    id: 'DR20240114002',
    salesOrderId: 'SO20240114002',
    driverId: '2',
    warehouseId: '1',
    status: 'damaged',
    deliveryAddress: '杭州市西湖区文三路',
    plannedTime: '2024-01-14 14:00',
    createdAt: '2024-01-14 10:00',
    dispatchedAt: '2024-01-14 11:00',
    signedAt: '2024-01-14 15:30',
    signerName: '李工',
    signerPhone: '13900139002',
  },
];

export const damageRecords = [
  {
    id: 'DM20240114001',
    deliveryRecordId: 'DR20240114002',
    salesOrderId: 'SO20240114002',
    reporterId: '2',
    status: 'pending',
    damageType: 'package_damage',
    damageDescription: '第3桶涂料外包装破损，内部涂料泄漏约10%',
    damageQuantity: 1,
    photos: ['photo1.jpg', 'photo2.jpg'],
    reportedAt: '2024-01-14 15:35',
    createdAt: '2024-01-14 15:35',
    history: [
      { action: 'reported', user: '司机张师傅', time: '2024-01-14 15:35', remark: '现场发现涂料泄漏，已拍照留存' },
      { action: 'reviewed', user: '仓库主管', time: '2024-01-14 16:00', remark: '已确认照片，等待客服处理' },
    ],
  },
  {
    id: 'DM20240113001',
    deliveryRecordId: 'DR20240113001',
    salesOrderId: 'SO20240113001',
    reporterId: '2',
    status: 'processing',
    damageType: 'quantity_shortage',
    damageDescription: '钢筋到货数量短缺2吨',
    damageQuantity: 2,
    photos: ['photo3.jpg'],
    reportedAt: '2024-01-13 11:00',
    createdAt: '2024-01-13 11:00',
    history: [
      { action: 'reported', user: '司机张师傅', time: '2024-01-13 11:00', remark: '收货方称重发现短缺' },
      { action: 'reviewed', user: '仓库主管', time: '2024-01-13 11:30', remark: '正在核对出库记录' },
      { action: 'assigned', user: '仓库主管', time: '2024-01-13 11:45', remark: '已转客服跟进处理' },
    ],
  },
  {
    id: 'DM20240112001',
    deliveryRecordId: 'DR20240112001',
    salesOrderId: 'SO20240112001',
    reporterId: '2',
    status: 'resolved',
    damageType: 'product_damage',
    damageDescription: '砖块运输途中破损50块',
    damageQuantity: 50,
    photos: ['photo4.jpg', 'photo5.jpg', 'photo6.jpg'],
    reportedAt: '2024-01-12 09:00',
    createdAt: '2024-01-12 09:00',
    resolvedAt: '2024-01-12 17:00',
    history: [
      { action: 'reported', user: '司机张师傅', time: '2024-01-12 09:00', remark: '送货时发现砖块破损' },
      { action: 'reviewed', user: '仓库主管', time: '2024-01-12 09:30', remark: '确认破损情况属实' },
      { action: 'assigned', user: '仓库主管', time: '2024-01-12 10:00', remark: '转客服处理补发' },
      { action: 'contacted', user: '客服小李', time: '2024-01-12 10:30', remark: '已联系客户，客户同意补发' },
      { action: 'resolved', user: '客服小李', time: '2024-01-12 17:00', remark: '补发已安排，客户确认满意' },
    ],
  },
];

export const operationLogs = [
  { id: '1', userId: '2', action: 'dispatch', targetType: 'delivery', targetId: 'DR20240115003', time: '2024-01-15 10:00', remark: '出库配送' },
  { id: '2', userId: '2', action: 'sign', targetType: 'delivery', targetId: 'DR20240114001', time: '2024-01-14 11:30', remark: '客户签收' },
  { id: '3', userId: '2', action: 'report_damage', targetType: 'damage', targetId: 'DM20240114001', time: '2024-01-14 15:35', remark: '上报破损' },
  { id: '4', userId: '1', action: 'review_damage', targetType: 'damage', targetId: 'DM20240114001', time: '2024-01-14 16:00', remark: '审核破损记录' },
  { id: '5', userId: '3', action: 'contact_customer', targetType: 'damage', targetId: 'DM20240113001', time: '2024-01-13 14:00', remark: '联系客户沟通解决方案' },
];

export const damageTypes = [
  { value: 'package_damage', label: '包装破损' },
  { value: 'product_damage', label: '产品损坏' },
  { value: 'quantity_shortage', label: '数量短缺' },
  { value: 'other', label: '其他' },
];

export const deliveryStatusMap = {
  pending: '待出库',
  in_transit: '运输中',
  signed: '已签收',
  damaged: '有破损',
};

export const damageStatusMap = {
  pending: '待审核',
  processing: '处理中',
  resolved: '已解决',
};
