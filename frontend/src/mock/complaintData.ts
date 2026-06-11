import type {
  Complaint,
  TenantVisit,
  ExceptionNote,
  KeyJudgement,
  StatusChangeLog,
  ShopInfo,
  StaffInfo
} from '@/types/complaint'
import dayjs from 'dayjs'

export const mockShops: ShopInfo[] = [
  { code: 'A-101', name: '星巴克咖啡', tenantName: '星巴克咖啡(上海)有限公司', floor: '1F', area: 'A区', contact: '王经理', phone: '138****1001', category: '餐饮' },
  { code: 'B-203', name: '优衣库', tenantName: '迅销(中国)商贸有限公司', floor: '2F', area: 'B区', contact: '李店长', phone: '139****2003', category: '服饰' },
  { code: 'C-305', name: '海底捞火锅', tenantName: '四川海底捞餐饮股份有限公司', floor: '3F', area: 'C区', contact: '张店长', phone: '137****3005', category: '餐饮' },
  { code: 'A-108', name: '喜茶', tenantName: '深圳市喜茶投资有限公司', floor: '1F', area: 'A区', contact: '陈店长', phone: '136****1008', category: '餐饮' },
  { code: 'B-115', name: '小米之家', tenantName: '小米通讯技术有限公司', floor: '1F', area: 'B区', contact: '刘店长', phone: '135****1115', category: '数码' },
  { code: 'D-L1', name: '中庭活动区', tenantName: '商场公共区域', floor: '1F', area: 'D区中庭', contact: '运营部', phone: '021-8888-0000', category: '公共区域' }
]

export const mockStaff: StaffInfo[] = [
  { id: 's001', name: '赵晓雯', role: '客诉专员', department: '客户服务部', phone: '138****0001' },
  { id: 's002', name: '钱建国', role: '运营主管', department: '商场运营部', phone: '138****0002' },
  { id: 's003', name: '孙立伟', role: '物业主管', department: '物业工程部', phone: '138****0003' },
  { id: 's004', name: '周雨晴', role: '租户关系专员', department: '商场运营部', phone: '138****0004' },
  { id: 's005', name: '吴明哲', role: '运营经理', department: '商场运营部', phone: '138****0005' },
  { id: 's006', name: '郑小芳', role: '客诉主管', department: '客户服务部', phone: '138****0006' }
]

