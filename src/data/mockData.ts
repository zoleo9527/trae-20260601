import { PurchaseOrder, User } from '../types'

export const mockUsers: User[] = [
  { id: 'u1', name: '张管理', role: 'admin' },
  { id: 'u2', name: '李采购', role: 'purchaser' },
  { id: 'u3', name: '王老师', role: 'teacher' },
]

export const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: 'po1',
    orderNo: 'CG20260606001',
    supplierName: '绿源蔬菜配送有限公司',
    deliveryTime: '2026-06-06 07:30:00',
    expectedDeliveryTime: '2026-06-06 08:00:00',
    items: [
      { id: 'item1', name: '大白菜', quantity: 50, unit: 'kg', specification: '一级', price: 3.5, batchNumber: 'B2026060501', productionDate: '2026-06-05', expiryDate: '2026-06-08' },
      { id: 'item2', name: '西红柿', quantity: 30, unit: 'kg', specification: '一级', price: 5.2, batchNumber: 'B2026060502', productionDate: '2026-06-05', expiryDate: '2026-06-09' },
      { id: 'item3', name: '黄瓜', quantity: 25, unit: 'kg', specification: '一级', price: 4.8, batchNumber: 'B2026060503', productionDate: '2026-06-05', expiryDate: '2026-06-08' },
    ],
    totalAmount: 481,
    purchaserId: 'u2',
    purchaserName: '李采购',
    status: 'sample_completed',
    acceptanceRecords: [
      {
        id: 'ar1',
        purchaseId: 'po1',
        operatorId: 'u1',
        operatorName: '张管理',
        action: 'accept',
        remark: '菜品新鲜，数量准确，验收通过',
        timestamp: '2026-06-06 07:45:00'
      }
    ],
    sampleRecord: {
      id: 'sr1',
      purchaseId: 'po1',
      operatorId: 'u1',
      operatorName: '张管理',
      sampleTime: '2026-06-06 08:00:00',
      sampleQuantity: '各200g',
      storageLocation: '食堂冷藏留样柜A区',
      temperature: '4°C',
      remark: '按规范留样，班主任王老师确认',
      status: 'completed',
      attachments: [
        { id: 'att1', name: '留样照片.jpg', type: 'image', url: '#', uploadTime: '2026-06-06 08:05:00', uploaderId: 'u1' }
      ]
    },
    exceptions: [],
    createdAt: '2026-06-05 16:30:00',
    updatedAt: '2026-06-06 08:10:00'
  },
  {
    id: 'po2',
    orderNo: 'CG20260606002',
    supplierName: '鲜肉直供合作社',
    deliveryTime: '2026-06-06 07:00:00',
    expectedDeliveryTime: '2026-06-06 07:30:00',
    items: [
      { id: 'item4', name: '猪五花肉', quantity: 20, unit: 'kg', specification: '冷鲜', price: 32, batchNumber: 'P2026060601', productionDate: '2026-06-06', expiryDate: '2026-06-07' },
      { id: 'item5', name: '猪瘦肉', quantity: 15, unit: 'kg', specification: '冷鲜', price: 35, batchNumber: 'P2026060602', productionDate: '2026-06-06', expiryDate: '2026-06-07' },
    ],
    totalAmount: 1165,
    purchaserId: 'u2',
    purchaserName: '李采购',
    status: 'supplementing',
    acceptanceRecords: [
      {
        id: 'ar2',
        purchaseId: 'po2',
        operatorId: 'u1',
        operatorName: '张管理',
        action: 'supplement',
        remark: '缺少检疫合格证明，请补充上传',
        timestamp: '2026-06-06 07:20:00'
      }
    ],
    exceptions: [
      {
        id: 'ex1',
        purchaseId: 'po2',
        type: 'supplement',
        initiatorId: 'u1',
        initiatorName: '张管理',
        handlerId: 'u2',
        handlerName: '李采购',
        description: '验收时发现缺少动物检疫合格证明文件，需补充上传后重新提交验收',
        status: 'processing',
        createdAt: '2026-06-06 07:20:00',
        comments: [
          {
            id: 'ec1',
            userId: 'u2',
            userName: '李采购',
            content: '已联系供应商，正在索要电子版本检疫证明，预计10分钟内上传',
            timestamp: '2026-06-06 07:25:00'
          }
        ]
      }
    ],
    currentHandlerId: 'u2',
    currentHandlerName: '李采购',
    deadline: '2026-06-06 09:00:00',
    createdAt: '2026-06-05 17:00:00',
    updatedAt: '2026-06-06 07:25:00'
  },
  {
    id: 'po3',
    orderNo: 'CG20260605003',
    supplierName: '鸡蛋直销基地',
    deliveryTime: '2026-06-05 08:00:00',
    expectedDeliveryTime: '2026-06-05 08:30:00',
    items: [
      { id: 'item6', name: '鲜鸡蛋', quantity: 200, unit: '斤', specification: '普通', price: 5.5, batchNumber: 'E2026060401', productionDate: '2026-06-04', expiryDate: '2026-06-14' },
    ],
    totalAmount: 1100,
    purchaserId: 'u2',
    purchaserName: '李采购',
    status: 'overdue',
    acceptanceRecords: [],
    exceptions: [
      {
        id: 'ex2',
        purchaseId: 'po3',
        type: 'overdue',
        initiatorId: 'u1',
        initiatorName: '张管理',
        handlerId: 'u2',
        handlerName: '李采购',
        description: '该批次鸡蛋已超过验收处理时限，供应商昨天配送后未及时安排验收，现在鸡蛋是否还可使用存疑',
        status: 'pending',
        createdAt: '2026-06-06 06:00:00'
      }
    ],
    currentHandlerId: 'u1',
    currentHandlerName: '张管理',
    deadline: '2026-06-05 12:00:00',
    remark: '昨天配送后食堂太忙，忘记安排验收',
    createdAt: '2026-06-04 15:00:00',
    updatedAt: '2026-06-06 06:00:00'
  },
  {
    id: 'po4',
    orderNo: 'CG20260605004',
    supplierName: '大海水产批发',
    deliveryTime: '2026-06-05 09:00:00',
    expectedDeliveryTime: '2026-06-05 09:30:00',
    items: [
      { id: 'item7', name: '带鱼', quantity: 30, unit: 'kg', specification: '冷冻', price: 28, batchNumber: 'F2026060301', productionDate: '2026-06-03', expiryDate: '2026-09-03' },
    ],
    totalAmount: 840,
    purchaserId: 'u2',
    purchaserName: '李采购',
    status: 'dispute',
    acceptanceRecords: [
      {
        id: 'ar3',
        purchaseId: 'po4',
        operatorId: 'u1',
        operatorName: '张管理',
        action: 'reject',
        remark: '部分带鱼解冻后发现不新鲜，怀疑反复冻融',
        timestamp: '2026-06-05 09:45:00'
      }
    ],
    exceptions: [
      {
        id: 'ex3',
        purchaseId: 'po4',
        type: 'dispute',
        initiatorId: 'u2',
        initiatorName: '李采购',
        handlerId: 'u1',
        handlerName: '张管理',
        description: '采购员认为带鱼质量合格，是正常冷冻状态，反复冻融的说法不成立。双方存在争议，需班主任介入确认。',
        status: 'processing',
        createdAt: '2026-06-05 10:30:00',
        comments: [
          {
            id: 'ec2',
            userId: 'u2',
            userName: '李采购',
            content: '这批带鱼是今天凌晨刚从冷库拉出来的，绝对没有反复冻融，外包装完好无破损',
            timestamp: '2026-06-05 10:30:00',
            attachments: [
              { id: 'att2', name: '外包装照片.jpg', type: 'image', url: '#', uploadTime: '2026-06-05 10:32:00', uploaderId: 'u2' }
            ]
          },
          {
            id: 'ec3',
            userId: 'u1',
            userName: '张管理',
            content: '化冻后肉质松软，没有新鲜带鱼的弹性，我坚持认为有问题',
            timestamp: '2026-06-05 11:00:00'
          },
          {
            id: 'ec4',
            userId: 'u3',
            userName: '王老师',
            content: '我已收到争议通知，今天下午会到现场查看确认',
            timestamp: '2026-06-05 14:00:00'
          }
        ]
      }
    ],
    currentHandlerId: 'u3',
    currentHandlerName: '王老师',
    deadline: '2026-06-06 12:00:00',
    createdAt: '2026-06-04 16:00:00',
    updatedAt: '2026-06-05 14:00:00'
  },
  {
    id: 'po5',
    orderNo: 'CG20260606005',
    supplierName: '五谷丰粮油配送',
    deliveryTime: '2026-06-06 08:30:00',
    expectedDeliveryTime: '2026-06-06 09:00:00',
    items: [
      { id: 'item8', name: '大米', quantity: 100, unit: 'kg', specification: '东北大米', price: 5.8, batchNumber: 'R2026052001', productionDate: '2026-05-20', expiryDate: '2026-11-20' },
      { id: 'item9', name: '食用油', quantity: 10, unit: '桶', specification: '5L装', price: 85, batchNumber: 'O2026051501', productionDate: '2026-05-15', expiryDate: '2027-05-15' },
    ],
    totalAmount: 1430,
    purchaserId: 'u2',
    purchaserName: '李采购',
    status: 'sample_pending',
    acceptanceRecords: [
      {
        id: 'ar4',
        purchaseId: 'po5',
        operatorId: 'u1',
        operatorName: '张管理',
        action: 'accept',
        remark: '验收通过，需进行留样登记',
        timestamp: '2026-06-06 08:45:00'
      }
    ],
    exceptions: [],
    currentHandlerId: 'u1',
    currentHandlerName: '张管理',
    createdAt: '2026-06-05 18:00:00',
    updatedAt: '2026-06-06 08:45:00'
  },
  {
    id: 'po6',
    orderNo: 'CG20260606006',
    supplierName: '绿源蔬菜配送有限公司',
    deliveryTime: '2026-06-06 09:00:00',
    expectedDeliveryTime: '2026-06-06 09:30:00',
    items: [
      { id: 'item10', name: '土豆', quantity: 40, unit: 'kg', specification: '一级', price: 2.8, batchNumber: 'B2026060601', productionDate: '2026-06-05', expiryDate: '2026-06-20' },
      { id: 'item11', name: '青椒', quantity: 20, unit: 'kg', specification: '一级', price: 6.5, batchNumber: 'B2026060602', productionDate: '2026-06-05', expiryDate: '2026-06-10' },
    ],
    totalAmount: 242,
    purchaserId: 'u2',
    purchaserName: '李采购',
    status: 'pending_acceptance',
    acceptanceRecords: [],
    exceptions: [],
    currentHandlerId: 'u1',
    currentHandlerName: '张管理',
    deadline: '2026-06-06 10:30:00',
    createdAt: '2026-06-05 19:00:00',
    updatedAt: '2026-06-06 08:55:00'
  }
]
