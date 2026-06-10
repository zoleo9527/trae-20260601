import type {
  ParkingOrder,
  AbnormalRepair,
  User,
  StatusLog,
  Remark,
  RepairLog,
  GateAbnormalLog,
  MonthlyRentalInfo,
  ParkingLotLog,
  DashboardStats,
} from '../types';

export const USERS: User[] = [
  { id: 'u001', name: '张伟', role: 'operator' },
  { id: 'u002', name: '李娜', role: 'operator' },
  { id: 'u003', name: '王芳', role: 'customer_service' },
  { id: 'u004', name: '刘洋', role: 'customer_service' },
  { id: 'u005', name: '陈强', role: 'maintenance' },
  { id: 'u006', name: '赵磊', role: 'maintenance' },
];

const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000).toISOString();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();
const daysLater = (d: number) => new Date(now.getTime() + d * 86400000).toISOString();

export const PARKING_LOTS = [
  { id: 'pl001', name: '万象城地下停车场' },
  { id: 'pl002', name: '银泰中心停车楼' },
  { id: 'pl003', name: '科技园区A区' },
  { id: 'pl004', name: '万达广场P1停车场' },
];

export const GATES = [
  { id: 'g001', name: '万象城-北入口', lotId: 'pl001' },
  { id: 'g002', name: '万象城-南出口', lotId: 'pl001' },
  { id: 'g003', name: '银泰-1号岗', lotId: 'pl002' },
  { id: 'g004', name: '科技园-A1入口', lotId: 'pl003' },
  { id: 'g005', name: '万达-P1出口', lotId: 'pl004' },
];

const makeStatusLog = (
  orderId: string,
  from: string,
  to: string,
  userIdx: number,
  hours: number,
  remark: string
): StatusLog => {
  const u = USERS[userIdx];
  return {
    id: `sl_${orderId}_${from}_${to}`,
    orderId,
    fromStatus: from,
    toStatus: to,
    operatorId: u.id,
    operatorName: u.name,
    operatorRole: u.role,
    timestamp: hoursAgo(hours),
    remark,
  };
};

const makeRemark = (
  orderId: string,
  idx: number,
  userIdx: number,
  hours: number,
  content: string
): Remark => {
  const u = USERS[userIdx];
  return {
    id: `rm_${orderId}_${idx}`,
    orderId,
    content,
    operatorId: u.id,
    operatorName: u.name,
    operatorRole: u.role,
    timestamp: hoursAgo(hours),
  };
};

const makeRepairLog = (
  repairId: string,
  idx: number,
  step: string,
  action: string,
  userIdx: number,
  hours: number,
  remark: string,
  result?: string
): RepairLog => {
  const u = USERS[userIdx];
  return {
    id: `rpl_${repairId}_${idx}`,
    repairId,
    step,
    action,
    operatorId: u.id,
    operatorName: u.name,
    operatorRole: u.role,
    timestamp: hoursAgo(hours),
    remark,
    result,
  };
};

