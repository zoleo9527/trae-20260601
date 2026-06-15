import { InstallationOrder, User, SiteConditionRecord, SiteCheckItem, ChangeLog, OrderStatus } from '../types';

let orderCounter = 20260601001;

export const generateOrderNo = (): string => {
  return `WY${orderCounter++}`;
};

const dispatcherUsers: User[] = [
  { id: 'dispatcher-1', name: '张调度', role: 'dispatcher' },
  { id: 'dispatcher-2', name: '李调度', role: 'dispatcher' },
];

const installerUsers: User[] = [
  { id: 'installer-1', name: '王师傅', role: 'installer' },
  { id: 'installer-2', name: '刘师傅', role: 'installer' },
  { id: 'installer-3', name: '陈师傅', role: 'installer' },
  { id: 'installer-4', name: '赵师傅', role: 'installer' },
];

const customerServiceUsers: User[] = [
  { id: 'cs-1', name: '周客服', role: 'customer_service' },
  { id: 'cs-2', name: '吴客服', role: 'customer_service' },
];

export const allUsers: User[] = [
  ...dispatcherUsers,
  ...installerUsers,
  ...customerServiceUsers,
];

const productTypes = [
  '智能马桶',
  '普通马桶',
  '淋浴花洒',
  '浴室柜',
  '浴缸',
  '淋浴房',
  '水龙头',
  '五金挂件',
];

const productModels: Record<string, string[]> = {
  '智能马桶': ['TOTO-CES9433CS', '科勒-K-4026T', '箭牌-AKB1308', '恒洁-Q8'],
  '普通马桶': ['TOTO-CW854', '科勒-K-3722T', '箭牌-AB1118', '恒洁-HC0145PT'],
  '淋浴花洒': ['汉斯格雅-27128', '高仪-27389', '箭牌-AMG13S826', '九牧-36439'],
  '浴室柜': ['箭牌-APGMD8G3238', '恒洁-6019', '九牧-A2404', '科勒-K-12196T'],
  '浴缸': ['TOTO-PPY1560', '科勒-K-18233T', '箭牌-AC1601', '恒洁-HYB692'],
  '淋浴房': ['箭牌-ALF1017', '九牧-M3411', '恒洁-HY622', '科勒-K-705109T'],
  '水龙头': ['汉斯格雅-31088', '高仪-32818', '箭牌-A91288', '九牧-3288'],
  '五金挂件': ['箭牌-AGJ12Q', '九牧-933611', '恒洁-HMP811', '科勒-K-23558T'],
};

const customerNames = [
  '张伟', '王芳', '李娜', '刘洋', '陈静', '杨帆', '赵敏', '黄磊',
  '周明', '吴霞', '徐磊', '孙丽', '马超', '朱颖', '胡军', '郭琳',
  '何强', '罗燕', '梁伟', '宋敏',
];

const addresses = [
  '北京市朝阳区建国路88号SOHO现代城A座1201',
  '北京市海淀区中关村大街1号海龙大厦15层',
  '北京市西城区金融街7号英蓝国际金融中心8楼',
  '北京市东城区王府井大街211号新东安市场',
  '北京市丰台区南三环西路16号搜宝商务中心',
  '北京市石景山区古城大街1号星座大厦',
  '北京市通州区新华大街56号万达广场',
  '北京市大兴区黄村东大街68号火神庙国际商业中心',
  '北京市昌平区回龙观西大街111号华联商厦',
  '北京市朝阳区望京街9号望京SOHO',
  '北京市海淀区西三环北路89号金玉大厦',
  '北京市朝阳区三里屯路19号三里屯太古里',
];

const timeSlots = ['08:00-10:00', '09:00-11:00', '10:00-12:00', '13:00-15:00', '14:00-16:00', '15:00-17:00', '16:00-18:00'];

