import { ComplaintRecord, TodoStats } from './types';

export const mockComplaints: ComplaintRecord[] = [
  {
    id: 'TS20260615001',
    customerName: '张三',
    phone: '138****1234',
    productType: '洗衣机',
    productModel: 'XQG80-B1226S',
    complaintContent: '洗衣机运行时噪音过大，影响正常生活',
    complaintTime: '2026-06-15 09:30',
    status: '待客服受理',
    currentAssignee: '客服',
    history: [
      { id: 'h1', time: '2026-06-15 09:30', operator: '系统', action: '创建工单', detail: '用户提交返修投诉' }
    ]
  },
  {
    id: 'TS20260614002',
    customerName: '李四',
    phone: '139****5678',
    productType: '冰箱',
    productModel: 'BCD-258WDPM',
    complaintContent: '冰箱制冷效果不佳，冷藏室温度偏高',
    complaintTime: '2026-06-14 14:20',
    status: '待维修工程师处理',
    currentAssignee: '维修工程师',
    customerService: {
      handler: '王芳',
      handleTime: '2026-06-14 14:35',
      remark: '已核实用户信息，安排上门维修'
    },
    history: [
      { id: 'h2', time: '2026-06-14 14:20', operator: '系统', action: '创建工单', detail: '用户提交返修投诉' },
      { id: 'h3', time: '2026-06-14 14:35', operator: '王芳', action: '客服受理', detail: '已核实用户信息，安排上门维修' }
    ]
  },
  {
    id: 'TS20260614001',
    customerName: '王五',
    phone: '137****9012',
    productType: '空调',
    productModel: 'KFR-72LW/BP3DN8Y-PH200(B1)',
    complaintContent: '空调开机后自动关机，无法正常使用',
    complaintTime: '2026-06-14 10:15',
    status: '待配件管理员处理',
    currentAssignee: '配件管理员',
    customerService: {
      handler: '王芳',
      handleTime: '2026-06-14 10:30',
      remark: '用户反馈空调频繁自动关机'
    },
    engineer: {
      handler: '李强',
      handleTime: '2026-06-14 15:00',
      repairContent: '检测发现压缩机故障，需要更换',
      partsUsed: ['压缩机总成'],
      remark: '已完成检测，等待配件'
    },
    history: [
      { id: 'h4', time: '2026-06-14 10:15', operator: '系统', action: '创建工单', detail: '用户提交返修投诉' },
      { id: 'h5', time: '2026-06-14 10:30', operator: '王芳', action: '客服受理', detail: '用户反馈空调频繁自动关机' },
      { id: 'h6', time: '2026-06-14 15:00', operator: '李强', action: '工程师检测', detail: '检测发现压缩机故障，需要更换压缩机总成' }
    ]
  },
  {
    id: 'TS20260613003',
    customerName: '赵六',
    phone: '136****3456',
    productType: '微波炉',
    productModel: 'EM7KCGW3-NR',
    complaintContent: '微波炉加热不均匀，部分食物加热不到',
    complaintTime: '2026-06-13 11:00',
    status: '待回访',
    currentAssignee: '客服',
    customerService: {
      handler: '刘燕',
      handleTime: '2026-06-13 11:15',
      remark: '用户反馈微波炉加热问题'
    },
    engineer: {
      handler: '张伟',
      handleTime: '2026-06-13 16:00',
      repairContent: '更换磁控管，测试正常',
      partsUsed: ['磁控管'],
      remark: '维修完成'
    },
    partsManager: {
      handler: '陈明',
      handleTime: '2026-06-13 14:00',
      partsPrepared: ['磁控管'],
      remark: '配件已准备齐全'
    },
    history: [
      { id: 'h7', time: '2026-06-13 11:00', operator: '系统', action: '创建工单', detail: '用户提交返修投诉' },
      { id: 'h8', time: '2026-06-13 11:15', operator: '刘燕', action: '客服受理', detail: '用户反馈微波炉加热问题' },
      { id: 'h9', time: '2026-06-13 14:00', operator: '陈明', action: '配件准备', detail: '已准备磁控管配件' },
      { id: 'h10', time: '2026-06-13 16:00', operator: '张伟', action: '维修完成', detail: '更换磁控管，测试正常' }
    ]
  },
  {
    id: 'TS20260612001',
    customerName: '孙七',
    phone: '135****7890',
    productType: '电饭煲',
    productModel: 'MB-FZ4086',
    complaintContent: '电饭煲煮饭不熟，内胆底部有焦痕',
    complaintTime: '2026-06-12 09:00',
    status: '已完成',
    currentAssignee: '客服',
    customerService: {
      handler: '王芳',
      handleTime: '2026-06-12 09:15',
      remark: '用户反馈电饭煲煮饭问题'
    },
    engineer: {
      handler: '李强',
      handleTime: '2026-06-12 14:00',
      repairContent: '更换加热盘和内胆',
      partsUsed: ['加热盘', '内胆'],
      remark: '维修完成'
    },
    partsManager: {
      handler: '陈明',
      handleTime: '2026-06-12 11:00',
      partsPrepared: ['加热盘', '内胆'],
      remark: '配件已准备齐全'
    },
    revisit: {
      handler: '刘燕',
      revisitTime: '2026-06-13 10:00',
      customerSatisfaction: '满意',
      revisitContent: '用户反馈维修后使用正常，非常满意'
    },
    history: [
      { id: 'h11', time: '2026-06-12 09:00', operator: '系统', action: '创建工单', detail: '用户提交返修投诉' },
      { id: 'h12', time: '2026-06-12 09:15', operator: '王芳', action: '客服受理', detail: '用户反馈电饭煲煮饭问题' },
      { id: 'h13', time: '2026-06-12 11:00', operator: '陈明', action: '配件准备', detail: '已准备加热盘和内胆' },
      { id: 'h14', time: '2026-06-12 14:00', operator: '李强', action: '维修完成', detail: '更换加热盘和内胆' },
      { id: 'h15', time: '2026-06-13 10:00', operator: '刘燕', action: '回访完成', detail: '用户反馈维修后使用正常，非常满意' }
    ]
  },
  {
    id: 'TS20260611002',
    customerName: '周八',
    phone: '134****2345',
    productType: '电视机',
    productModel: 'LED55K5500US',
    complaintContent: '电视机屏幕出现竖线，影响观看',
    complaintTime: '2026-06-11 15:30',
    status: '已驳回',
    currentAssignee: '客服',
    rejectReason: '超出保修期',
    rejectRemark: '用户购买时间为2020年，已超出3年保修期，建议用户付费维修',
    rejectTime: '2026-06-11 16:00',
    history: [
      { id: 'h16', time: '2026-06-11 15:30', operator: '系统', action: '创建工单', detail: '用户提交返修投诉' },
      { id: 'h17', time: '2026-06-11 16:00', operator: '刘燕', action: '工单驳回', detail: '超出保修期，已告知用户' }
    ]
  },
  {
    id: 'TS20260611001',
    customerName: '吴九',
    phone: '133****6789',
    productType: '洗碗机',
    productModel: 'WQP12-720H',
    complaintContent: '洗碗机无法启动，电源指示灯不亮',
    complaintTime: '2026-06-11 10:00',
    status: '已完成',
    currentAssignee: '客服',
    customerService: {
      handler: '王芳',
      handleTime: '2026-06-11 10:15',
      remark: '用户反馈洗碗机无法启动'
    },
    engineer: {
      handler: '张伟',
      handleTime: '2026-06-11 14:30',
      repairContent: '更换电源板，测试正常',
      partsUsed: ['电源板'],
      remark: '维修完成'
    },
    partsManager: {
      handler: '陈明',
      handleTime: '2026-06-11 12:00',
      partsPrepared: ['电源板'],
      remark: '配件已准备齐全'
    },
    revisit: {
      handler: '王芳',
      revisitTime: '2026-06-12 09:00',
      customerSatisfaction: '一般',
      revisitContent: '用户反馈维修后正常使用，但等待配件时间较长'
    },
    history: [
      { id: 'h18', time: '2026-06-11 10:00', operator: '系统', action: '创建工单', detail: '用户提交返修投诉' },
      { id: 'h19', time: '2026-06-11 10:15', operator: '王芳', action: '客服受理', detail: '用户反馈洗碗机无法启动' },
      { id: 'h20', time: '2026-06-11 12:00', operator: '陈明', action: '配件准备', detail: '已准备电源板' },
      { id: 'h21', time: '2026-06-11 14:30', operator: '张伟', action: '维修完成', detail: '更换电源板，测试正常' },
      { id: 'h22', time: '2026-06-12 09:00', operator: '王芳', action: '回访完成', detail: '用户反馈维修后正常使用，但等待配件时间较长' }
    ]
  },
  {
    id: 'TS20260610001',
    customerName: '郑十',
    phone: '132****9012',
    productType: '热水器',
    productModel: 'JSQ25-T3',
    complaintContent: '热水器出水温度不稳定，忽冷忽热',
    complaintTime: '2026-06-10 08:30',
    status: '待客服受理',
    currentAssignee: '客服',
    history: [
      { id: 'h23', time: '2026-06-10 08:30', operator: '系统', action: '创建工单', detail: '用户提交返修投诉' }
    ]
  },
  {
    id: 'TS20260609001',
    customerName: '钱十一',
    phone: '131****4567',
    productType: '抽油烟机',
    productModel: 'CXW-260-JQ36',
    complaintContent: '抽油烟机噪音过大，排风效果差',
    complaintTime: '2026-06-09 10:00',
    status: '待维修工程师处理',
    currentAssignee: '维修工程师',
    customerService: {
      handler: '王芳',
      handleTime: '2026-06-11 14:00',
      remark: '配件已到货，重新派工'
    },
    engineer: {
      handler: '李强',
      handleTime: '2026-06-09 15:00',
      repairContent: '电机老化，需要更换',
      partsUsed: ['电机'],
      remark: '已检测，待配件',
      returnHandler: '王芳',
      returnTime: '2026-06-10 11:00',
      returnReason: '配件缺失',
      returnRemark: '配件库存不足，需要采购'
    },
    history: [
      { id: 'h24', time: '2026-06-09 10:00', operator: '系统', action: '创建工单', detail: '用户提交返修投诉' },
      { id: 'h25', time: '2026-06-09 10:15', operator: '王芳', action: '客服受理', detail: '用户反馈抽油烟机问题，预约上门检测' },
      { id: 'h26', time: '2026-06-09 15:00', operator: '李强', action: '维修退回', detail: '配件缺失：配件库存不足，需要采购' },
      { id: 'h27', time: '2026-06-10 11:00', operator: '王芳', action: '客服受理', detail: '登记配件采购，等待到货' },
      { id: 'h28', time: '2026-06-11 14:00', operator: '王芳', action: '客服受理', detail: '配件已到货，重新派工' }
    ]
  }
];