export const PARKING_ORDERS: ParkingOrder[] = [
  {
    id: 'po001',
    orderNo: 'LC202606100001',
    plateNo: '京A·12345',
    plateConfidence: 98,
    parkingLotId: 'pl001',
    parkingLotName: '万象城地下停车场',
    gateId: 'g002',
    gateName: '万象城-南出口',
    enterTime: hoursAgo(5),
    parkingDuration: 210,
    baseFee: 42,
    discountAmount: 0,
    actualFee: 42,
    paidAmount: 0,
    status: 'stuck',
    currentHandlerId: 'u001',
    currentHandlerName: '张伟',
    currentHandlerRole: 'operator',
    stuckPoint: '道闸抬杆失败，车辆已离场但系统未登记',
    abnormalType: 'gate_malfunction',
    abnormalTime: hoursAgo(1.5),
    abnormalDesc: '出口道闸机械故障，车辆跟随前车离场，系统未生成出场记录',
    repairStatus: 'processing',
    createTime: hoursAgo(5),
    updateTime: hoursAgo(1.2),
    statusLogs: [
      makeStatusLog('po001', 'pending_enter', 'entered', 0, 5, '车辆识别入场'),
      makeStatusLog('po001', 'entered', 'pending_pay', 0, 1.6, '车辆到达出口，触发计费'),
      makeStatusLog('po001', 'pending_pay', 'stuck', 0, 1.5, '道闸抬杆失败，订单卡住'),
    ],
    remarks: [
      makeRemark('po001', 1, 4, 1.2, '已派单维修南出口道闸液压杆，预计2小时内修复'),
      makeRemark('po001', 2, 0, 1, '联系车主补交停车费42元，电话未接通'),
    ],
  },
  {
    id: 'po002',
    orderNo: 'LC202606100002',
    plateNo: '沪B·88888',
    plateConfidence: 72,
    parkingLotId: 'pl002',
    parkingLotName: '银泰中心停车楼',
    gateId: 'g003',
    gateName: '银泰-1号岗',
    enterTime: hoursAgo(8),
    exitTime: hoursAgo(2),
    parkingDuration: 360,
    baseFee: 72,
    discountAmount: 20,
    actualFee: 52,
    paidAmount: 0,
    status: 'abnormal',
    currentHandlerId: 'u003',
    currentHandlerName: '王芳',
    currentHandlerRole: 'customer_service',
    abnormalType: 'plate_recognition_error',
    abnormalTime: hoursAgo(3),
    abnormalDesc: '车牌识别置信度低，疑似识别错误，车主申辩称未入场',
    repairStatus: 'pending_confirm',
    createTime: hoursAgo(8),
    updateTime: hoursAgo(0.8),
    statusLogs: [
      makeStatusLog('po002', 'pending_enter', 'entered', 1, 8, '车辆入场（置信度72%）'),
      makeStatusLog('po002', 'entered', 'pending_pay', 1, 3.1, '车辆出场触发'),
      makeStatusLog('po002', 'pending_pay', 'abnormal', 3, 3, '车牌识别异常，转客服处理'),
    ],
    remarks: [
      makeRemark('po002', 1, 3, 2.5, '致电车主核实，车主称当日未到银泰中心'),
      makeRemark('po002', 2, 3, 1.5, '已申请调阅1号岗监控录像，等待安保反馈'),
      makeRemark('po002', 3, 3, 0.8, '监控显示：实际车牌为沪B·888BB，确认识别错误'),
    ],
  },
  {
    id: 'po003',
    orderNo: 'LC202606100003',
    plateNo: '粤C·66666',
    plateConfidence: 95,
    parkingLotId: 'pl003',
    parkingLotName: '科技园区A区',
    gateId: 'g004',
    gateName: '科技园-A1入口',
    enterTime: hoursAgo(48),
    parkingDuration: 1440,
    baseFee: 288,
    discountAmount: 0,
    actualFee: 288,
    paidAmount: 100,
    status: 'abnormal',
    currentHandlerId: 'u004',
    currentHandlerName: '刘洋',
    currentHandlerRole: 'customer_service',
    abnormalType: 'fee_dispute',
    abnormalTime: hoursAgo(10),
    abnormalDesc: '车主认为计费时长错误，只愿意支付部分费用，剩余188元未缴',
    repairStatus: 'processing',
    createTime: hoursAgo(48),
    updateTime: hoursAgo(2),
    statusLogs: [
      makeStatusLog('po003', 'pending_enter', 'entered', 0, 48, '车辆入场'),
      makeStatusLog('po003', 'entered', 'pending_pay', 0, 10.5, '车主申请出场'),
      makeStatusLog('po003', 'pending_pay', 'abnormal', 4, 10, '费用争议，部分缴费后转客服'),
    ],
    remarks: [
      makeRemark('po003', 1, 4, 8, '车主提供会议邀请函，称仅停留4小时，系统记录24小时'),
      makeRemark('po003', 2, 4, 5, '已核实园区通行记录，车辆确于24小时前二次入场，计费无误'),
      makeRemark('po003', 3, 4, 2, '再次联系车主沟通，承诺明天处理，需继续跟进'),
    ],
  },
  {
    id: 'po004',
    orderNo: 'LC202606100004',
    plateNo: '川A·99999',
    plateConfidence: 99,
    parkingLotId: 'pl004',
    parkingLotName: '万达广场P1停车场',
    gateId: 'g005',
    gateName: '万达-P1出口',
    enterTime: hoursAgo(3),
    parkingDuration: 150,
    baseFee: 30,
    discountAmount: 30,
    actualFee: 0,
    paidAmount: 0,
    status: 'pending_exit',
    currentHandlerId: 'u002',
    currentHandlerName: '李娜',
    currentHandlerRole: 'operator',
    createTime: hoursAgo(3),
    updateTime: hoursAgo(0.5),
    statusLogs: [
      makeStatusLog('po004', 'pending_enter', 'entered', 1, 3, '车辆入场'),
      makeStatusLog('po004', 'entered', 'paid', 1, 0.6, '凭商场满减券抵扣全额费用'),
      makeStatusLog('po004', 'paid', 'pending_exit', 1, 0.5, '等待道闸抬杆放行'),
    ],
    remarks: [],
  },
  {
    id: 'po005',
    orderNo: 'LC202606100005',
    plateNo: '浙A·77777',
    plateConfidence: 88,
    parkingLotId: 'pl001',
    parkingLotName: '万象城地下停车场',
    gateId: 'g001',
    gateName: '万象城-北入口',
    enterTime: hoursAgo(12),
    exitTime: hoursAgo(6),
    parkingDuration: 360,
    baseFee: 72,
    discountAmount: 0,
    actualFee: 72,
    paidAmount: 0,
    status: 'stuck',
    currentHandlerId: 'u005',
    currentHandlerName: '陈强',
    currentHandlerRole: 'maintenance',
    stuckPoint: '出口系统崩溃，无出场图像和记录，车辆强行驶离',
    abnormalType: 'force_exit',
    abnormalTime: hoursAgo(6),
    abnormalDesc: '出口控制系统异常重启，道闸自动开启，多车无记录离场',
    repairStatus: 'pending',
    createTime: hoursAgo(12),
    updateTime: hoursAgo(4),
    statusLogs: [
      makeStatusLog('po005', 'pending_enter', 'entered', 0, 12, '车辆入场'),
      makeStatusLog('po005', 'entered', 'stuck', 5, 6, '系统崩溃，强行驶离事件'),
    ],
    remarks: [
      makeRemark('po005', 1, 5, 4, '设备日志已采集，正在分析系统崩溃原因，初步怀疑内存泄漏'),
    ],
  },
  {
    id: 'po006',
    orderNo: 'LC202606100006',
    plateNo: '苏E·55555',
    plateConfidence: 96,
    parkingLotId: 'pl002',
    parkingLotName: '银泰中心停车楼',
    enterTime: hoursAgo(2),
    parkingDuration: 90,
    baseFee: 18,
    discountAmount: 0,
    actualFee: 18,
    paidAmount: 0,
    status: 'pending_pay',
    createTime: hoursAgo(2),
    updateTime: hoursAgo(0.5),
    statusLogs: [
      makeStatusLog('po006', 'pending_enter', 'entered', 1, 2, '车辆入场'),
      makeStatusLog('po006', 'entered', 'pending_pay', 1, 0.5, '等待缴费'),
    ],
    remarks: [],
  },
  {
    id: 'po007',
    orderNo: 'LC202606090128',
    plateNo: '鲁B·33333',
    plateConfidence: 92,
    parkingLotId: 'pl003',
    parkingLotName: '科技园区A区',
    enterTime: daysAgo(3),
    exitTime: hoursAgo(26),
    parkingDuration: 1800,
    baseFee: 360,
    discountAmount: 0,
    actualFee: 360,
    paidAmount: 0,
    status: 'abnormal',
    currentHandlerId: 'u003',
    currentHandlerName: '王芳',
    currentHandlerRole: 'customer_service',
    abnormalType: 'payment_timeout',
    abnormalTime: hoursAgo(24),
    abnormalDesc: '出场后超过24小时未补缴，多次短信提醒未读',
    repairStatus: 'pending',
    createTime: daysAgo(3),
    updateTime: hoursAgo(12),
    statusLogs: [
      makeStatusLog('po007', 'pending_enter', 'entered', 0, 72, '车辆入场'),
      makeStatusLog('po007', 'entered', 'pending_pay', 0, 26, '车辆出场，生成待缴订单'),
      makeStatusLog('po007', 'pending_pay', 'abnormal', 3, 24, '超时未缴，转客服催收'),
    ],
    remarks: [
      makeRemark('po007', 1, 3, 20, '发送短信提醒，未回复'),
      makeRemark('po007', 2, 3, 12, '拨打电话，已关机，将发送挂号信催缴'),
    ],
  },
  {
    id: 'po008',
    orderNo: 'LC202606100008',
    plateNo: '京A·66888',
    plateConfidence: 99,
    parkingLotId: 'pl004',
    parkingLotName: '万达广场P1停车场',
    enterTime: hoursAgo(6),
    exitTime: hoursAgo(2),
    parkingDuration: 240,
    baseFee: 48,
    discountAmount: 0,
    actualFee: 48,
    paidAmount: 48,
    status: 'exited',
    createTime: hoursAgo(6),
    updateTime: hoursAgo(2),
    statusLogs: [
      makeStatusLog('po008', 'pending_enter', 'entered', 1, 6, '车辆入场'),
      makeStatusLog('po008', 'entered', 'pending_pay', 1, 2.1, '到达出口'),
      makeStatusLog('po008', 'pending_pay', 'paid', 1, 2.05, '微信支付成功'),
      makeStatusLog('po008', 'paid', 'exited', 1, 2, '正常离场'),
    ],
    remarks: [],
  },
];