const siteCheckItemNames = [
  '进水管道是否到位',
  '排水管道是否通畅',
  '电路插座是否符合要求',
  '安装空间是否充足',
  '墙体是否承重',
  '地面是否平整',
  '产品配件是否齐全',
  '现场是否有其他障碍物',
];

const generatePhone = (): string => {
  const prefixes = ['138', '139', '158', '159', '186', '188', '189', '136'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return prefix + suffix;
};

const generateDate = (daysFromNow: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
};

const generateDateTime = (daysFromNow: number, hour: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
  return date.toISOString();
};

const generateSiteCheckItems = (): SiteCheckItem[] => {
  return siteCheckItemNames.map((name, index) => ({
    id: `item-${index}`,
    name,
    passed: Math.random() > 0.2 ? true : false,
    remark: Math.random() > 0.7 ? (Math.random() > 0.5 ? '位置稍有偏差，已调整' : '需要客户配合处理') : '',
  }));
};

const generateChangeLog = (
  orderId: string,
  field: string,
  oldValue: string,
  newValue: string,
  user: User,
  daysAgo: number
): ChangeLog => ({
  id: `log-${crypto.randomUUID()}`,
  orderId,
  field,
  oldValue,
  newValue,
  operator: user.id,
  operatorName: user.name,
  operatorRole: user.role,
  timestamp: generateDateTime(-daysAgo, 10 + Math.floor(Math.random() * 8)),
});

type MockOrderTemplate = {
  status: OrderStatus;
  daysFromNow: number;
  hasSiteCheck?: boolean;
  siteCheckResult?: 'passed' | 'failed';
  hasChanges?: boolean;
  pendingRecheck?: boolean;
  assigneeIndex?: number;
  priority?: 'normal' | 'urgent' | 'vip';
  delayReason?: string;
  rejectionReason?: string;
  reviewNote?: string;
  isSupplemented?: boolean;
};

const createOrderFromTemplate = (template: MockOrderTemplate, index: number): InstallationOrder => {
  const productType = productTypes[Math.floor(Math.random() * productTypes.length)];
  const models = productModels[productType];
  const productModel = models[Math.floor(Math.random() * models.length)];
  const customerName = customerNames[index % customerNames.length];
  const address = addresses[index % addresses.length];
  const appointmentDate = generateDate(template.daysFromNow);
  const appointmentTime = timeSlots[Math.floor(Math.random() * timeSlots.length)];
  const dispatcher = dispatcherUsers[Math.floor(Math.random() * dispatcherUsers.length)];
  const assignee = template.assigneeIndex !== undefined
    ? installerUsers[template.assigneeIndex]
    : installerUsers[Math.floor(Math.random() * installerUsers.length)];

  const createdAt = generateDateTime(-7 - template.daysFromNow, 9 + Math.floor(Math.random() * 4));
  const scheduledAt = generateDateTime(-6 - template.daysFromNow, 10 + Math.floor(Math.random() * 3));
  const updatedAt = generateDateTime(-Math.abs(template.daysFromNow), 14 + Math.floor(Math.random() * 4));

  const changeLogs: ChangeLog[] = [];

  changeLogs.push(generateChangeLog('', 'status', 'pending', 'scheduled', dispatcher, 7 + template.daysFromNow));

  if (template.status !== 'scheduled' && template.status !== 'pending') {
    changeLogs.push(generateChangeLog('', 'status', 'scheduled', 'assigned', dispatcher, 5 + template.daysFromNow));
  }

  if (template.hasChanges) {
    changeLogs.push(generateChangeLog(
      '',
      'appointmentTime',
      '09:00-11:00',
      appointmentTime,
      dispatcher,
      2
    ));
    changeLogs.push(generateChangeLog(
      '',
      'appointmentDate',
      generateDate(template.daysFromNow - 1),
      appointmentDate,
      dispatcher,
      2
    ));
  }

  if (template.status === 'delayed' && template.delayReason) {
    changeLogs.push(generateChangeLog('', 'status', 'assigned', 'delayed', dispatcher, 1));
  }

  if (template.status === 'rejected' && template.rejectionReason) {
    changeLogs.push(generateChangeLog('', 'status', 'site_check_failed', 'rejected', customerServiceUsers[0], 1));
  }

  if (template.isSupplemented) {
    changeLogs.push(generateChangeLog('', 'status', 'pending', 'supplemented', dispatcher, 3));
  }

  const siteChecks: SiteConditionRecord[] = [];
  const hasAppointmentChanges = template.hasChanges === true;
  const orderAppointmentVersion = hasAppointmentChanges ? 2 : 1;
  const isPendingRecheck = template.pendingRecheck === true;

  if (template.hasSiteCheck) {
    if (hasAppointmentChanges && !isPendingRecheck) {
      const oldItems = generateSiteCheckItems();
      const oldPassed = oldItems.filter(i => i.passed).length;
      const oldResult = oldPassed >= 6 ? 'passed' : 'failed';

      siteChecks.push({
        id: `site-check-1`,
        orderId: '',
        checkedBy: assignee.id,
        checkedAt: generateDateTime(-Math.abs(template.daysFromNow) - 1, 10),
        overallResult: oldResult,
        items: oldItems,
        photos: [],
        notes: oldResult === 'passed'
          ? '第一次现场确认：现场条件符合安装要求。'
          : '第一次现场确认：部分条件不满足。',
        orderVersion: 1,
        appointmentVersion: 1,
      });

      const newItems = generateSiteCheckItems();
      const newPassed = newItems.filter(i => i.passed).length;
      const overallResult = template.siteCheckResult || 'passed';
      const newResult = overallResult === 'passed' || newPassed >= 6 ? 'passed' : 'failed';

      siteChecks.push({
        id: `site-check-2`,
        orderId: '',
        checkedBy: assignee.id,
        checkedAt: generateDateTime(-Math.abs(template.daysFromNow), 15),
        overallResult: newResult,
        items: newItems,
        photos: [],
        notes: newResult === 'passed'
          ? '预约变更后重新确认：现场条件符合安装要求，可以正常安装。'
          : '预约变更后重新确认：部分条件不满足，需要客户整改后再次上门。',
        orderVersion: 3,
        appointmentVersion: 2,
      });
    } else {
      const items = generateSiteCheckItems();
      const overallResult = template.siteCheckResult || 'passed';
      const passedCount = items.filter(i => i.passed).length;
      const actualResult = overallResult === 'passed' || passedCount >= 6 ? 'passed' : 'failed';

      siteChecks.push({
        id: `site-check-1`,
        orderId: '',
        checkedBy: assignee.id,
        checkedAt: generateDateTime(-Math.abs(template.daysFromNow), 15),
        overallResult: actualResult,
        items,
        photos: [],
        notes: hasAppointmentChanges && isPendingRecheck
          ? (actualResult === 'passed'
            ? '现场条件符合安装要求，后因预约信息变更，等待师傅重新确认。'
            : '部分条件不满足，后因预约信息变更，等待师傅重新确认。')
          : (actualResult === 'passed'
            ? '现场条件符合安装要求，可以正常安装。'
            : '部分条件不满足，需要客户整改后再次上门。'),
        orderVersion: hasAppointmentChanges ? 3 : 1,
        appointmentVersion: 1,
      });
    }
  }

  const order: InstallationOrder = {
    id: `order-${index}`,
    orderNo: generateOrderNo(),
    customerName,
    customerPhone: generatePhone(),
    address,
    productType,
    productModel,
    appointmentDate,
    appointmentTime,
    status: template.status,
    assignee: ['scheduled', 'pending', 'supplemented'].includes(template.status) ? null : assignee.id,
    assigneeName: ['scheduled', 'pending', 'supplemented'].includes(template.status) ? null : assignee.name,
    dispatcher: dispatcher.id,
    dispatcherName: dispatcher.name,
    priority: template.priority || 'normal',
    version: hasAppointmentChanges ? 5 : 3,
    appointmentVersion: orderAppointmentVersion,
    createdAt,
    updatedAt,
    scheduledAt,
    completedAt: template.status === 'completed' ? generateDateTime(-Math.abs(template.daysFromNow), 17) : null,
    remarks: '',
    internalNotes: template.status === 'pending_review' ? '请客服尽快复核安装质量。' : (hasAppointmentChanges && isPendingRecheck ? '预约信息已变更，等待师傅上门重新确认。' : ''),
    delayReason: template.delayReason || '',
    rejectionReason: template.rejectionReason || '',
    reviewNote: template.reviewNote || '',
    siteChecks,
    changeLogs: changeLogs.map(log => ({ ...log, orderId: `order-${index}` })),
  };

  siteChecks.forEach(sc => {
    sc.orderId = order.id;
  });
  order.siteChecks = siteChecks;

  return order;
};

export const generateMockData = (): { orders: InstallationOrder[]; users: User[] } => {
  orderCounter = 20260601001;

  const templates: MockOrderTemplate[] = [
    { status: 'scheduled', daysFromNow: 2, priority: 'normal' },
    { status: 'scheduled', daysFromNow: 3, priority: 'urgent' },
    { status: 'scheduled', daysFromNow: 5, priority: 'vip' },
    { status: 'scheduled', daysFromNow: 1, priority: 'normal' },
    { status: 'assigned', daysFromNow: 0, assigneeIndex: 0, priority: 'normal' },
    { status: 'assigned', daysFromNow: 1, assigneeIndex: 1, priority: 'urgent', hasChanges: true },
    { status: 'assigned', daysFromNow: 2, assigneeIndex: 2, priority: 'normal' },
    { status: 'site_check_pending', daysFromNow: 0, assigneeIndex: 0, priority: 'normal' },
    { status: 'site_check_pending', daysFromNow: 0, assigneeIndex: 1, priority: 'urgent', hasChanges: true },
    { status: 'site_check_passed', daysFromNow: -1, assigneeIndex: 2, priority: 'normal', hasSiteCheck: true, siteCheckResult: 'passed' },
    { status: 'site_check_pending', daysFromNow: -1, assigneeIndex: 0, priority: 'urgent', hasSiteCheck: true, siteCheckResult: 'passed', hasChanges: true, pendingRecheck: true },
    { status: 'site_check_passed', daysFromNow: -1, assigneeIndex: 3, priority: 'vip', hasSiteCheck: true, siteCheckResult: 'passed' },
    { status: 'site_check_failed', daysFromNow: -2, assigneeIndex: 0, priority: 'normal', hasSiteCheck: true, siteCheckResult: 'failed' },
    { status: 'site_check_failed', daysFromNow: -1, assigneeIndex: 1, priority: 'urgent', hasSiteCheck: true, siteCheckResult: 'failed', hasChanges: true },
    { status: 'installation', daysFromNow: 0, assigneeIndex: 2, priority: 'normal', hasSiteCheck: true, siteCheckResult: 'passed' },
    { status: 'installation', daysFromNow: 0, assigneeIndex: 3, priority: 'vip', hasSiteCheck: true, siteCheckResult: 'passed' },
    { status: 'completed', daysFromNow: -3, assigneeIndex: 0, priority: 'normal', hasSiteCheck: true, siteCheckResult: 'passed' },
    { status: 'completed', daysFromNow: -5, assigneeIndex: 1, priority: 'urgent', hasSiteCheck: true, siteCheckResult: 'passed' },
    { status: 'completed', daysFromNow: -7, assigneeIndex: 2, priority: 'vip', hasSiteCheck: true, siteCheckResult: 'passed' },
    { status: 'completed', daysFromNow: -2, assigneeIndex: 3, priority: 'normal', hasSiteCheck: true, siteCheckResult: 'passed' },
    { status: 'pending_review', daysFromNow: -1, assigneeIndex: 0, priority: 'normal', hasSiteCheck: true, siteCheckResult: 'passed' },
    { status: 'pending_review', daysFromNow: -2, assigneeIndex: 1, priority: 'urgent', hasSiteCheck: true, siteCheckResult: 'passed' },
    { status: 'delayed', daysFromNow: 5, assigneeIndex: 2, priority: 'normal', delayReason: '客户家中临时有事，需改约下周' },
    { status: 'delayed', daysFromNow: 7, assigneeIndex: 0, priority: 'urgent', delayReason: '物料未到货，需延期安装' },
    { status: 'rejected', daysFromNow: -4, assigneeIndex: 1, priority: 'normal', hasSiteCheck: true, siteCheckResult: 'failed', rejectionReason: '现场条件严重不符合要求，墙体无法承重，建议客户先做加固处理。' },
    { status: 'rejected', daysFromNow: -3, assigneeIndex: 3, priority: 'urgent', hasSiteCheck: true, siteCheckResult: 'failed', rejectionReason: '水电均未到位，无法安装，需改约。' },
    { status: 'supplemented', daysFromNow: -1, priority: 'normal', isSupplemented: true },
    { status: 'supplemented', daysFromNow: -2, priority: 'vip', isSupplemented: true },
    { status: 'scheduled', daysFromNow: 4, priority: 'normal' },
    { status: 'assigned', daysFromNow: 3, assigneeIndex: 3, priority: 'vip' },
    { status: 'completed', daysFromNow: -6, assigneeIndex: 1, priority: 'normal', hasSiteCheck: true, siteCheckResult: 'passed' },
  ];

  const orders = templates.map((template, index) => createOrderFromTemplate(template, index));

  return {
    orders,
    users: allUsers,
  };
};

export const formatDateTime = (isoString: string): string => {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}-${day}`;
};

export const getStatusBadgeClass = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: 'badge-gray',
    scheduled: 'badge-primary',
    assigned: 'badge-info',
    site_check_pending: 'badge-warning',
    site_check_passed: 'badge-success',
    site_check_failed: 'badge-danger',
    installation: 'badge-info',
    completed: 'badge-success',
    rejected: 'badge-danger',
    pending_review: 'badge-warning',
    delayed: 'badge-warning',
    supplemented: 'badge-info',
  };
  return statusMap[status] || 'badge-gray';
};

export const getPriorityLabel = (priority: string): string => {
  const map: Record<string, string> = {
    normal: '普通',
    urgent: '加急',
    vip: 'VIP',
  };
  return map[priority] || priority;
};

export const getFieldLabel = (field: string): string => {
  const map: Record<string, string> = {
    status: '状态',
    assignee: '安装师傅',
    appointmentDate: '预约日期',
    appointmentTime: '预约时间',
    customerName: '客户姓名',
    customerPhone: '客户电话',
    address: '安装地址',
    productType: '产品类型',
    productModel: '产品型号',
    priority: '优先级',
    remarks: '备注',
    internalNotes: '内部备注',
  };
  return map[field] || field;
};

export const hasUnconfirmedAppointmentChanges = (order: InstallationOrder): boolean => {
  if (order.siteChecks.length === 0) return false;
  const lastSiteCheck = order.siteChecks[order.siteChecks.length - 1];
  return order.appointmentVersion > lastSiteCheck.appointmentVersion;
};

export const hasOrderChanges = (order: InstallationOrder): boolean => {
  return hasUnconfirmedAppointmentChanges(order);
};

export const isOldAppointmentCheck = (
  order: InstallationOrder,
  checkIndex: number
): boolean => {
  if (order.siteChecks.length === 0) return false;
  if (checkIndex < 0 || checkIndex >= order.siteChecks.length) return false;
  const currentCheck = order.siteChecks[checkIndex];
  return currentCheck.appointmentVersion < order.appointmentVersion;
};