const baseTime = dayjs('2026-06-11 09:00:00')

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`
}

const complaint1: Complaint = {
  id: 'c_001',
  code: 'CS-2026-0611-001',
  title: '中庭端午市集活动占道 顾客通行受阻投诉',
  category: 'activity_occupation',
  status: 'visiting',
  description: '顾客反映1楼中庭端午市集活动帐篷摆放超出划定区域，占用主通道约50公分，婴儿车和轮椅无法正常通过。有老年人绕行时差点绊倒。顾客要求立即整改并设置明显通道标识。',
  complaintSource: 'customer',
  complainantName: '陈女士',
  complainantPhone: '139****8821',
  complainantType: 'customer',
  locationFloor: '1F',
  locationArea: 'D区中庭',
  shopCode: 'D-L1',
  shopName: '中庭活动区',
  tenantName: '商场公共区域',
  registeredBy: '赵晓雯',
  registeredByRole: '客诉专员',
  registeredAt: baseTime.subtract(6, 'hour').format('YYYY-MM-DD HH:mm:ss'),
  currentHandler: '周雨晴',
  currentHandlerRole: '租户关系专员',
  assignedAt: baseTime.subtract(5, 'hour').subtract(20, 'minute').format('YYYY-MM-DD HH:mm:ss'),
  slaDeadline: baseTime.add(2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
  slaLevel: 'warning',
  responsibilityParty: 'mall_ops',
  responsibilityPartyDetail: '商场运营部活动组未按审批图纸摆放，活动承办方执行不到位',
  priority: 'high',
  activityName: '2026端午好物市集',
  activityOrganizer: '上海策源会展有限公司',
  keyJudgements: [
    {
      id: uid('kj'),
      content: '活动占道属实。经现场测量，实际占用通道宽度超出审批范围60cm，违反《商场活动场地使用规范》第4.2条。运营部活动组在搭建验收环节存在疏漏。',
      operator: '钱建国',
      operatorRole: '运营主管',
      createdAt: baseTime.subtract(5, 'hour').subtract(10, 'minute').format('YYYY-MM-DD HH:mm:ss'),
      type: 'responsibility'
    },
    {
      id: uid('kj'),
      content: '根因：活动搭建时间安排在凌晨非营业时间，运营部值班人员未按图纸逐项复核，承办方擅自将帐篷外移增加摊位面积。',
      operator: '钱建国',
      operatorRole: '运营主管',
      createdAt: baseTime.subtract(5, 'hour').subtract(5, 'minute').format('YYYY-MM-DD HH:mm:ss'),
      type: 'root_cause'
    },
    {
      id: uid('kj'),
      content: 'SLA预警：距处理时限还有2小时，需在12:00前完成摊位调整并回访投诉顾客。',
      operator: '系统',
      operatorRole: 'SLA监控',
      createdAt: baseTime.subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
      type: 'sla'
    }
  ],
  statusHistory: [
    { id: uid('sh'), fromStatus: null, toStatus: 'registered', operator: '赵晓雯', operatorRole: '客诉专员', remark: '顾客现场投诉，已登记基本信息并安抚', createdAt: baseTime.subtract(6, 'hour').format('YYYY-MM-DD HH:mm:ss') },
    { id: uid('sh'), fromStatus: 'registered', toStatus: 'judging', operator: '赵晓雯', operatorRole: '客诉专员', remark: '转运营主管判定责任归属', createdAt: baseTime.subtract(5, 'hour').subtract(30, 'minute').format('YYYY-MM-DD HH:mm:ss') },
    { id: uid('sh'), fromStatus: 'judging', toStatus: 'assigned', operator: '钱建国', operatorRole: '运营主管', remark: '判定运营部活动组主责，派单周雨晴协调承办方整改', createdAt: baseTime.subtract(5, 'hour').subtract(20, 'minute').format('YYYY-MM-DD HH:mm:ss') },
    { id: uid('sh'), fromStatus: 'assigned', toStatus: 'processing', operator: '周雨晴', operatorRole: '租户关系专员', remark: '已联系承办方现场负责人，正在调整摊位位置', createdAt: baseTime.subtract(4, 'hour').subtract(30, 'minute').format('YYYY-MM-DD HH:mm:ss') },
    { id: uid('sh'), fromStatus: 'processing', toStatus: 'visiting', operator: '周雨晴', operatorRole: '租户关系专员', remark: '摊位已调整回审批位置，通道宽度恢复3.2米，安排回访', createdAt: baseTime.subtract(30, 'minute').format('YYYY-MM-DD HH:mm:ss') }
  ],
  exceptionNotes: [
    {
      id: uid('en'),
      complaintId: 'c_001',
      type: 'sla_overdue',
      title: '处理即将超时提醒',
      content: '该投诉SLA时限为登记后8小时内闭环，当前剩余不足2小时。如回访不通过将触发超时升级至运营经理。',
      operator: '系统',
      operatorRole: 'SLA监控',
      createdAt: baseTime.subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss')
    }
  ],
  tenantVisits: [
    {
      id: uid('tv'),
      complaintId: 'c_001',
      visitTime: null,
      visitor: '周雨晴',
      visitorRole: '租户关系专员',
      tenantContact: '陈女士',
      tenantPhone: '139****8821',
      tenantName: '投诉顾客',
      shopCode: '',
      result: 'pending',
      feedback: '',
      improvementItems: [],
      nextFollowUp: null,
      createdAt: baseTime.subtract(30, 'minute').format('YYYY-MM-DD HH:mm:ss'),
      updatedAt: baseTime.subtract(30, 'minute').format('YYYY-MM-DD HH:mm:ss')
    }
  ],
  attachments: ['现场占道照片1.jpg', '通道宽度测量图.jpg'],
  closedAt: null
}

const complaint2: Complaint = {
  id: 'c_002',
  code: 'CS-2026-0611-002',
  title: '海底捞后厨空调漏水报修36小时未处理',
  category: 'repair_timeout',
  status: 'processing',
  description: '租户海底捞(C-305)于6月9日晚22:00报修后厨空调外机漏水，物业工程部接单后仅派人查看一次，至今36小时未安排维修。漏水导致后厨地面积水，存在滑倒风险，租户担心影响食品安全和员工安全。',
  complaintSource: 'tenant',
  complainantName: '张店长',
  complainantPhone: '137****3005',
  complainantType: 'tenant',
  locationFloor: '3F',
  locationArea: 'C区',
  shopCode: 'C-305',
  shopName: '海底捞火锅',
  tenantName: '四川海底捞餐饮股份有限公司',
  registeredBy: '赵晓雯',
  registeredByRole: '客诉专员',
  registeredAt: baseTime.subtract(4, 'hour').subtract(30, 'minute').format('YYYY-MM-DD HH:mm:ss'),
  currentHandler: '孙立伟',
  currentHandlerRole: '物业主管',
  assignedAt: baseTime.subtract(4, 'hour').format('YYYY-MM-DD HH:mm:ss'),
  slaDeadline: baseTime.add(30, 'minute').format('YYYY-MM-DD HH:mm:ss'),
  slaLevel: 'overdue',
  responsibilityParty: 'property',
  responsibilityPartyDetail: '物业工程部维修工单分派遗漏，属物业内部流程问题',
  priority: 'urgent',
  repairType: '空调系统维修',
  repairTimeoutHours: 36,
  keyJudgements: [
    {
      id: uid('kj'),
      content: '报修超时事实清楚。物业工单系统显示该报修单被错误分配至已休假的维修班组，导致无人跟进。租户在36小时内电话催修3次均未有效响应。',
      operator: '吴明哲',
      operatorRole: '运营经理',
      createdAt: baseTime.subtract(4, 'hour').subtract(10, 'minute').format('YYYY-MM-DD HH:mm:ss'),
      type: 'responsibility'
    },
    {
      id: uid('kj'),
      content: '已严重超时。SLA标准：餐饮租户设备报修响应时间≤2小时，修复≤24小时。该单已超时12小时以上，需立即处理并纳入物业月度考核。',
      operator: '吴明哲',
      operatorRole: '运营经理',
      createdAt: baseTime.subtract(4, 'hour').subtract(5, 'minute').format('YYYY-MM-DD HH:mm:ss'),
      type: 'sla'
    },
    {
      id: uid('kj'),
      content: '风险评估：后厨积水+食品安全隐患，如不立即处理可能触发食药监检查风险和租户索赔。建议物业部先做应急排水处理。',
      operator: '吴明哲',
      operatorRole: '运营经理',
      createdAt: baseTime.subtract(4, 'hour').format('YYYY-MM-DD HH:mm:ss'),
      type: 'escalation'
    }
  ],
  statusHistory: [
    { id: uid('sh'), fromStatus: null, toStatus: 'registered', operator: '赵晓雯', operatorRole: '客诉专员', remark: '租户来电投诉，情绪较激动，已安抚并告知加急处理', createdAt: baseTime.subtract(4, 'hour').subtract(30, 'minute').format('YYYY-MM-DD HH:mm:ss') },
    { id: uid('sh'), fromStatus: 'registered', toStatus: 'judging', operator: '郑小芳', operatorRole: '客诉主管', remark: '涉及物业报修超时，升级运营经理介入判定', createdAt: baseTime.subtract(4, 'hour').subtract(20, 'minute').format('YYYY-MM-DD HH:mm:ss') },
    { id: uid('sh'), fromStatus: 'judging', toStatus: 'assigned', operator: '吴明哲', operatorRole: '运营经理', remark: '物业全责，直接派单物业主管孙立伟亲自跟进', createdAt: baseTime.subtract(4, 'hour').format('YYYY-MM-DD HH:mm:ss') },
    { id: uid('sh'), fromStatus: 'assigned', toStatus: 'processing', operator: '孙立伟', operatorRole: '物业主管', remark: '已带维修班组和应急抽水设备赶赴现场', createdAt: baseTime.subtract(20, 'minute').format('YYYY-MM-DD HH:mm:ss') }
  ],
  exceptionNotes: [
    {
      id: uid('en'),
      complaintId: 'c_002',
      type: 'sla_overdue',
      title: '维修SLA严重超时',
      content: '该报修单从6月9日22:00至6月11日10:30，实际耗时36.5小时，远超24小时修复标准。超时原因：物业工单系统分派错误+班组交接遗漏。建议复盘物业报修流程。',
      operator: '吴明哲',
      operatorRole: '运营经理',
      createdAt: baseTime.subtract(3, 'hour').subtract(50, 'minute').format('YYYY-MM-DD HH:mm:ss')
    },
    {
      id: uid('en'),
      complaintId: 'c_002',
      type: 'escalation',
      title: '升级至运营经理处理',
      content: '因涉及食品安全风险且租户明确表示如今日中午前不修复将正式发函索赔，按《投诉分级处理机制》第3.2条升级至运营经理层级处理。',
      operator: '郑小芳',
      operatorRole: '客诉主管',
      createdAt: baseTime.subtract(4, 'hour').subtract(20, 'minute').format('YYYY-MM-DD HH:mm:ss')
    }
  ],
  tenantVisits: [],
  attachments: ['报修工单截图.png', '漏水现场视频.mp4'],
  closedAt: null
}

const complaint3: Complaint = {
  id: 'c_003',
  code: 'CS-2026-0611-003',
  title: '儿童区地面污渍 租户与物业互相推诿',
  category: 'attribution_unclear',
  status: 'judging',
  description: '顾客反映2楼儿童游乐区入口地面有冰淇淋污渍未及时清理，孩子滑倒衣服弄脏。投诉到服务台后，物业保洁称该区域属租户管理范围，租户小米之家(租用儿童区旁商铺)称公共走道不归他们管，双方互相推诿近1小时污渍仍未清理。',
  complaintSource: 'customer',
  complainantName: '黄先生',
  complainantPhone: '135****6677',
  complainantType: 'customer',
  locationFloor: '2F',
  locationArea: 'B区儿童区',
  shopCode: 'B-115',
  shopName: '小米之家',
  tenantName: '小米通讯技术有限公司',
  registeredBy: '赵晓雯',
  registeredByRole: '客诉专员',
  registeredAt: baseTime.subtract(2, 'hour').subtract(40, 'minute').format('YYYY-MM-DD HH:mm:ss'),
  currentHandler: '钱建国',
  currentHandlerRole: '运营主管',
  assignedAt: baseTime.subtract(2, 'hour').subtract(20, 'minute').format('YYYY-MM-DD HH:mm:ss'),
  slaDeadline: baseTime.add(5, 'hour').format('YYYY-MM-DD HH:mm:ss'),
  slaLevel: 'normal',
  responsibilityParty: 'undetermined',
  responsibilityPartyDetail: '待运营主管现场确认保洁责任归属',
  priority: 'normal',
  keyJudgements: [
    {
      id: uid('kj'),
      content: '责任归属争议焦点：1) 污渍位置在小米之家店门外约1.5米处；2) 物业合同约定商铺门口3米范围为租户保洁责任；3) 租户认为"儿童区"是商场公共区域应由物业负责。需运营主管对照图纸确认。',
      operator: '钱建国',
      operatorRole: '运营主管',
      createdAt: baseTime.subtract(2, 'hour').subtract(15, 'minute').format('YYYY-MM-DD HH:mm:ss'),
      type: 'responsibility'
    }
  ],
  statusHistory: [
    { id: uid('sh'), fromStatus: null, toStatus: 'registered', operator: '赵晓雯', operatorRole: '客诉专员', remark: '顾客投诉，已登记，污渍已通知保洁临时清理', createdAt: baseTime.subtract(2, 'hour').subtract(40, 'minute').format('YYYY-MM-DD HH:mm:ss') },
    { id: uid('sh'), fromStatus: 'registered', toStatus: 'judging', operator: '郑小芳', operatorRole: '客诉主管', remark: '涉及责任归属不清，转运营主管判定', createdAt: baseTime.subtract(2, 'hour').subtract(20, 'minute').format('YYYY-MM-DD HH:mm:ss') }
  ],
  exceptionNotes: [
    {
      id: uid('en'),
      complaintId: 'c_003',
      type: 'attribution_dispute',
      title: '保洁责任归属争议',
      content: '物业与小米之家对商铺门口区域保洁责任界定不一致。物业引用《商铺管理公约》附件三第2条"门前三包3米范围"，租户引用《租赁合同》第8.3条"公共区域由物业负责"。需运营部对照原始图纸和两份合同条款最终判定。',
      operator: '钱建国',
      operatorRole: '运营主管',
      createdAt: baseTime.subtract(2, 'hour').subtract(10, 'minute').format('YYYY-MM-DD HH:mm:ss')
    }
  ],
  tenantVisits: [],
  attachments: ['污渍位置照片.jpg', '区域分界图纸待调取'],
  closedAt: null
}

const complaint4: Complaint = {
  id: 'c_004',
  code: 'CS-2026-0611-004',
  title: '喜茶外摆桌椅占用消防通道',
  category: 'activity_occupation',
  status: 'assigned',
  description: '巡场发现喜茶(A-108)外摆区桌椅超出商场规定范围，占用消防疏散通道约1米宽度，现场无疏散指示标识。立即通知租户整改但店长表示外摆是总部统一设计无法自行缩减。',
  complaintSource: 'patrol',
  complainantName: '巡场组',
  complainantPhone: '021-8888-0011',
  complainantType: 'staff',
  locationFloor: '1F',
  locationArea: 'A区',
  shopCode: 'A-108',
  shopName: '喜茶',
  tenantName: '深圳市喜茶投资有限公司',
  registeredBy: '赵晓雯',
  registeredByRole: '客诉专员',
  registeredAt: baseTime.subtract(1, 'hour').subtract(50, 'minute').format('YYYY-MM-DD HH:mm:ss'),
  currentHandler: '周雨晴',
  currentHandlerRole: '租户关系专员',
  assignedAt: baseTime.subtract(1, 'hour').subtract(30, 'minute').format('YYYY-MM-DD HH:mm:ss'),
  slaDeadline: baseTime.add(30, 'minute').format('YYYY-MM-DD HH:mm:ss'),
  slaLevel: 'warning',
  responsibilityParty: 'tenant',
  responsibilityPartyDetail: '租户喜茶未按商场外摆规范执行，消防通道属红线不可占用',
  priority: 'urgent',
  keyJudgements: [
    {
      id: uid('kj'),
      content: '消防通道占用为零容忍项，无论任何理由必须立即整改。租户"总部设计"不构成违规理由，运营部需发正式整改通知，1小时内未整改将强制撤移。',
      operator: '钱建国',
      operatorRole: '运营主管',
      createdAt: baseTime.subtract(1, 'hour').subtract(40, 'minute').format('YYYY-MM-DD HH:mm:ss'),
      type: 'responsibility'
    }
  ],
  statusHistory: [
    { id: uid('sh'), fromStatus: null, toStatus: 'registered', operator: '赵晓雯', operatorRole: '客诉专员', remark: '巡场组工单录入，已记录现场情况', createdAt: baseTime.subtract(1, 'hour').subtract(50, 'minute').format('YYYY-MM-DD HH:mm:ss') },
    { id: uid('sh'), fromStatus: 'registered', toStatus: 'judging', operator: '钱建国', operatorRole: '运营主管', remark: '判定为消防红线事项，直接定级紧急', createdAt: baseTime.subtract(1, 'hour').subtract(40, 'minute').format('YYYY-MM-DD HH:mm:ss') },
    { id: uid('sh'), fromStatus: 'judging', toStatus: 'assigned', operator: '钱建国', operatorRole: '运营主管', remark: '派单租户关系专员协调喜茶店长立即整改', createdAt: baseTime.subtract(1, 'hour').subtract(30, 'minute').format('YYYY-MM-DD HH:mm:ss') }
  ],
  exceptionNotes: [],
  tenantVisits: [],
  attachments: ['外摆占道照片.jpg', '消防通道规范图.jpg'],
  closedAt: null
}

const complaint5: Complaint = {
  id: 'c_005',
  code: 'CS-2026-0610-015',
  title: '优衣库试衣间门损坏已处理 待租户确认',
  category: 'facility',
  status: 'visiting',
  description: '6月10日顾客投诉优衣库3楼女试衣间门锁损坏无法锁闭，物业已完成维修更换。现需回访租户确认维修质量及是否有后续问题。',
  complaintSource: 'customer',
  complainantName: '林女士',
  complainantPhone: '136****4433',
  complainantType: 'customer',
  locationFloor: '2F',
  locationArea: 'B区',
  shopCode: 'B-203',
  shopName: '优衣库',
  tenantName: '迅销(中国)商贸有限公司',
  registeredBy: '赵晓雯',
  registeredByRole: '客诉专员',
  registeredAt: dayjs('2026-06-10 15:20:00').format('YYYY-MM-DD HH:mm:ss'),
  currentHandler: '周雨晴',
  currentHandlerRole: '租户关系专员',
  assignedAt: dayjs('2026-06-10 16:00:00').format('YYYY-MM-DD HH:mm:ss'),
  slaDeadline: dayjs('2026-06-11 12:00:00').format('YYYY-MM-DD HH:mm:ss'),
  slaLevel: 'normal',
  responsibilityParty: 'property',
  responsibilityPartyDetail: '物业工程部日常巡检疏漏',
  priority: 'normal',
  repairType: '门锁维修',
  keyJudgements: [
    {
      id: uid('kj'),
      content: '门锁损坏属物业设施巡检范围，按合同约定物业应每日巡检公共设施。该试衣间门锁损坏时间约2-3天未被发现，物业需加强巡检频次。',
      operator: '孙立伟',
      operatorRole: '物业主管',
      createdAt: dayjs('2026-06-10 17:00:00').format('YYYY-MM-DD HH:mm:ss'),
      type: 'responsibility'
    }
  ],
  statusHistory: [
    { id: uid('sh'), fromStatus: null, toStatus: 'registered', operator: '赵晓雯', operatorRole: '客诉专员', remark: '顾客投诉，已致歉并安排临时处理', createdAt: dayjs('2026-06-10 15:20:00').format('YYYY-MM-DD HH:mm:ss') },
    { id: uid('sh'), fromStatus: 'registered', toStatus: 'judging', operator: '赵晓雯', operatorRole: '客诉专员', remark: '转物业判定', createdAt: dayjs('2026-06-10 15:40:00').format('YYYY-MM-DD HH:mm:ss') },
    { id: uid('sh'), fromStatus: 'judging', toStatus: 'assigned', operator: '孙立伟', operatorRole: '物业主管', remark: '物业负责，派单维修班组', createdAt: dayjs('2026-06-10 16:00:00').format('YYYY-MM-DD HH:mm:ss') },
    { id: uid('sh'), fromStatus: 'assigned', toStatus: 'processing', operator: '孙立伟', operatorRole: '物业主管', remark: '维修班组已到场更换锁具', createdAt: dayjs('2026-06-10 17:30:00').format('YYYY-MM-DD HH:mm:ss') },
    { id: uid('sh'), fromStatus: 'processing', toStatus: 'visiting', operator: '孙立伟', operatorRole: '物业主管', remark: '维修完成，转租户关系专员回访', createdAt: dayjs('2026-06-10 19:00:00').format('YYYY-MM-DD HH:mm:ss') }
  ],
  exceptionNotes: [],
  tenantVisits: [
    {
      id: uid('tv'),
      complaintId: 'c_005',
      visitTime: null,
      visitor: '周雨晴',
      visitorRole: '租户关系专员',
      tenantContact: '李店长',
      tenantPhone: '139****2003',
      tenantName: '迅销(中国)商贸有限公司',
      shopCode: 'B-203',
      result: 'pending',
      feedback: '',
      improvementItems: [],
      nextFollowUp: null,
      createdAt: dayjs('2026-06-10 19:00:00').format('YYYY-MM-DD HH:mm:ss'),
      updatedAt: dayjs('2026-06-10 19:00:00').format('YYYY-MM-DD HH:mm:ss')
    }
  ],
  attachments: ['旧锁具照片.jpg'],
  closedAt: null
}

const complaint6: Complaint = {
  id: 'c_006',
  code: 'CS-2026-0609-008',
  title: '星巴克音乐音量过大扰民 已回访满意',
  category: 'noise',
  status: 'closed',
  description: '6月9日3楼海底捞顾客投诉1楼星巴克背景音乐音量过大，跨楼层影响就餐环境。经协调星巴克已调低音量并调整高峰期音乐方案。回访顾客和租户双方均无异议，正常结案。',
  complaintSource: 'customer',
  complainantName: '匿名顾客',
  complainantPhone: '',
  complainantType: 'customer',
  locationFloor: '1F',
  locationArea: 'A区',
  shopCode: 'A-101',
  shopName: '星巴克咖啡',
  tenantName: '星巴克咖啡(上海)有限公司',
  registeredBy: '赵晓雯',
  registeredByRole: '客诉专员',
  registeredAt: dayjs('2026-06-09 12:30:00').format('YYYY-MM-DD HH:mm:ss'),
  currentHandler: '周雨晴',
  currentHandlerRole: '租户关系专员',
  assignedAt: dayjs('2026-06-09 13:00:00').format('YYYY-MM-DD HH:mm:ss'),
  slaDeadline: dayjs('2026-06-09 20:30:00').format('YYYY-MM-DD HH:mm:ss'),
  slaLevel: 'normal',
  responsibilityParty: 'tenant',
  responsibilityPartyDetail: '租户星巴克音量控制未遵守商场规范',
  priority: 'normal',
  keyJudgements: [
    {
      id: uid('kj'),
      content: '商场《商户经营管理规范》第6.3条明确背景音乐音量≤60分贝。现场测量峰值68分贝，租户确有违规。要求调整并在11:30-13:30就餐高峰降至55分贝以下。',
      operator: '钱建国',
      operatorRole: '运营主管',
      createdAt: dayjs('2026-06-09 13:20:00').format('YYYY-MM-DD HH:mm:ss'),
      type: 'responsibility'
    }
  ],
  statusHistory: [
    { id: uid('sh'), fromStatus: null, toStatus: 'registered', operator: '赵晓雯', operatorRole: '客诉专员', remark: '顾客匿名投诉', createdAt: dayjs('2026-06-09 12:30:00').format('YYYY-MM-DD HH:mm:ss') },
    { id: uid('sh'), fromStatus: 'registered', toStatus: 'judging', operator: '赵晓雯', operatorRole: '客诉专员', remark: '转运营判定', createdAt: dayjs('2026-06-09 12:45:00').format('YYYY-MM-DD HH:mm:ss') },
    { id: uid('sh'), fromStatus: 'judging', toStatus: 'assigned', operator: '钱建国', operatorRole: '运营主管', remark: '租户责任，派单租户关系专员', createdAt: dayjs('2026-06-09 13:00:00').format('YYYY-MM-DD HH:mm:ss') },
    { id: uid('sh'), fromStatus: 'assigned', toStatus: 'processing', operator: '周雨晴', operatorRole: '租户关系专员', remark: '已和星巴克店长沟通，同意调低音量', createdAt: dayjs('2026-06-09 14:00:00').format('YYYY-MM-DD HH:mm:ss') },
    { id: uid('sh'), fromStatus: 'processing', toStatus: 'visiting', operator: '周雨晴', operatorRole: '租户关系专员', remark: '音量已调低，现场复测58分贝达标，安排回访', createdAt: dayjs('2026-06-09 15:30:00').format('YYYY-MM-DD HH:mm:ss') },
    { id: uid('sh'), fromStatus: 'visiting', toStatus: 'completed', operator: '周雨晴', operatorRole: '租户关系专员', remark: '回访反馈满意', createdAt: dayjs('2026-06-09 18:00:00').format('YYYY-MM-DD HH:mm:ss') },
    { id: uid('sh'), fromStatus: 'completed', toStatus: 'closed', operator: '郑小芳', operatorRole: '客诉主管', remark: '审核通过，正常结案', createdAt: dayjs('2026-06-09 20:00:00').format('YYYY-MM-DD HH:mm:ss') }
  ],
  exceptionNotes: [],
  tenantVisits: [
    {
      id: uid('tv'),
      complaintId: 'c_006',
      visitTime: dayjs('2026-06-09 18:00:00').format('YYYY-MM-DD HH:mm:ss'),
      visitor: '周雨晴',
      visitorRole: '租户关系专员',
      tenantContact: '王经理',
      tenantPhone: '138****1001',
      tenantName: '星巴克咖啡(上海)有限公司',
      shopCode: 'A-101',
      result: 'satisfied',
      feedback: '店长非常配合，已安排员工在就餐高峰主动调低音量。同时提出商场空调出风口正对门店冷柜希望调整，已转物业关注。',
      improvementItems: ['已纳入租户月度巡检清单，每两周抽查一次音量', '物业工程部评估空调出风口调整方案'],
      nextFollowUp: dayjs('2026-06-23').format('YYYY-MM-DD'),
      createdAt: dayjs('2026-06-09 15:30:00').format('YYYY-MM-DD HH:mm:ss'),
      updatedAt: dayjs('2026-06-09 18:00:00').format('YYYY-MM-DD HH:mm:ss')
    }
  ],
  attachments: ['音量测量记录.xlsx'],
  closedAt: dayjs('2026-06-09 20:00:00').format('YYYY-MM-DD HH:mm:ss'),
  closedBy: '郑小芳',
  closingRemark: '处理流程规范，回访记录完整，租户积极配合，同意结案。'
}

export const mockComplaints: Complaint[] = [
  complaint1,
  complaint2,
  complaint3,
  complaint4,
  complaint5,
  complaint6
]