export const ABNORMAL_REPAIRS: AbnormalRepair[] = [
  {
    id: 'ar001',
    repairNo: 'BJB20260610001',
    orderId: 'po001',
    orderNo: 'LC202606100001',
    plateNo: '京A·12345',
    abnormalType: 'gate_malfunction',
    abnormalTime: hoursAgo(1.5),
    abnormalDesc: '出口道闸机械故障，车辆跟随前车离场',
    repairStatus: 'processing',
    assigneeId: 'u001',
    assigneeName: '张伟',
    assigneeRole: 'operator',
    currentStep: '等待道闸修复后确认补缴',
    blockerReason: '道闸维修未完成，无法核对最终离场时间',
    feeAmount: 42,
    paidAmount: 0,
    unpaidAmount: 42,
    createTime: hoursAgo(1.5),
    updateTime: hoursAgo(1),
    repairLogs: [
      makeRepairLog('ar001', 1, '异常登记', '创建补缴单', 0, 1.5, '道闸故障登记'),
      makeRepairLog('ar001', 2, '派单处理', '分配给运营张伟', 0, 1.4, '系统自动派单'),
      makeRepairLog('ar001', 3, '设备维修', '转设备组', 0, 1.2, '道闸硬件问题，转陈强维修', '派单给陈强'),
      makeRepairLog('ar001', 4, '联系车主', '拨打电话', 0, 1, '车主未接听，稍后再试'),
    ],
  },
  {
    id: 'ar002',
    repairNo: 'BJB20260610002',
    orderId: 'po002',
    orderNo: 'LC202606100002',
    plateNo: '沪B·88888',
    abnormalType: 'plate_recognition_error',
    abnormalTime: hoursAgo(3),
    abnormalDesc: '车牌识别错误，实际车牌与系统不符',
    repairStatus: 'pending_confirm',
    assigneeId: 'u003',
    assigneeName: '王芳',
    assigneeRole: 'customer_service',
    currentStep: '等待车主确认免除费用',
    feeAmount: 52,
    paidAmount: 0,
    unpaidAmount: 52,
    createTime: hoursAgo(3),
    updateTime: hoursAgo(0.8),
    repairLogs: [
      makeRepairLog('ar002', 1, '异常登记', '创建补缴单', 3, 3, '识别置信度过低，人工复核'),
      makeRepairLog('ar002', 2, '联系车主', '电话核实', 3, 2.5, '车主否认入场'),
      makeRepairLog('ar002', 3, '证据采集', '调阅监控', 3, 1.5, '安保提供监控截图'),
      makeRepairLog('ar002', 4, '费用复核', '申请免除', 3, 0.8, '确认识别错误，实际为沪B·888BB，已走免除审批流程'),
    ],
  },
  {
    id: 'ar003',
    repairNo: 'BJB20260610003',
    orderId: 'po003',
    orderNo: 'LC202606100003',
    plateNo: '粤C·66666',
    abnormalType: 'fee_dispute',
    abnormalTime: hoursAgo(10),
    abnormalDesc: '车主对计费时长有异议，拒绝全额缴费',
    repairStatus: 'processing',
    assigneeId: 'u004',
    assigneeName: '刘洋',
    assigneeRole: 'customer_service',
    currentStep: '等待车主最终答复',
    blockerReason: '车主承诺明天答复，目前暂停跟进',
    feeAmount: 288,
    paidAmount: 100,
    unpaidAmount: 188,
    createTime: hoursAgo(10),
    updateTime: hoursAgo(2),
    repairLogs: [
      makeRepairLog('ar003', 1, '异常登记', '创建补缴单', 4, 10, '车主现场争议，部分缴费放行'),
      makeRepairLog('ar003', 2, '证据核实', '核对通行记录', 4, 8, '车主提供的会议时间有出入'),
      makeRepairLog('ar003', 3, '通行核实', '查询园区记录', 4, 5, '确认24小时前已入场，计费正确'),
      makeRepairLog('ar003', 4, '二次沟通', '电话解释', 4, 2, '车主承诺明天处理尾款'),
    ],
  },
  {
    id: 'ar004',
    repairNo: 'BJB20260610004',
    orderId: 'po005',
    orderNo: 'LC202606100005',
    plateNo: '浙A·77777',
    abnormalType: 'force_exit',
    abnormalTime: hoursAgo(6),
    abnormalDesc: '出口系统崩溃，道闸自动抬杆，多车无记录离场',
    repairStatus: 'pending',
    assigneeId: 'u005',
    assigneeName: '陈强',
    assigneeRole: 'maintenance',
    currentStep: '定位系统崩溃原因',
    blockerReason: '系统崩溃原因未明，需先修复避免再次发生',
    feeAmount: 72,
    paidAmount: 0,
    unpaidAmount: 72,
    createTime: hoursAgo(6),
    updateTime: hoursAgo(4),
    repairLogs: [
      makeRepairLog('ar004', 1, '异常登记', '创建补缴单', 5, 6, '监控告警：系统重启'),
      makeRepairLog('ar004', 2, '日志采集', '下载设备日志', 5, 5, '完整日志已导出'),
      makeRepairLog('ar004', 3, '故障分析', '分析dump文件', 5, 4, '初步怀疑内存泄漏，需压测复现'),
    ],
  },
  {
    id: 'ar005',
    repairNo: 'BJB20260609008',
    orderId: 'po007',
    orderNo: 'LC202606090128',
    plateNo: '鲁B·33333',
    abnormalType: 'payment_timeout',
    abnormalTime: hoursAgo(24),
    abnormalDesc: '出场后24小时未补缴，短信未回复',
    repairStatus: 'pending',
    assigneeId: 'u003',
    assigneeName: '王芳',
    assigneeRole: 'customer_service',
    currentStep: '准备发送挂号信催缴',
    feeAmount: 360,
    paidAmount: 0,
    unpaidAmount: 360,
    createTime: hoursAgo(24),
    updateTime: hoursAgo(12),
    repairLogs: [
      makeRepairLog('ar005', 1, '异常登记', '系统自动生成', 3, 24, '超时24h未缴'),
      makeRepairLog('ar005', 2, '短信催缴', '批量发送', 3, 20, '短信已发送，无回复'),
      makeRepairLog('ar005', 3, '电话催缴', '人工拨打', 3, 12, '电话关机，需走挂号信流程'),
    ],
  },
];

