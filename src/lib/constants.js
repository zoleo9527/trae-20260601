export const ROLES = {
  APPRAISER: { key: 'APPRAISER', name: '柜台评估师', color: 'bg-blue-500', desc: '负责当物评估、逾期发起、客户通知' },
  STORAGE: { key: 'STORAGE', name: '库管', color: 'bg-emerald-500', desc: '负责当物核验、库房清点、封签检查' },
  FINANCE: { key: 'FINANCE', name: '财务', color: 'bg-amber-500', desc: '负责费用核算、结算确认、处置底价' }
};

export const STATUS = {
  NORMAL: { key: 'NORMAL', label: '正常在当', color: 'bg-slate-400', role: null, description: '当期内正常状态' },
  OVERDUE_PENDING: { key: 'OVERDUE_PENDING', label: '逾期待处置', color: 'bg-red-400', role: 'APPRAISER', description: '逾期已发生，评估师待确认并发起处置' },
  OVERDUE_CONFIRMED: { key: 'OVERDUE_CONFIRMED', label: '逾期已确认待核库', color: 'bg-orange-400', role: 'STORAGE', description: '评估师确认逾期，等待库管核验当物' },
  STORAGE_CHECKED: { key: 'STORAGE_CHECKED', label: '核库完成待结算', color: 'bg-yellow-500', role: 'FINANCE', description: '库管核验完毕，等待财务结算费用' },
  FINANCIAL_SETTLED: { key: 'FINANCIAL_SETTLED', label: '结算完成待通知', color: 'bg-purple-500', role: 'APPRAISER', description: '财务结算完成，等待评估师通知客户' },
  CUSTOMER_NOTIFIED: { key: 'CUSTOMER_NOTIFIED', label: '已通知待反馈', color: 'bg-indigo-500', role: 'APPRAISER', description: '已通知客户，等待客户反馈或处置' },
  CUSTOMER_ACKNOWLEDGED: { key: 'CUSTOMER_ACKNOWLEDGED', label: '客户已签收确认', color: 'bg-teal-600', role: null, description: '客户确认收到通知，知晓处置事宜' },
  DISPOSAL_PENDING: { key: 'DISPOSAL_PENDING', label: '待处置拍卖', color: 'bg-rose-600', role: 'FINANCE', description: '客户未反馈，进入处置拍卖流程' },
  CLOSED: { key: 'CLOSED', label: '已结案', color: 'bg-gray-500', role: null, description: '赎当/续当/处置后结案' }
};

export const FLOW = [
  { from: 'NORMAL', to: 'OVERDUE_PENDING', actor: 'APPRAISER', action: 'INITIATE_OVERDUE', label: '发起逾期', required: true },
  { from: 'OVERDUE_PENDING', to: 'OVERDUE_CONFIRMED', actor: 'APPRAISER', action: 'CONFIRM_OVERDUE', label: '确认逾期转核库', required: true },
  { from: 'OVERDUE_PENDING', to: 'NORMAL', actor: 'APPRAISER', action: 'REVERT_NORMAL', label: '客户已赎当/续当', required: false },
  { from: 'OVERDUE_CONFIRMED', to: 'STORAGE_CHECKED', actor: 'STORAGE', action: 'STORAGE_AUDIT', label: '核验当物完好', required: true },
  { from: 'STORAGE_CHECKED', to: 'FINANCIAL_SETTLED', actor: 'FINANCE', action: 'FINANCIAL_SETTLE', label: '结算逾期费用', required: true },
  { from: 'FINANCIAL_SETTLED', to: 'CUSTOMER_NOTIFIED', actor: 'APPRAISER', action: 'NOTIFY_CUSTOMER', label: '通知客户处置', required: true },
  { from: 'CUSTOMER_NOTIFIED', to: 'CUSTOMER_ACKNOWLEDGED', actor: 'APPRAISER', action: 'CUSTOMER_CONFIRM', label: '客户确认签收', required: false },
  { from: 'CUSTOMER_NOTIFIED', to: 'DISPOSAL_PENDING', actor: 'APPRAISER', action: 'ENTER_DISPOSAL', label: '进入拍卖处置', required: false },
  { from: 'CUSTOMER_ACKNOWLEDGED', to: 'CLOSED', actor: 'APPRAISER', action: 'CLOSE_REDEEM', label: '客户赎当结案', required: false },
  { from: 'DISPOSAL_PENDING', to: 'CLOSED', actor: 'FINANCE', action: 'CLOSE_DISPOSED', label: '处置完成结案', required: false },

  { from: 'OVERDUE_CONFIRMED', to: 'OVERDUE_PENDING', actor: 'STORAGE', action: 'REJECT_TO_APPRAISER', label: '退回评估师', required: false, isAbnormal: true, hiddenFromMain: true },
  { from: 'STORAGE_CHECKED', to: 'OVERDUE_CONFIRMED', actor: 'FINANCE', action: 'REJECT_TO_STORAGE', label: '退回库管重验', required: false, isAbnormal: true, hiddenFromMain: true },
  { from: 'FINANCIAL_SETTLED', to: 'STORAGE_CHECKED', actor: 'APPRAISER', action: 'REJECT_TO_FINANCE', label: '退回财务重算', required: false, isAbnormal: true, hiddenFromMain: true },
  { from: 'CUSTOMER_NOTIFIED', to: 'FINANCIAL_SETTLED', actor: 'APPRAISER', action: 'APPEAL_REVERT_SETTLED', label: '客户申诉退回结算', required: false, isAbnormal: true, hiddenFromMain: true }
];

