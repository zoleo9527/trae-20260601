const { v4: uuidv4 } = require('uuid');

const ROLES = {
  CUSTOMER_SERVICE: 'CUSTOMER_SERVICE',
  PICKING_GUIDE: 'PICKING_GUIDE',
  WAREHOUSE_STAFF: 'WAREHOUSE_STAFF'
};

const STATUS = {
  PENDING_VERIFY: 'PENDING_VERIFY',
  VERIFYING: 'VERIFYING',
  PENDING_COMPENSATION: 'PENDING_COMPENSATION',
  COMPENSATING: 'COMPENSATING',
  PENDING_CLOSE: 'PENDING_CLOSE',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
  RETURNED: 'RETURNED'
};

const STATUS_LABEL = {
  PENDING_VERIFY: '待核实',
  VERIFYING: '核实中',
  PENDING_COMPENSATION: '待补偿',
  COMPENSATING: '发放中',
  PENDING_CLOSE: '待结案',
  COMPLETED: '已完成',
  REJECTED: '已驳回',
  RETURNED: '已退回'
};

const COMPLAINT_TYPES = [
  '服务态度',
  '采摘体验',
  '果品质量',
  '环境卫生',
  '收费问题',
  '安全问题',
  '其他'
];

const users = [
  { id: 'u1', name: '李园园', role: ROLES.CUSTOMER_SERVICE, roleName: '园区客服' },
  { id: 'u2', name: '王向导', role: ROLES.PICKING_GUIDE, roleName: '采摘向导' },
  { id: 'u3', name: '张向导', role: ROLES.PICKING_GUIDE, roleName: '采摘向导' },
  { id: 'u4', name: '陈仓库', role: ROLES.WAREHOUSE_STAFF, roleName: '仓库员' }
];

