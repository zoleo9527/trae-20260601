const { v4: uuidv4 } = require('uuid');

const STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  RETURNED: 'returned',
  SUPPLEMENT_NEEDED: 'supplement_needed',
  CLOSED: 'closed',
  URGED: 'urged'
};

const STATUS_LABELS = {
  [STATUS.PENDING]: '待处理',
  [STATUS.PROCESSING]: '处理中',
  [STATUS.RETURNED]: '已退回',
  [STATUS.SUPPLEMENT_NEEDED]: '待补材料',
  [STATUS.CLOSED]: '已关闭',
  [STATUS.URGED]: '有人催'
};

const ROLES = {
  CLERK: 'clerk',
  DELIVERY: 'delivery',
  CUSTOMER_SERVICE: 'customer_service'
};

const ROLE_LABELS = {
  [ROLES.CLERK]: '站点文员',
  [ROLES.DELIVERY]: '配送员',
  [ROLES.CUSTOMER_SERVICE]: '客服'
};

let bills = [];
let complaints = [];

function createHistoryEntry(action, operator, operatorRole, remark, previousStatus, newStatus) {
  return {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    action,
    operator,
    operatorRole,
    remark,
    previousStatus,
    newStatus
  };
}

function initDemoData() {
  const now = new Date();
  
  bills = [
    {
      id: uuidv4(),
      billNo: 'YJ202605001',
      customerName: '张奶奶',
      customerPhone: '13800138001',
      address: '阳光小区1栋2单元301',
      route: 'A路线',
      deliveryPerson: '李师傅',
      month: '2026-05',
      totalAmount: 360.00,
      milkTypes: [
        { name: '鲜牛奶', quantity: 30, price: 8.00, amount: 240.00 },
        { name: '酸奶', quantity: 15, price: 8.00, amount: 120.00 }
      ],
      bottleReturned: 42,
      bottlePending: 3,
      status: STATUS.PENDING,
      assignee: '王文员',
      assigneeRole: ROLES.CLERK,
      currentHandler: '王文员',
      currentHandlerRole: ROLES.CLERK,
      history: [
        createHistoryEntry('创建账单', '系统', 'system', '系统自动生成5月账单', null, STATUS.PENDING)
      ],
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: uuidv4(),
      billNo: 'YJ202605002',
      customerName: '刘先生',
      customerPhone: '13800138002',
      address: '花园小区5栋1单元101',
      route: 'B路线',
      deliveryPerson: '赵师傅',
      month: '2026-05',
      totalAmount: 620.00,
      milkTypes: [
        { name: '鲜牛奶', quantity: 31, price: 8.00, amount: 248.00 },
        { name: '高钙奶', quantity: 31, price: 12.00, amount: 372.00 }
      ],
      bottleReturned: 60,
      bottlePending: 2,
      status: STATUS.PROCESSING,
      assignee: '李配送',
      assigneeRole: ROLES.DELIVERY,
      currentHandler: '李配送',
      currentHandlerRole: ROLES.DELIVERY,
      history: [
        createHistoryEntry('创建账单', '系统', 'system', '系统自动生成5月账单', null, STATUS.PENDING),
        createHistoryEntry('分配处理', '王文员', ROLES.CLERK, '分配给配送员核实回瓶数量', STATUS.PENDING, STATUS.PROCESSING)
      ],
      createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: uuidv4(),
      billNo: 'YJ202605003',
      customerName: '陈阿姨',
      customerPhone: '13800138003',
      address: '幸福里3栋4单元502',
      route: 'A路线',
      deliveryPerson: '李师傅',
      month: '2026-05',
      totalAmount: 248.00,
      milkTypes: [
        { name: '鲜牛奶', quantity: 31, price: 8.00, amount: 248.00 }
      ],
      bottleReturned: 25,
      bottlePending: 6,
      status: STATUS.RETURNED,
      assignee: '王文员',
      assigneeRole: ROLES.CLERK,
      currentHandler: '王文员',
      currentHandlerRole: ROLES.CLERK,
      history: [
        createHistoryEntry('创建账单', '系统', 'system', '系统自动生成5月账单', null, STATUS.PENDING),
        createHistoryEntry('分配处理', '王文员', ROLES.CLERK, '分配给配送员核实', STATUS.PENDING, STATUS.PROCESSING),
        createHistoryEntry('退回', '李配送', ROLES.DELIVERY, '客户称已退回全部瓶子，需要重新核对', STATUS.PROCESSING, STATUS.RETURNED)
      ],
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: uuidv4(),
      billNo: 'YJ202605004',
      customerName: '王大爷',
      customerPhone: '13800138004',
      address: '安康小区2栋3单元201',
      route: 'C路线',
      deliveryPerson: '孙师傅',
      month: '2026-05',
      totalAmount: 480.00,
      milkTypes: [
        { name: '鲜牛奶', quantity: 30, price: 8.00, amount: 240.00 },
        { name: '酸奶', quantity: 20, price: 12.00, amount: 240.00 }
      ],
      bottleReturned: 45,
      bottlePending: 5,
      status: STATUS.SUPPLEMENT_NEEDED,
      assignee: '张客服',
      assigneeRole: ROLES.CUSTOMER_SERVICE,
      currentHandler: '张客服',
      currentHandlerRole: ROLES.CUSTOMER_SERVICE,
      history: [
        createHistoryEntry('创建账单', '系统', 'system', '系统自动生成5月账单', null, STATUS.PENDING),
        createHistoryEntry('客户申诉', '张客服', ROLES.CUSTOMER_SERVICE, '客户对数量有异议，需补充送奶记录', STATUS.PENDING, STATUS.SUPPLEMENT_NEEDED)
      ],
      createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString()
    },
    {
      id: uuidv4(),
      billNo: 'YJ202605005',
      customerName: '林女士',
      customerPhone: '13800138005',
      address: '翠湖苑6栋2单元403',
      route: 'B路线',
      deliveryPerson: '赵师傅',
      month: '2026-05',
      totalAmount: 558.00,
      milkTypes: [
        { name: '高钙奶', quantity: 31, price: 12.00, amount: 372.00 },
        { name: '酸奶', quantity: 15, price: 12.00, amount: 180.00 },
        { name: '早餐奶', quantity: 3, price: 2.00, amount: 6.00 }
      ],
      bottleReturned: 46,
      bottlePending: 0,
      status: STATUS.CLOSED,
      assignee: '王文员',
      assigneeRole: ROLES.CLERK,
      currentHandler: null,
      currentHandlerRole: null,
      history: [
        createHistoryEntry('创建账单', '系统', 'system', '系统自动生成5月账单', null, STATUS.PENDING),
        createHistoryEntry('核实确认', '李配送', ROLES.DELIVERY, '回瓶数量核对无误', STATUS.PENDING, STATUS.PROCESSING),
        createHistoryEntry('结账完成', '王文员', ROLES.CLERK, '客户已确认账单并完成缴费', STATUS.PROCESSING, STATUS.CLOSED)
      ],
      createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: uuidv4(),
      billNo: 'YJ202605006',
      customerName: '周先生',
      customerPhone: '13800138006',
      address: '金桂花园1栋1单元601',
      route: 'C路线',
      deliveryPerson: '孙师傅',
      month: '2026-05',
      totalAmount: 248.00,
      milkTypes: [
        { name: '鲜牛奶', quantity: 31, price: 8.00, amount: 248.00 }
      ],
      bottleReturned: 28,
      bottlePending: 3,
      status: STATUS.URGED,
      assignee: '李配送',
      assigneeRole: ROLES.DELIVERY,
      currentHandler: '李配送',
      currentHandlerRole: ROLES.DELIVERY,
      history: [
        createHistoryEntry('创建账单', '系统', 'system', '系统自动生成5月账单', null, STATUS.PENDING),
        createHistoryEntry('分配处理', '王文员', ROLES.CLERK, '分配给配送员核实', STATUS.PENDING, STATUS.PROCESSING),
        createHistoryEntry('催促', '张客服', ROLES.CUSTOMER_SERVICE, '客户催办，请尽快处理回瓶问题', STATUS.PROCESSING, STATUS.URGED)
      ],
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString()
    }
  ];

  complaints = [
    {
      id: uuidv4(),
      complaintNo: 'TS202605001',
      billId: bills[3].id,
      billNo: bills[3].billNo,
      customerName: '王大爷',
      customerPhone: '13800138004',
      address: '安康小区2栋3单元201',
      type: 'billing_quantity',
      typeLabel: '计费数量异议',
      description: '客户称5月15日至20日外出，没有收到牛奶，但账单仍然计费了。要求核实并扣除相应费用。',
      status: STATUS.PROCESSING,
      assignee: '李配送',
      assigneeRole: ROLES.DELIVERY,
      currentHandler: '李配送',
      currentHandlerRole: ROLES.DELIVERY,
      history: [
        createHistoryEntry('创建申诉', '张客服', ROLES.CUSTOMER_SERVICE, '客户来电申诉计费问题', null, STATUS.PENDING),
        createHistoryEntry('分配核实', '张客服', ROLES.CUSTOMER_SERVICE, '分配给配送员核实送奶记录', STATUS.PENDING, STATUS.PROCESSING)
      ],
      evidences: [
        { id: uuidv4(), name: '客户通话记录.jpg', uploadedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString() }
      ],
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString()
    },
    {
      id: uuidv4(),
      complaintNo: 'TS202605002',
      billId: null,
      billNo: null,
      customerName: '吴女士',
      customerPhone: '13800138007',
      address: '丽景湾8栋5单元302',
      type: 'bottle_damage',
      typeLabel: '奶瓶损坏',
      description: '5月28日送达的牛奶中有2瓶瓶盖损坏，牛奶变质。要求赔偿。',
      status: STATUS.SUPPLEMENT_NEEDED,
      assignee: '张客服',
      assigneeRole: ROLES.CUSTOMER_SERVICE,
      currentHandler: '吴女士',
      currentHandlerRole: 'customer',
      history: [
        createHistoryEntry('创建申诉', '张客服', ROLES.CUSTOMER_SERVICE, '客户微信提交申诉', null, STATUS.PENDING),
        createHistoryEntry('要求补充', '李配送', ROLES.DELIVERY, '请提供损坏奶瓶的照片作为证据', STATUS.PENDING, STATUS.SUPPLEMENT_NEEDED)
      ],
      evidences: [],
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString()
    },
    {
      id: uuidv4(),
      complaintNo: 'TS202605003',
      billId: bills[2].id,
      billNo: bills[2].billNo,
      customerName: '陈阿姨',
      customerPhone: '13800138003',
      address: '幸福里3栋4单元502',
      type: 'bottle_return',
      typeLabel: '回瓶数量争议',
      description: '客户称已经退回全部31个奶瓶，但系统显示只退回25个。要求核查。',
      status: STATUS.RETURNED,
      assignee: '王文员',
      assigneeRole: ROLES.CLERK,
      currentHandler: '王文员',
      currentHandlerRole: ROLES.CLERK,
      history: [
        createHistoryEntry('创建申诉', '张客服', ROLES.CUSTOMER_SERVICE, '客户到门店反映问题', null, STATUS.PENDING),
        createHistoryEntry('分配核实', '王文员', ROLES.CLERK, '分配给配送员核对回瓶记录', STATUS.PENDING, STATUS.PROCESSING),
        createHistoryEntry('退回', '李配送', ROLES.DELIVERY, '回瓶签收单找不到了，需要文员查找原始记录', STATUS.PROCESSING, STATUS.RETURNED)
      ],
      evidences: [
        { id: uuidv4(), name: '客户回瓶签收记录.pdf', uploadedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString() }
      ],
      createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: uuidv4(),
      complaintNo: 'TS202605004',
      billId: null,
      billNo: null,
      customerName: '黄先生',
      customerPhone: '13800138008',
      address: '东方明珠4栋2单元1001',
      type: 'delivery_quality',
      typeLabel: '配送质量问题',
      description: '连续3天牛奶送达时间晚于早上8点，影响孩子上学前饮用。要求改进配送时间。',
      status: STATUS.CLOSED,
      assignee: '张客服',
      assigneeRole: ROLES.CUSTOMER_SERVICE,
      currentHandler: null,
      currentHandlerRole: null,
      history: [
        createHistoryEntry('创建申诉', '张客服', ROLES.CUSTOMER_SERVICE, '客户电话投诉', null, STATUS.PENDING),
        createHistoryEntry('核实处理', '赵师傅', ROLES.DELIVERY, '已调整该区域配送路线，确保7:30前送达', STATUS.PENDING, STATUS.PROCESSING),
        createHistoryEntry('客户确认', '张客服', ROLES.CUSTOMER_SERVICE, '电话回访客户表示满意，结案', STATUS.PROCESSING, STATUS.CLOSED)
      ],
      evidences: [],
      createdAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: uuidv4(),
      complaintNo: 'TS202605005',
      billId: bills[0].id,
      billNo: bills[0].billNo,
      customerName: '张奶奶',
      customerPhone: '13800138001',
      address: '阳光小区1栋2单元301',
      type: 'pricing_issue',
      typeLabel: '价格问题',
      description: '客户反映酸奶价格比上月涨了2元，没有提前通知。要求解释。',
      status: STATUS.URGED,
      assignee: '张客服',
      assigneeRole: ROLES.CUSTOMER_SERVICE,
      currentHandler: '张客服',
      currentHandlerRole: ROLES.CUSTOMER_SERVICE,
      history: [
        createHistoryEntry('创建申诉', '张客服', ROLES.CUSTOMER_SERVICE, '家人代客户咨询价格问题', null, STATUS.PENDING),
        createHistoryEntry('催促', '王文员', ROLES.CLERK, '客户催办，请尽快回复价格调整原因', STATUS.PENDING, STATUS.URGED)
      ],
      evidences: [],
      createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()
    }
  ];
}

initDemoData();

module.exports = {
  STATUS,
  STATUS_LABELS,
  ROLES,
  ROLE_LABELS,
  bills,
  complaints,
  createHistoryEntry
};