export const NOTIFY_METHODS = {
  FORMAL: { key: 'FORMAL', label: '正式通知', requireContent: true },
  REMINDER: { key: 'REMINDER', label: '日常提醒', requireContent: true },
  URGENCY: { key: 'URGENCY', label: '紧急催告', requireContent: true }
};

export const NOTIFY_CHANNELS = {
  SMS: { key: 'SMS', label: '短信', icon: '📱' },
  WECHAT: { key: 'WECHAT', label: '微信', icon: '💬' },
  PHONE: { key: 'PHONE', label: '电话', icon: '📞' },
  ON_SITE: { key: 'ON_SITE', label: '现场', icon: '📋' },
  LETTER: { key: 'LETTER', label: '信函', icon: '✉️' }
};

export const ABNORMAL_TRIGGERS = [
  {
    key: 'DAMAGE_FOUND',
    label: '当物发现损坏',
    applyTo: ['OVERDUE_CONFIRMED'],
    triggerRole: 'STORAGE',
    returnTo: 'OVERDUE_PENDING',
    returnAction: 'REJECT_TO_APPRAISER',
    alertMessage: '当物状态异常：发现与入库登记不符的损坏，请退回评估师说明原因，必要时启动内部核查。',
    severity: 'high'
  },
  {
    key: 'SEAL_BROKEN',
    label: '封签破损',
    applyTo: ['OVERDUE_CONFIRMED'],
    triggerRole: 'STORAGE',
    returnTo: 'OVERDUE_PENDING',
    returnAction: 'REJECT_TO_APPRAISER',
    alertMessage: '封签异常：当物封签有拆动痕迹，必须退回并启动内部核查流程，核对封签记录与责任人。',
    severity: 'critical'
  },
  {
    key: 'DOC_MISSING',
    label: '证件/证书缺失',
    applyTo: ['STORAGE_CHECKED'],
    triggerRole: 'FINANCE',
    returnTo: 'OVERDUE_CONFIRMED',
    returnAction: 'REJECT_TO_STORAGE',
    alertMessage: '结算资料不全：当物鉴定证书或原始凭证缺失，退回库管补件后再行结算。',
    severity: 'medium'
  },
  {
    key: 'AMOUNT_MISMATCH',
    label: '核算金额不符',
    applyTo: ['FINANCIAL_SETTLED'],
    triggerRole: 'APPRAISER',
    returnTo: 'STORAGE_CHECKED',
    returnAction: 'REJECT_TO_FINANCE',
    alertMessage: '金额异议：客户或评估师对逾期费用、违约金或处置底价有异议，退回财务重新核对账目。',
    severity: 'medium'
  },
  {
    key: 'CUSTOMER_APPEAL_SETTLED',
    label: '客户申诉（结算阶段）',
    applyTo: ['FINANCIAL_SETTLED'],
    triggerRole: 'APPRAISER',
    returnTo: 'STORAGE_CHECKED',
    returnAction: 'REJECT_TO_FINANCE',
    alertMessage: '客户申诉：客户对结算金额或处置方案有异议，退回财务重新核实，暂不发送通知。',
    severity: 'high'
  },
  {
    key: 'CUSTOMER_APPEAL_NOTIFIED',
    label: '客户申诉（已通知）',
    applyTo: ['CUSTOMER_NOTIFIED'],
    triggerRole: 'APPRAISER',
    returnTo: 'FINANCIAL_SETTLED',
    returnAction: 'APPEAL_REVERT_SETTLED',
    alertMessage: '客户申诉：客户收到通知后提出异议，暂停处置流程，退回结算环节重新核实后再沟通。',
    severity: 'high'
  }
];