const complaints = [
  {
    id: uuidv4(),
    complaintNo: 'TS20260608001',
    type: '果品质量',
    title: '桃子有虫眼',
    visitorName: '刘女士',
    visitorPhone: '138****6789',
    orchardArea: 'A区桃园',
    description: '采摘的桃子有好几个都有虫眼，体验不好。',
    registerBy: 'u1',
    registerByName: '李园园',
    registerTime: '2026-06-08 10:30:00',
    registerRemark: '游客情绪比较激动，建议优先核实处理。',
    status: STATUS.PENDING_VERIFY,
    assignedTo: 'u2',
    assignedToName: '王向导',
    assignTime: '2026-06-08 10:35:00',
    verifyResult: '',
    verifyRemark: '',
    verifyTime: '',
    needCompensation: null,
    compensationPlan: '',
    compensationItems: [],
    compensationAmount: 0,
    compensator: '',
    compensatorName: '',
    compensateTime: '',
    compensateRemark: '',
    receiverName: '',
    receiverPhone: '',
    receiverSign: false,
    returnReason: '',
    returnRemark: '',
    returnTime: '',
    closeRemark: '',
    closeTime: '',
    remarkList: [
      { id: uuidv4(), content: '游客情绪比较激动，建议优先核实处理。', operator: '李园园', time: '2026-06-08 10:30:00', type: '登记' }
    ],
    statusHistory: [
      { status: STATUS.PENDING_VERIFY, operator: '李园园', time: '2026-06-08 10:30:00', remark: '投诉登记' }
    ]
  },
  {
    id: uuidv4(),
    complaintNo: 'TS20260607002',
    type: '服务态度',
    title: '向导态度不耐烦',
    visitorName: '赵先生',
    visitorPhone: '139****1234',
    orchardArea: 'B区梨园',
    description: '问了几个问题向导显得很不耐烦，体验差。',
    registerBy: 'u1',
    registerByName: '李园园',
    registerTime: '2026-06-07 14:20:00',
    registerRemark: '',
    status: STATUS.PENDING_COMPENSATION,
    assignedTo: 'u3',
    assignedToName: '张向导',
    assignTime: '2026-06-07 14:25:00',
    verifyResult: '情况属实，当班向导确实态度不好。',
    verifyRemark: '已经和当事向导谈过话，做了批评教育。建议给游客送两斤梨表示歉意。',
    verifyTime: '2026-06-07 16:00:00',
    needCompensation: true,
    compensationPlan: '赠送精品梨2斤',
    compensationItems: [
      { name: '精品梨', quantity: 2, unit: '斤' }
    ],
    compensationAmount: 50,
    compensator: '',
    compensatorName: '',
    compensateTime: '',
    compensateRemark: '',
    receiverName: '',
    receiverPhone: '',
    receiverSign: false,
    returnReason: '',
    returnRemark: '',
    returnTime: '',
    closeRemark: '',
    closeTime: '',
    remarkList: [
      { id: uuidv4(), content: '情况属实，当班向导确实态度不好。', operator: '张向导', time: '2026-06-07 16:00:00', type: '核实' },
      { id: uuidv4(), content: '已经和当事向导谈过话，做了批评教育。建议给游客送两斤梨表示歉意。', operator: '张向导', time: '2026-06-07 16:05:00', type: '核实' }
    ],
    statusHistory: [
      { status: STATUS.PENDING_VERIFY, operator: '李园园', time: '2026-06-07 14:20:00', remark: '投诉登记' },
      { status: STATUS.VERIFYING, operator: '张向导', time: '2026-06-07 14:30:00', remark: '认领核实' },
      { status: STATUS.PENDING_COMPENSATION, operator: '张向导', time: '2026-06-07 16:05:00', remark: '核实通过，待补偿' }
    ]
  },
  {
    id: uuidv4(),
    complaintNo: 'TS20260605003',
    type: '环境卫生',
    title: '休息区垃圾桶满了',
    visitorName: '孙女士',
    visitorPhone: '137****5555',
    orchardArea: 'C区休息区',
    description: '中午休息时垃圾桶都满了，没人清理。',
    registerBy: 'u1',
    registerByName: '李园园',
    registerTime: '2026-06-05 12:30:00',
    registerRemark: '',
    status: STATUS.COMPLETED,
    assignedTo: 'u2',
    assignedToName: '王向导',
    assignTime: '2026-06-05 12:35:00',
    verifyResult: '属实，保洁阿姨吃饭去了没及时清理。',
    verifyRemark: '已协调保洁及时清理，并调整了换班时间。',
    verifyTime: '2026-06-05 13:30:00',
    needCompensation: false,
    compensationPlan: '',
    compensationItems: [],
    compensationAmount: 0,
    compensator: '',
    compensatorName: '',
    compensateTime: '',
    compensateRemark: '',
    receiverName: '',
    receiverPhone: '',
    receiverSign: false,
    returnReason: '',
    returnRemark: '',
    returnTime: '',
    closeRemark: '游客表示理解，对处理结果满意。',
    closeTime: '2026-06-05 15:00:00',
    remarkList: [
      { id: uuidv4(), content: '属实，保洁阿姨吃饭去了没及时清理。', operator: '王向导', time: '2026-06-05 13:30:00', type: '核实' },
      { id: uuidv4(), content: '已协调保洁及时清理，并调整了换班时间。', operator: '王向导', time: '2026-06-05 13:35:00', type: '核实' },
      { id: uuidv4(), content: '游客表示理解，对处理结果满意。', operator: '李园园', time: '2026-06-05 15:00:00', type: '结案' }
    ],
    statusHistory: [
      { status: STATUS.PENDING_VERIFY, operator: '李园园', time: '2026-06-05 12:30:00', remark: '投诉登记' },
      { status: STATUS.VERIFYING, operator: '王向导', time: '2026-06-05 12:40:00', remark: '认领核实' },
      { status: STATUS.PENDING_CLOSE, operator: '王向导', time: '2026-06-05 13:35:00', remark: '核实完成，无需补偿' },
      { status: STATUS.COMPLETED, operator: '李园园', time: '2026-06-05 15:00:00', remark: '已结案' }
    ]
  }
];

module.exports = {
  ROLES,
  STATUS,
  STATUS_LABEL,
  COMPLAINT_TYPES,
  users,
  complaints
};