export const GATE_ABNORMAL_LOGS: GateAbnormalLog[] = [
  {
    id: 'gal001',
    parkingLotId: 'pl001',
    parkingLotName: '万象城地下停车场',
    gateId: 'g002',
    gateName: '万象城-南出口',
    abnormalType: '道闸液压杆故障',
    abnormalTime: hoursAgo(1.5),
    status: '维修中',
    handlerName: '陈强',
  },
  {
    id: 'gal002',
    parkingLotId: 'pl004',
    parkingLotName: '万达广场P1停车场',
    gateId: 'g005',
    gateName: '万达-P1出口',
    abnormalType: '控制系统崩溃重启',
    abnormalTime: hoursAgo(6),
    status: '已恢复',
    handlerName: '赵磊',
  },
  {
    id: 'gal003',
    parkingLotId: 'pl002',
    parkingLotName: '银泰中心停车楼',
    gateId: 'g003',
    gateName: '银泰-1号岗',
    abnormalType: '识别摄像头角度偏移',
    abnormalTime: hoursAgo(10),
    status: '已修复',
    handlerName: '陈强',
  },
];

export const MONTHLY_RENTALS: MonthlyRentalInfo[] = [
  {
    id: 'mr001',
    plateNo: '京A·00001',
    ownerName: '某科技公司',
    parkingLotId: 'pl003',
    validUntil: daysLater(30),
    status: 'active',
  },
  {
    id: 'mr002',
    plateNo: '沪B·888BB',
    ownerName: '银泰VIP客户',
    parkingLotId: 'pl002',
    validUntil: daysLater(15),
    status: 'active',
  },
  {
    id: 'mr003',
    plateNo: '粤C·OLD01',
    ownerName: '科技园老用户',
    parkingLotId: 'pl003',
    validUntil: daysAgo(5),
    status: 'expired',
  },
];