export const mockStats: TodoStats = {
  pendingCount: 4,
  abnormalCount: 1,
  completedCount: 2
};

export const userRoleOptions = ['客服', '维修工程师', '配件管理员'] as const;

export const statusOptions = [
  { value: '待客服受理', label: '待客服受理', color: 'warning' },
  { value: '待维修工程师处理', label: '待工程师处理', color: 'primary' },
  { value: '待配件管理员处理', label: '待配件处理', color: 'primary' },
  { value: '待回访', label: '待回访', color: 'warning' },
  { value: '已完成', label: '已完成', color: 'success' },
  { value: '已驳回', label: '已驳回', color: 'danger' },
];

export const rejectReasonOptions = [
  { value: '信息不全', label: '信息不全' },
  { value: '非质量问题', label: '非质量问题' },
  { value: '超出保修期', label: '超出保修期' },
  { value: '用户取消', label: '用户取消' },
  { value: '其他', label: '其他' },
];

export const satisfactionOptions = [
  { value: '满意', label: '满意', color: 'success' },
  { value: '一般', label: '一般', color: 'warning' },
  { value: '不满意', label: '不满意', color: 'danger' },
];

export const returnReasonOptions = [
  { value: '信息不全', label: '信息不全' },
  { value: '配件缺失', label: '配件缺失' },
  { value: '需客户补充', label: '需客户补充' },
  { value: '技术问题', label: '技术问题' },
  { value: '其他', label: '其他' },
];
