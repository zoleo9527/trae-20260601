import { v4 as uuidv4 } from 'uuid'

const now = new Date()
const formatDate = (d) => d.toISOString().replace('T', ' ').substring(0, 19)

const hoursAgo = (h) => {
  const d = new Date(now.getTime() - h * 60 * 60 * 1000)
  return formatDate(d)
}

const hoursLater = (h) => {
  const d = new Date(now.getTime() + h * 60 * 60 * 1000)
  return formatDate(d)
}

function createProcessSteps(status) {
  const steps = [
    { key: 'purchase_created', label: '采购员下单', role: 'purchaser', status: 'completed', timestamp: hoursAgo(24), operatorName: '李采购' },
    { key: 'acceptance_pending', label: '待管理员验收', role: 'admin', status: 'pending' },
    { key: 'acceptance_completed', label: '验收完成', role: 'admin', status: 'pending' },
    { key: 'supplement_requested', label: '要求补充材料', role: 'admin', status: 'pending' },
    { key: 'supplement_submitted', label: '采购员补录重提', role: 'purchaser', status: 'pending' },
    { key: 'dispute_raised', label: '发起责任争议', role: 'purchaser', status: 'pending' },
    { key: 'dispute_resolved', label: '争议仲裁完成', role: 'teacher', status: 'pending' },
    { key: 'sample_pending', label: '待留样登记', role: 'admin', status: 'pending' },
    { key: 'sample_completed', label: '留样完成', role: 'admin', status: 'pending' },
    { key: 'sample_confirmed', label: '班主任确认', role: 'teacher', status: 'pending' },
    { key: 'completed', label: '流程完成', role: 'admin', status: 'pending' },
  ]

  const markCompleted = (key, timestamp, operatorName, remark) => {
    const step = steps.find(s => s.key === key)
    if (step) {
      step.status = 'completed'
      step.timestamp = timestamp || formatDate(now)
      step.operatorName = operatorName || step.operatorName
      if (remark) step.remark = remark
    }
  }

  const markCurrent = (key) => {
    const step = steps.find(s => s.key === key)
    if (step) step.status = 'current'
  }

  const markError = (key, timestamp, operatorName, remark) => {
    const step = steps.find(s => s.key === key)
    if (step) {
      step.status = 'error'
      if (timestamp) step.timestamp = timestamp
      if (operatorName) step.operatorName = operatorName
      if (remark) step.remark = remark
    }
  }

  switch (status) {
    case 'sample_completed':
      markCompleted('acceptance_pending', hoursAgo(2), '张管理')
      markCompleted('acceptance_completed', hoursAgo(2), '张管理')
      markCompleted('sample_pending', hoursAgo(1.5), '张管理')
      markCompleted('sample_completed', hoursAgo(1), '张管理')
      markCurrent('sample_confirmed')
      break
    case 'supplementing':
      markCompleted('acceptance_pending', hoursAgo(4), '张管理')
      markCompleted('supplement_requested', hoursAgo(3.5), '张管理', '缺少检疫合格证明')
      markCurrent('supplement_submitted')
      break
    case 'rejected':
      markCompleted('acceptance_pending', hoursAgo(5), '张管理')
      markError('acceptance_pending', hoursAgo(5), '张管理', '验收被驳回')
      markCurrent('supplement_submitted')
      break
    case 'supplement_submitted':
      markCompleted('acceptance_pending', hoursAgo(6), '张管理')
      markCompleted('supplement_requested', hoursAgo(5.5), '张管理', '缺少检疫合格证明')
      markCompleted('supplement_submitted', hoursAgo(3), '李采购')
      markCurrent('acceptance_pending')
      break
    case 'overdue':
      markCurrent('acceptance_pending')
      markError('acceptance_pending')
      break
    case 'dispute_pending':
      markCompleted('acceptance_pending', hoursAgo(8), '张管理')
      markError('acceptance_pending', hoursAgo(8), '张管理', '验收被驳回')
      markCompleted('dispute_raised', hoursAgo(7), '李采购', '带鱼质量争议')
      markCurrent('dispute_resolved')
      break
    case 'dispute_processing':
      markCompleted('acceptance_pending', hoursAgo(8), '张管理')
      markError('acceptance_pending', hoursAgo(8), '张管理', '验收被驳回')
      markCompleted('dispute_raised', hoursAgo(7), '李采购', '带鱼质量争议')
      markCurrent('dispute_resolved')
      break
    case 'sample_pending':
      markCompleted('acceptance_pending', hoursAgo(1), '张管理')
      markCompleted('acceptance_completed', hoursAgo(1), '张管理')
      markCurrent('sample_pending')
      break
    case 'sample_confirmed':
      markCompleted('acceptance_pending', hoursAgo(5), '张管理')
      markCompleted('acceptance_completed', hoursAgo(5), '张管理')
      markCompleted('sample_pending', hoursAgo(4.5), '张管理')
      markCompleted('sample_completed', hoursAgo(4), '张管理')
      markCompleted('sample_confirmed', hoursAgo(3), '王老师')
      markCurrent('completed')
      break
    case 'completed':
      markCompleted('acceptance_pending', hoursAgo(10), '张管理')
      markCompleted('acceptance_completed', hoursAgo(10), '张管理')
      markCompleted('sample_pending', hoursAgo(9), '张管理')
      markCompleted('sample_completed', hoursAgo(8), '张管理')
      markCompleted('sample_confirmed', hoursAgo(7), '王老师')
      markCompleted('completed', hoursAgo(6), '张管理')
      break
    case 'pending_acceptance':
    default:
      markCurrent('acceptance_pending')
      break
  }

  return steps
}