export const PARKING_LOT_LOGS: ParkingLotLog[] = [
  {
    id: 'pll001',
    parkingLotId: 'pl001',
    parkingLotName: '万象城地下停车场',
    plateNo: '京A·12345',
    action: 'enter',
    timestamp: hoursAgo(5),
    gateName: '万象城-北入口',
  },
  {
    id: 'pll002',
    parkingLotId: 'pl002',
    parkingLotName: '银泰中心停车楼',
    plateNo: '沪B·888BB',
    action: 'enter',
    timestamp: hoursAgo(8),
    gateName: '银泰-1号岗',
  },
  {
    id: 'pll003',
    parkingLotId: 'pl001',
    parkingLotName: '万象城地下停车场',
    plateNo: '京A·12345',
    action: 'exit',
    timestamp: hoursAgo(1.5),
    gateName: '万象城-南出口',
    operator: '张伟',
  },
];

export const computeStats = (orders: ParkingOrder[], repairs: AbnormalRepair[]): DashboardStats => {
  const stuckOrders = orders.filter((o) => o.status === 'stuck').length;
  const abnormalOrders = orders.filter((o) => o.status === 'abnormal').length;
  const pendingRepairs = repairs.filter((r) => r.repairStatus === 'pending').length;
  const processingRepairs = repairs.filter((r) => r.repairStatus === 'processing').length;
  const totalUnpaidAmount = repairs.reduce((sum, r) => sum + r.unpaidAmount, 0);

  let operatorTodo = 0;
  let customerServiceTodo = 0;
  let maintenanceTodo = 0;

  orders.forEach((o) => {
    if (!o.currentHandlerRole) return;
    if (o.currentHandlerRole === 'operator' && (o.status === 'stuck' || o.status === 'abnormal')) operatorTodo++;
    if (o.currentHandlerRole === 'customer_service' && (o.status === 'stuck' || o.status === 'abnormal')) customerServiceTodo++;
    if (o.currentHandlerRole === 'maintenance' && (o.status === 'stuck' || o.status === 'abnormal')) maintenanceTodo++;
  });

  repairs.forEach((r) => {
    if (!r.assigneeRole) return;
    if (r.repairStatus === 'pending' || r.repairStatus === 'processing') {
      if (r.assigneeRole === 'operator') operatorTodo++;
      if (r.assigneeRole === 'customer_service') customerServiceTodo++;
      if (r.assigneeRole === 'maintenance') maintenanceTodo++;
    }
  });

  return {
    totalOrders: orders.length,
    stuckOrders,
    abnormalOrders,
    pendingRepairs,
    processingRepairs,
    totalUnpaidAmount,
    operatorTodo,
    customerServiceTodo,
    maintenanceTodo,
  };
};

export const ABNORMAL_TYPE_LABEL: Record<string, string> = {
  gate_malfunction: '道闸故障',
  payment_timeout: '缴费超时',
  plate_recognition_error: '识别错误',
  fee_dispute: '费用争议',
  force_exit: '强行离场',
  unknown: '未知异常',
};

export const REPAIR_STATUS_LABEL: Record<string, string> = {
  pending: '待处理',
  processing: '处理中',
  pending_confirm: '待确认',
  completed: '已完成',
  failed: '处理失败',
};

export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending_enter: '待入场',
  entered: '已入场',
  pending_pay: '待缴费',
  paid: '已缴费',
  pending_exit: '待出场',
  exited: '已离场',
  abnormal: '异常',
  stuck: '卡单',
};

export const ROLE_LABEL: Record<string, string> = {
  operator: '运营专员',
  customer_service: '客服',
  maintenance: '设备维护员',
};
