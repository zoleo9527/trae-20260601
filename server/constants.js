const { v4: uuidv4 } = require('uuid');

const ROLES = {
  ASSISTANT: 'assistant',
  CONTROLLER: 'controller',
  LEAD: 'lead'
};

const ROLE_NAMES = {
  [ROLES.ASSISTANT]: '主播助理',
  [ROLES.CONTROLLER]: '场控',
  [ROLES.LEAD]: '售后组长'
};

const TICKET_TYPES = {
  REFUND: 'refund',
  REISSUE: 'reissue'
};

const TICKET_TYPE_NAMES = {
  [TICKET_TYPES.REFUND]: '退款',
  [TICKET_TYPES.REISSUE]: '补发'
};

const STATUS_NAMES = {
  pending_review: '待审核',
  processing: '处理中',
  reviewing: '审核中',
  approved: '已审核通过',
  shipped: '已发货',
  completed: '已完成',
  rejected: '已拒绝'
};

const DEMO_USERS = [
  { id: 'u1', username: 'assistant', password: '123456', role: ROLES.ASSISTANT, name: '李助理' },
  { id: 'u2', username: 'controller', password: '123456', role: ROLES.CONTROLLER, name: '王场控' },
  { id: 'u3', username: 'lead', password: '123456', role: ROLES.LEAD, name: '张组长' }
];

const createInitialTickets = () => [
  {
    id: uuidv4(),
    orderNo: 'ORD20260601001',
    type: TICKET_TYPES.REFUND,
    status: 'pending_review',
    productName: '直播间专属护肤品套装',
    amount: 299.00,
    customerName: '陈女士',
    customerPhone: '138****1234',
    reason: '收到货后发现外包装破损，部分产品漏出',
    createdAt: '2026-06-05 10:30:00',
    createdBy: 'u1',
    logs: [
      { id: uuidv4(), action: '创建工单', status: 'pending_review', operator: '李助理', operatorRole: ROLES.ASSISTANT, time: '2026-06-05 10:30:00', remark: '客户反馈外包装破损，申请退款' }
    ]
  },
  {
    id: uuidv4(),
    orderNo: 'ORD20260601002',
    type: TICKET_TYPES.REISSUE,
    status: 'pending_review',
    productName: '限量版口红套装',
    amount: 199.00,
    customerName: '刘先生',
    customerPhone: '139****5678',
    reason: '下单时选择的是正红色，收到的是豆沙色，发错货了',
    createdAt: '2026-06-05 11:15:00',
    createdBy: 'u1',
    logs: [
      { id: uuidv4(), action: '创建工单', status: 'pending_review', operator: '李助理', operatorRole: ROLES.ASSISTANT, time: '2026-06-05 11:15:00', remark: '客户反馈发错色号，申请补发' }
    ]
  },
  {
    id: uuidv4(),
    orderNo: 'ORD20260601003',
    type: TICKET_TYPES.REFUND,
    status: 'processing',
    productName: '直播间专属零食大礼包',
    amount: 158.00,
    customerName: '赵小姐',
    customerPhone: '137****9012',
    reason: '保质期临近，还有1个月就过期了',
    createdAt: '2026-06-04 14:20:00',
    createdBy: 'u1',
    logs: [
      { id: uuidv4(), action: '创建工单', status: 'pending_review', operator: '李助理', operatorRole: ROLES.ASSISTANT, time: '2026-06-04 14:20:00', remark: '客户反馈保质期临近' },
      { id: uuidv4(), action: '开始处理', status: 'processing', operator: '王场控', operatorRole: ROLES.CONTROLLER, time: '2026-06-04 15:00:00', remark: '已联系仓库确认库存，正在协调退款' }
    ]
  },
  {
    id: uuidv4(),
    orderNo: 'ORD20260601004',
    type: TICKET_TYPES.REISSUE,
    status: 'reviewing',
    productName: '直播专属连衣裙',
    amount: 399.00,
    customerName: '孙女士',
    customerPhone: '136****3456',
    reason: '试穿后发现尺码偏小，需要更换大一号',
    createdAt: '2026-06-03 09:45:00',
    createdBy: 'u1',
    logs: [
      { id: uuidv4(), action: '创建工单', status: 'pending_review', operator: '李助理', operatorRole: ROLES.ASSISTANT, time: '2026-06-03 09:45:00', remark: '客户反馈尺码不合适，申请换码补发' },
      { id: uuidv4(), action: '开始审核', status: 'reviewing', operator: '张组长', operatorRole: ROLES.LEAD, time: '2026-06-03 11:30:00', remark: '已确认客户退回商品，正在审核补发申请' }
    ]
  },
  {
    id: uuidv4(),
    orderNo: 'ORD20260601005',
    type: TICKET_TYPES.REFUND,
    status: 'completed',
    productName: '直播间专属面膜',
    amount: 89.00,
    customerName: '周先生',
    customerPhone: '135****7890',
    reason: '使用后皮肤过敏',
    createdAt: '2026-06-02 16:00:00',
    createdBy: 'u1',
    logs: [
      { id: uuidv4(), action: '创建工单', status: 'pending_review', operator: '李助理', operatorRole: ROLES.ASSISTANT, time: '2026-06-02 16:00:00', remark: '客户反馈使用后过敏' },
      { id: uuidv4(), action: '开始处理', status: 'processing', operator: '王场控', operatorRole: ROLES.CONTROLLER, time: '2026-06-02 16:30:00', remark: '已核实情况，安排退款' },
      { id: uuidv4(), action: '完成退款', status: 'completed', operator: '张组长', operatorRole: ROLES.LEAD, time: '2026-06-02 18:00:00', remark: '退款已到账，客户确认收到' }
    ]
  },
  {
    id: uuidv4(),
    orderNo: 'ORD20260601006',
    type: TICKET_TYPES.REISSUE,
    status: 'approved',
    productName: '直播间专属保温杯',
    amount: 128.00,
    customerName: '吴女士',
    customerPhone: '134****2345',
    reason: '收到的杯子有划痕，影响使用',
    createdAt: '2026-06-01 10:00:00',
    createdBy: 'u1',
    logs: [
      { id: uuidv4(), action: '创建工单', status: 'pending_review', operator: '李助理', operatorRole: ROLES.ASSISTANT, time: '2026-06-01 10:00:00', remark: '客户反馈杯子有划痕' },
      { id: uuidv4(), action: '开始审核', status: 'reviewing', operator: '张组长', operatorRole: ROLES.LEAD, time: '2026-06-01 11:00:00', remark: '已核实照片，确认为运输损坏' },
      { id: uuidv4(), action: '审核通过', status: 'approved', operator: '张组长', operatorRole: ROLES.LEAD, time: '2026-06-01 14:00:00', remark: '已安排仓库补发新品' }
    ]
  }
];

module.exports = {
  ROLES,
  ROLE_NAMES,
  TICKET_TYPES,
  TICKET_TYPE_NAMES,
  STATUS_NAMES,
  DEMO_USERS,
  createInitialTickets
};