export function seedDatabase() {
  const users = [
    { id: 'u1', name: '张管理', role: 'admin' },
    { id: 'u2', name: '李采购', role: 'purchaser' },
    { id: 'u3', name: '王老师', role: 'teacher' },
  ]

  const purchaseOrders = [
    {
      id: uuidv4(),
      orderNo: 'CG20260606001',
      supplierName: '绿源蔬菜配送有限公司',
      deliveryTime: hoursAgo(3),
      expectedDeliveryTime: hoursAgo(2.5),
      items: [
        { id: uuidv4(), name: '大白菜', quantity: 50, unit: 'kg', specification: '一级', price: 3.5, batchNumber: 'B2026060501', productionDate: '2026-06-05', expiryDate: '2026-06-08' },
        { id: uuidv4(), name: '西红柿', quantity: 30, unit: 'kg', specification: '一级', price: 5.2, batchNumber: 'B2026060502', productionDate: '2026-06-05', expiryDate: '2026-06-09' },
        { id: uuidv4(), name: '黄瓜', quantity: 25, unit: 'kg', specification: '一级', price: 4.8, batchNumber: 'B2026060503', productionDate: '2026-06-05', expiryDate: '2026-06-08' },
      ],
      totalAmount: 481,
      purchaserId: 'u2',
      purchaserName: '李采购',
      status: 'sample_completed',
      acceptanceRecords: [
        {
          id: uuidv4(),
          purchaseId: 'po1',
          operatorId: 'u1',
          operatorName: '张管理',
          action: 'accept',
          remark: '菜品新鲜，数量准确，验收通过',
          timestamp: hoursAgo(2)
        }
      ],
      sampleRecord: {
        id: uuidv4(),
        purchaseId: 'po1',
        operatorId: 'u1',
        operatorName: '张管理',
        sampleTime: hoursAgo(1),
        sampleQuantity: '各200g',
        storageLocation: '食堂冷藏留样柜A区',
        temperature: '4°C',
        remark: '按规范留样，待班主任确认',
        status: 'completed',
        attachments: []
      },
      exceptions: [],
      currentHandlerId: 'u3',
      currentHandlerName: '王老师',
      currentHandlerRole: 'teacher',
      resubmitCount: 0,
      processSteps: createProcessSteps('sample_completed'),
      createdAt: hoursAgo(26),
      updatedAt: hoursAgo(1)
    },
    {
      id: uuidv4(),
      orderNo: 'CG20260606002',
      supplierName: '鲜肉直供合作社',
      deliveryTime: hoursAgo(5),
      expectedDeliveryTime: hoursAgo(4.5),
      items: [
        { id: uuidv4(), name: '猪五花肉', quantity: 20, unit: 'kg', specification: '冷鲜', price: 32, batchNumber: 'P2026060601', productionDate: '2026-06-06', expiryDate: '2026-06-07' },
        { id: uuidv4(), name: '猪瘦肉', quantity: 15, unit: 'kg', specification: '冷鲜', price: 35, batchNumber: 'P2026060602', productionDate: '2026-06-06', expiryDate: '2026-06-07' },
      ],
      totalAmount: 1165,
      purchaserId: 'u2',
      purchaserName: '李采购',
      status: 'supplementing',
      acceptanceRecords: [
        {
          id: uuidv4(),
          purchaseId: 'po2',
          operatorId: 'u1',
          operatorName: '张管理',
          action: 'supplement',
          remark: '缺少动物检疫合格证明，请补充上传',
          timestamp: hoursAgo(4)
        }
      ],
      exceptions: [
        {
          id: uuidv4(),
          purchaseId: 'po2',
          type: 'supplement',
          initiatorId: 'u1',
          initiatorName: '张管理',
          handlerId: 'u2',
          handlerName: '李采购',
          description: '验收时发现缺少动物检疫合格证明文件，需补充上传后重新提交验收',
          status: 'processing',
          createdAt: hoursAgo(4),
          comments: [
            {
              id: uuidv4(),
              userId: 'u2',
              userName: '李采购',
              content: '已联系供应商，正在索要电子版本检疫证明，预计10分钟内上传',
              timestamp: hoursAgo(3.8)
            }
          ]
        }
      ],
      currentHandlerId: 'u2',
      currentHandlerName: '李采购',
      currentHandlerRole: 'purchaser',
      deadline: hoursLater(1),
      resubmitCount: 0,
      processSteps: createProcessSteps('supplementing'),
      createdAt: hoursAgo(28),
      updatedAt: hoursAgo(3.8)
    },
    {
      id: uuidv4(),
      orderNo: 'CG20260605003',
      supplierName: '鸡蛋直销基地',
      deliveryTime: hoursAgo(26),
      expectedDeliveryTime: hoursAgo(25.5),
      items: [
        { id: uuidv4(), name: '鲜鸡蛋', quantity: 200, unit: '斤', specification: '普通', price: 5.5, batchNumber: 'E2026060401', productionDate: '2026-06-04', expiryDate: '2026-06-14' },
      ],
      totalAmount: 1100,
      purchaserId: 'u2',
      purchaserName: '李采购',
      status: 'overdue',
      acceptanceRecords: [],
      exceptions: [
        {
          id: uuidv4(),
          purchaseId: 'po3',
          type: 'overdue',
          initiatorId: 'u1',
          initiatorName: '张管理',
          handlerId: 'u1',
          handlerName: '张管理',
          description: '该批次鸡蛋已超过验收处理时限，供应商昨天配送后未及时安排验收，现在鸡蛋是否还可使用存疑',
          status: 'pending',
          createdAt: hoursAgo(2)
        }
      ],
      currentHandlerId: 'u1',
      currentHandlerName: '张管理',
      currentHandlerRole: 'admin',
      deadline: hoursAgo(14),
      remark: '昨天配送后食堂太忙，忘记安排验收',
      resubmitCount: 0,
      processSteps: createProcessSteps('overdue'),
      createdAt: hoursAgo(40),
      updatedAt: hoursAgo(2)
    },
    {
      id: uuidv4(),
      orderNo: 'CG20260605004',
      supplierName: '大海水产批发',
      deliveryTime: hoursAgo(22),
      expectedDeliveryTime: hoursAgo(21.5),
      items: [
        { id: uuidv4(), name: '带鱼', quantity: 30, unit: 'kg', specification: '冷冻', price: 28, batchNumber: 'F2026060301', productionDate: '2026-06-03', expiryDate: '2026-09-03' },
      ],
      totalAmount: 840,
      purchaserId: 'u2',
      purchaserName: '李采购',
      status: 'dispute_processing',
      acceptanceRecords: [
        {
          id: uuidv4(),
          purchaseId: 'po4',
          operatorId: 'u1',
          operatorName: '张管理',
          action: 'reject',
          remark: '部分带鱼解冻后发现不新鲜，怀疑反复冻融',
          timestamp: hoursAgo(21)
        }
      ],
      exceptions: [
        {
          id: uuidv4(),
          purchaseId: 'po4',
          type: 'dispute',
          initiatorId: 'u2',
          initiatorName: '李采购',
          handlerId: 'u3',
          handlerName: '王老师',
          description: '采购员认为带鱼质量合格，是正常冷冻状态，反复冻融的说法不成立。双方存在争议，需班主任介入确认。',
          status: 'processing',
          createdAt: hoursAgo(20),
          comments: [
            {
              id: uuidv4(),
              userId: 'u2',
              userName: '李采购',
              content: '这批带鱼是今天凌晨刚从冷库拉出来的，绝对没有反复冻融，外包装完好无破损',
              timestamp: hoursAgo(20),
              attachments: []
            },
            {
              id: uuidv4(),
              userId: 'u1',
              userName: '张管理',
              content: '化冻后肉质松软，没有新鲜带鱼的弹性，我坚持认为有问题',
              timestamp: hoursAgo(19.5)
            },
            {
              id: uuidv4(),
              userId: 'u3',
              userName: '王老师',
              content: '我已收到争议通知，今天下午会到现场查看确认',
              timestamp: hoursAgo(17)
            }
          ]
        }
      ],
      dispute: {
        id: uuidv4(),
        purchaseId: 'po4',
        raisedById: 'u2',
        raisedByName: '李采购',
        description: '带鱼质量争议：管理员认为反复冻融，采购员认为质量合格',
        status: 'investigating',
        mediatorId: 'u3',
        mediatorName: '王老师',
        createdAt: hoursAgo(20),
        comments: []
      },
      currentHandlerId: 'u3',
      currentHandlerName: '王老师',
      currentHandlerRole: 'teacher',
      deadline: hoursLater(4),
      resubmitCount: 0,
      processSteps: createProcessSteps('dispute_processing'),
      createdAt: hoursAgo(42),
      updatedAt: hoursAgo(17)
    },
    {
      id: uuidv4(),
      orderNo: 'CG20260606005',
      supplierName: '五谷丰粮油配送',
      deliveryTime: hoursAgo(1.5),
      expectedDeliveryTime: hoursAgo(1),
      items: [
        { id: uuidv4(), name: '大米', quantity: 100, unit: 'kg', specification: '东北大米', price: 5.8, batchNumber: 'R2026052001', productionDate: '2026-05-20', expiryDate: '2026-11-20' },
        { id: uuidv4(), name: '食用油', quantity: 10, unit: '桶', specification: '5L装', price: 85, batchNumber: 'O2026051501', productionDate: '2026-05-15', expiryDate: '2027-05-15' },
      ],
      totalAmount: 1430,
      purchaserId: 'u2',
      purchaserName: '李采购',
      status: 'sample_pending',
      acceptanceRecords: [
        {
          id: uuidv4(),
          purchaseId: 'po5',
          operatorId: 'u1',
          operatorName: '张管理',
          action: 'accept',
          remark: '验收通过，需进行留样登记',
          timestamp: hoursAgo(1)
        }
      ],
      exceptions: [],
      currentHandlerId: 'u1',
      currentHandlerName: '张管理',
      currentHandlerRole: 'admin',
      resubmitCount: 0,
      processSteps: createProcessSteps('sample_pending'),
      createdAt: hoursAgo(12),
      updatedAt: hoursAgo(1)
    },
    {
      id: uuidv4(),
      orderNo: 'CG20260606007',
      supplierName: '绿源蔬菜配送有限公司',
      deliveryTime: hoursAgo(1),
      expectedDeliveryTime: hoursAgo(0.5),
      items: [
        { id: uuidv4(), name: '土豆', quantity: 40, unit: 'kg', specification: '一级', price: 2.8, batchNumber: 'B2026060601', productionDate: '2026-06-05', expiryDate: '2026-06-20' },
        { id: uuidv4(), name: '青椒', quantity: 20, unit: 'kg', specification: '一级', price: 6.5, batchNumber: 'B2026060602', productionDate: '2026-06-05', expiryDate: '2026-06-10' },
      ],
      totalAmount: 242,
      purchaserId: 'u2',
      purchaserName: '李采购',
      status: 'pending_acceptance',
      acceptanceRecords: [],
      exceptions: [],
      currentHandlerId: 'u1',
      currentHandlerName: '张管理',
      currentHandlerRole: 'admin',
      deadline: hoursLater(1.5),
      resubmitCount: 0,
      processSteps: createProcessSteps('pending_acceptance'),
      createdAt: hoursAgo(8),
      updatedAt: hoursAgo(1)
    },
    {
      id: uuidv4(),
      orderNo: 'CG20260606008',
      supplierName: '新鲜果蔬配送中心',
      deliveryTime: hoursAgo(6),
      expectedDeliveryTime: hoursAgo(5.5),
      items: [
        { id: uuidv4(), name: '生菜', quantity: 30, unit: 'kg', specification: '有机', price: 8.5, batchNumber: 'V2026060601', productionDate: '2026-06-06', expiryDate: '2026-06-08' },
        { id: uuidv4(), name: '菠菜', quantity: 25, unit: 'kg', specification: '有机', price: 7.2, batchNumber: 'V2026060602', productionDate: '2026-06-06', expiryDate: '2026-06-08' },
      ],
      totalAmount: 435,
      purchaserId: 'u2',
      purchaserName: '李采购',
      status: 'rejected',
      acceptanceRecords: [
        {
          id: uuidv4(),
          purchaseId: 'po8',
          operatorId: 'u1',
          operatorName: '张管理',
          action: 'reject',
          remark: '部分蔬菜有腐烂迹象，外包装有水渍，怀疑运输过程中淋雨',
          timestamp: hoursAgo(5)
        }
      ],
      exceptions: [
        {
          id: uuidv4(),
          purchaseId: 'po8',
          type: 'reject',
          initiatorId: 'u1',
          initiatorName: '张管理',
          handlerId: 'u2',
          handlerName: '李采购',
          description: '验收发现部分蔬菜腐烂，外包装有水渍，需确认是否更换批次或重新配送',
          status: 'processing',
          createdAt: hoursAgo(5),
          comments: []
        }
      ],
      currentHandlerId: 'u2',
      currentHandlerName: '李采购',
      currentHandlerRole: 'purchaser',
      deadline: hoursLater(2),
      resubmitCount: 0,
      processSteps: createProcessSteps('rejected'),
      createdAt: hoursAgo(10),
      updatedAt: hoursAgo(5)
    }
  ]

  purchaseOrders.forEach((po, idx) => {
    po.acceptanceRecords.forEach(r => r.purchaseId = po.id)
    if (po.sampleRecord) po.sampleRecord.purchaseId = po.id
    po.exceptions.forEach(e => e.purchaseId = po.id)
    if (po.dispute) po.dispute.purchaseId = po.id
  })

  return {
    users,
    purchaseOrders
  }
}
