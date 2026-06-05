import type {
  Complaint,
  ActionLog,
  Compensation,
  CreateComplaintRequest,
  ActionRequest,
  CreateCompensationRequest,
  ComplaintStatus,
  UserRole,
  Priority,
  ComplaintType,
} from '../../shared/types.js';
import { v4 as uuidv4 } from 'uuid';

let complaints: Complaint[] = [];
let actionLogs: ActionLog[] = [];
let compensations: Compensation[] = [];

export function generateComplaintNo(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `TS-${dateStr}-${random}`;
}

export function initSeedData() {
  if (complaints.length > 0) return;

  const now = new Date();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000).toISOString();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString();

  const c1: Complaint = {
    id: uuidv4(),
    complaintNo: 'TS-20260603-0001',
    customerName: '张先生',
    customerPhone: '13800138001',
    type: 'venue',
    source: 'onsite',
    priority: 'high',
    title: '场地地面湿滑导致摔倒',
    description: '客户在3号场地打球时，因地面清洁后未干滑倒，膝盖擦伤。已陪同前往社区医院做简单处理，医疗费用暂由球馆垫付。',
    status: 'pending_review',
    currentHandlerRole: 'manager',
    currentHandlerName: '值班店长',
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
    createdBy: '李前台',
    actionLogs: [],
    compensations: [],
  };

  const c2: Complaint = {
    id: uuidv4(),
    complaintNo: 'TS-20260602-0002',
    customerName: '王女士',
    customerPhone: '13900139002',
    type: 'service',
    source: 'phone',
    priority: 'urgent',
    title: '教练迟到且态度恶劣',
    description: '预约的私教课程，教练迟到40分钟，沟通时态度不耐烦。客户要求全额退款并赔偿误工费。',
    relatedCoach: '陈教练',
    status: 'review_rejected',
    currentHandlerRole: 'reception',
    currentHandlerName: '场馆前台',
    createdAt: daysAgo(2),
    updatedAt: hoursAgo(5),
    createdBy: '李前台',
    actionLogs: [],
    compensations: [],
  };

  const c3: Complaint = {
    id: uuidv4(),
    complaintNo: 'TS-20260601-0003',
    customerName: '刘先生',
    customerPhone: '13700137003',
    type: 'equipment',
    source: 'wechat',
    priority: 'medium',
    title: '球拍拉线磅数不符',
    description: '客户送来的球拍要求拉26磅，取货时发现实际24磅。客户是比赛选手，因磅数不对影响了比赛发挥。',
    status: 'pending_compensation',
    currentHandlerRole: 'manager',
    currentHandlerName: '王店长',
    createdAt: daysAgo(4),
    updatedAt: hoursAgo(30),
    createdBy: '李前台',
    actionLogs: [],
    compensations: [],
  };

  const c4: Complaint = {
    id: uuidv4(),
    complaintNo: 'TS-20260530-0004',
    customerName: '赵小姐',
    customerPhone: '13600136004',
    type: 'billing',
    source: 'onsite',
    priority: 'high',
    title: '会员卡扣费异常',
    description: '客户反映会员卡余额被扣多了，实际消费应该是120元，但扣了200元。经核查确为系统计费模块bug导致。',
    status: 'completed',
    currentHandlerRole: 'manager',
    currentHandlerName: '王店长',
    createdAt: daysAgo(7),
    updatedAt: daysAgo(5),
    createdBy: '李前台',
    actionLogs: [],
    compensations: [],
  };

  const c5: Complaint = {
    id: uuidv4(),
    complaintNo: 'TS-20260604-0005',
    customerName: '孙先生',
    customerPhone: '13500135005',
    type: 'booking',
    source: 'phone',
    priority: 'medium',
    title: '预约场地被临时取消',
    description: '客户提前一周预约的周六场地，当天被通知场地有活动占用，无法使用。客户要求赔偿场地费差价。',
    status: 'draft',
    currentHandlerRole: 'reception',
    currentHandlerName: '李前台',
    createdAt: hoursAgo(5),
    updatedAt: hoursAgo(5),
    createdBy: '李前台',
    actionLogs: [],
    compensations: [],
  };

  const c6: Complaint = {
    id: uuidv4(),
    complaintNo: 'TS-20260528-0006',
    customerName: '周先生',
    customerPhone: '13400134006',
    type: 'service',
    source: 'onsite',
    priority: 'high',
    title: '私教课程频繁更换教练',
    description: '客户购买了30节私教课，三个月内换了4个教练，训练计划完全被打乱。客户要求退还剩余课程费用。',
    relatedCoach: '陈教练',
    status: 'compensation_rejected',
    currentHandlerRole: 'reception',
    currentHandlerName: '场馆前台',
    createdAt: daysAgo(10),
    updatedAt: hoursAgo(12),
    createdBy: '李前台',
    actionLogs: [],
    compensations: [],
  };

  const c7: Complaint = {
    id: uuidv4(),
    complaintNo: 'TS-20260525-0007',
    customerName: '吴女士',
    customerPhone: '13300133007',
    type: 'venue',
    source: 'wechat',
    priority: 'low',
    title: '更衣室淋浴水温不稳定',
    description: '客户反映更衣室淋浴水温忽冷忽热，影响使用体验。建议检修热水器。',
    status: 'completed',
    currentHandlerRole: 'manager',
    currentHandlerName: '王店长',
    createdAt: daysAgo(14),
    updatedAt: daysAgo(10),
    createdBy: '李前台',
    actionLogs: [],
    compensations: [],
  };

  complaints = [c1, c2, c3, c4, c5, c6, c7];

  actionLogs = [
    { id: uuidv4(), complaintId: c1.id, actionType: 'create', operatorRole: 'reception', operatorName: '李前台', timestamp: daysAgo(2), remark: '客户现场投诉，已登记基本信息，客户膝盖有明显擦伤' },
    { id: uuidv4(), complaintId: c1.id, actionType: 'note', operatorRole: 'reception', operatorName: '李前台', timestamp: daysAgo(2), remark: '已陪同客户前往社区医院，医生诊断为皮外伤，开具了碘伏和创可贴，医疗费用86元' },
    { id: uuidv4(), complaintId: c1.id, actionType: 'submit', operatorRole: 'reception', operatorName: '李前台', timestamp: hoursAgo(26), remark: '提交初审，请店长审核医疗费用报销及后续补偿方案' },
    { id: uuidv4(), complaintId: c2.id, actionType: 'create', operatorRole: 'reception', operatorName: '李前台', timestamp: daysAgo(3), remark: '电话投诉，客户情绪激动，要求当天给出处理结果' },
    { id: uuidv4(), complaintId: c2.id, actionType: 'note', operatorRole: 'reception', operatorName: '李前台', timestamp: daysAgo(3), remark: '客户购买了10节私教课，已上3节，课程费用3000元' },
    { id: uuidv4(), complaintId: c2.id, actionType: 'submit', operatorRole: 'reception', operatorName: '李前台', timestamp: daysAgo(2), remark: '提交初审' },
    { id: uuidv4(), complaintId: c2.id, actionType: 'review_reject', operatorRole: 'manager', operatorName: '王店长', timestamp: daysAgo(1), rejectReason: '1. 缺少教练本人的书面确认说明；2. 未记录客户的具体诉求金额；3. 缺少课程合同相关信息。请补充完整后重提。' },
    { id: uuidv4(), complaintId: c2.id, actionType: 'note', operatorRole: 'coach', operatorName: '陈教练', timestamp: hoursAgo(8), remark: '当时因前一节课学员临时加练导致拖堂，确实迟到了40分钟。沟通时因连续上课比较疲惫，态度不好，在此向客户道歉。已提交书面情况说明。' },
    { id: uuidv4(), complaintId: c3.id, actionType: 'create', operatorRole: 'reception', operatorName: '李前台', timestamp: daysAgo(5), remark: '微信客服转来的投诉，客户提供了磅数测量照片' },
    { id: uuidv4(), complaintId: c3.id, actionType: 'note', operatorRole: 'reception', operatorName: '李前台', timestamp: daysAgo(5), remark: '已与拉线师确认，确实是工作疏忽拉成了24磅。拉线费用50元。' },
    { id: uuidv4(), complaintId: c3.id, actionType: 'submit', operatorRole: 'reception', operatorName: '李前台', timestamp: daysAgo(5), remark: '提交初审' },
    { id: uuidv4(), complaintId: c3.id, actionType: 'review_approve', operatorRole: 'manager', operatorName: '王店长', timestamp: daysAgo(4), remark: '情况属实，进入补偿流程。建议除免费重拉外，额外赠送一次手胶更换作为补偿。' },
    { id: uuidv4(), complaintId: c3.id, actionType: 'compensation_propose', operatorRole: 'reception', operatorName: '李前台', timestamp: hoursAgo(30), remark: '按照店长指示提出补偿方案：免费重新拉线 + 赠送一次手胶更换服务' },
    { id: uuidv4(), complaintId: c4.id, actionType: 'create', operatorRole: 'reception', operatorName: '李前台', timestamp: daysAgo(7), remark: '现场对账发现问题，客户出示了消费记录截图' },
    { id: uuidv4(), complaintId: c4.id, actionType: 'note', operatorRole: 'reception', operatorName: '李前台', timestamp: daysAgo(7), remark: '经核查，系统计费模块在晚8点时段存在bug，导致双倍扣费。已通知技术人员修复。' },
    { id: uuidv4(), complaintId: c4.id, actionType: 'submit', operatorRole: 'reception', operatorName: '李前台', timestamp: daysAgo(7), remark: '提交初审' },
    { id: uuidv4(), complaintId: c4.id, actionType: 'review_approve', operatorRole: 'manager', operatorName: '王店长', timestamp: daysAgo(6), remark: '核实是系统bug，进入补偿流程。建议退还多扣费用并赠送2小时场地券。' },
    { id: uuidv4(), complaintId: c4.id, actionType: 'compensation_propose', operatorRole: 'reception', operatorName: '李前台', timestamp: daysAgo(6), remark: '提出补偿方案：退还多扣的80元 + 赠送2小时场地券' },
    { id: uuidv4(), complaintId: c4.id, actionType: 'compensation_approve', operatorRole: 'manager', operatorName: '王店长', timestamp: daysAgo(5), remark: '补偿方案通过，已安排前台执行退款和场地券发放' },
    { id: uuidv4(), complaintId: c4.id, actionType: 'complete', operatorRole: 'manager', operatorName: '王店长', timestamp: daysAgo(5), remark: '处理完成，客户已收到退款和场地券，对处理结果表示满意。' },
    { id: uuidv4(), complaintId: c5.id, actionType: 'create', operatorRole: 'reception', operatorName: '李前台', timestamp: hoursAgo(5), remark: '电话投诉，客户称已安排好的比赛被打乱' },
    { id: uuidv4(), complaintId: c5.id, actionType: 'note', operatorRole: 'reception', operatorName: '李前台', timestamp: hoursAgo(5), remark: '客户预约的是周六下午2-4点的5号场地，场地费80元。因公司包场活动被临时取消。' },
    { id: uuidv4(), complaintId: c6.id, actionType: 'create', operatorRole: 'reception', operatorName: '李前台', timestamp: daysAgo(10), remark: '客户现场投诉，已购买30节私教课，已上12节' },
    { id: uuidv4(), complaintId: c6.id, actionType: 'note', operatorRole: 'reception', operatorName: '李前台', timestamp: daysAgo(10), remark: '课程费用9000元，剩余18节，价值5400元。先后更换了张教练、刘教练、王教练，现任陈教练。' },
    { id: uuidv4(), complaintId: c6.id, actionType: 'submit', operatorRole: 'reception', operatorName: '李前台', timestamp: daysAgo(9), remark: '提交初审' },
    { id: uuidv4(), complaintId: c6.id, actionType: 'review_reject', operatorRole: 'manager', operatorName: '王店长', timestamp: daysAgo(8), rejectReason: '缺少每次更换教练的具体时间和原因说明，以及客户每次沟通的记录。请补充后重提。' },
    { id: uuidv4(), complaintId: c6.id, actionType: 'resubmit', operatorRole: 'reception', operatorName: '李前台', timestamp: daysAgo(7), supplementaryNote: '补充说明：1. 3月15日张教练离职；2. 4月2日刘教练调至其他门店；3. 4月20日王教练因受伤休假；4. 5月10日起由陈教练接手。每次更换都已电话通知客户。', remark: '已补充教练更换的详细时间线' },
    { id: uuidv4(), complaintId: c6.id, actionType: 'review_approve', operatorRole: 'manager', operatorName: '王店长', timestamp: daysAgo(6), remark: '信息已补充完整，进入补偿流程。建议与客户协商，可安排金牌教练授课或按比例退款。' },
    { id: uuidv4(), complaintId: c6.id, actionType: 'compensation_propose', operatorRole: 'reception', operatorName: '李前台', timestamp: daysAgo(5), remark: '提出补偿方案：剩余18节课安排金牌李教练授课，并额外赠送2节课作为补偿' },
    { id: uuidv4(), complaintId: c6.id, actionType: 'compensation_reject', operatorRole: 'manager', operatorName: '王店长', timestamp: hoursAgo(12), rejectReason: '客户明确要求退款，此方案未满足客户核心诉求。请重新与客户沟通，提出双方都能接受的退款方案。' },
    { id: uuidv4(), complaintId: c7.id, actionType: 'create', operatorRole: 'reception', operatorName: '李前台', timestamp: daysAgo(14), remark: '微信公众号留言投诉' },
    { id: uuidv4(), complaintId: c7.id, actionType: 'submit', operatorRole: 'reception', operatorName: '李前台', timestamp: daysAgo(14), remark: '提交初审' },
    { id: uuidv4(), complaintId: c7.id, actionType: 'review_approve', operatorRole: 'manager', operatorName: '王店长', timestamp: daysAgo(13), remark: '已安排工程人员检修，确实是热水器温控阀故障。进入补偿流程。' },
    { id: uuidv4(), complaintId: c7.id, actionType: 'compensation_propose', operatorRole: 'reception', operatorName: '李前台', timestamp: daysAgo(12), remark: '提出补偿方案：赠送1小时场地券作为致歉' },
    { id: uuidv4(), complaintId: c7.id, actionType: 'compensation_approve', operatorRole: 'manager', operatorName: '王店长', timestamp: daysAgo(11), remark: '方案通过，已安排发放' },
    { id: uuidv4(), complaintId: c7.id, actionType: 'note', operatorRole: 'reception', operatorName: '李前台', timestamp: daysAgo(10), remark: '客户已领取场地券，热水器已修复完成' },
    { id: uuidv4(), complaintId: c7.id, actionType: 'complete', operatorRole: 'manager', operatorName: '王店长', timestamp: daysAgo(10), remark: '处理完成' },
  ];

  compensations = [
    {
      id: uuidv4(),
      complaintId: c3.id,
      type: 'free_service',
      description: '免费重新拉线 + 赠送一次手胶更换服务',
      status: 'pending',
      proposedBy: '李前台',
      proposedAt: hoursAgo(30),
    },
    {
      id: uuidv4(),
      complaintId: c4.id,
      type: 'refund',
      amount: 80,
      description: '退还多扣的80元 + 赠送2小时场地券作为补偿',
      status: 'approved',
      proposedBy: '李前台',
      proposedAt: daysAgo(6),
      approvedBy: '王店长',
      approvedAt: daysAgo(5),
    },
    {
      id: uuidv4(),
      complaintId: c6.id,
      type: 'free_service',
      description: '剩余18节课安排金牌李教练授课 + 额外赠送2节课',
      status: 'rejected',
      proposedBy: '李前台',
      proposedAt: daysAgo(5),
      approvedBy: undefined,
      approvedAt: undefined,
      rejectReason: '客户明确要求退款，此方案未满足客户核心诉求。请重新与客户沟通，提出双方都能接受的退款方案。',
    },
    {
      id: uuidv4(),
      complaintId: c7.id,
      type: 'free_service',
      description: '赠送1小时场地券作为致歉',
      status: 'approved',
      proposedBy: '李前台',
      proposedAt: daysAgo(12),
      approvedBy: '王店长',
      approvedAt: daysAgo(11),
    },
  ];

  console.log('内存数据库样例数据初始化完成！');
}

export const db = {
  complaints: {
    create: (data: CreateComplaintRequest, handlerRole: UserRole, handlerName: string): Complaint => {
      const now = new Date().toISOString();
      const complaint: Complaint = {
        id: uuidv4(),
        complaintNo: generateComplaintNo(),
        ...data,
        status: 'draft',
        currentHandlerRole: handlerRole,
        currentHandlerName: handlerName,
        createdAt: now,
        updatedAt: now,
        actionLogs: [],
        compensations: [],
      };
      complaints.unshift(complaint);
      return { ...complaint };
    },

    findById: (id: string): Complaint | null => {
      const c = complaints.find((c) => c.id === id);
      return c ? { ...c } : null;
    },

    findAll: (filters?: { status?: string; type?: string }): Complaint[] => {
      let result = [...complaints];
      if (filters?.status) {
        result = result.filter((c) => c.status === filters.status);
      }
      if (filters?.type) {
        result = result.filter((c) => c.type === filters.type);
      }
      return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },

    findByHandlerRole: (role: UserRole): Complaint[] => {
      return complaints
        .filter((c) => {
          if (role === 'coach') {
            return c.relatedCoach === '陈教练' && !['completed', 'closed'].includes(c.status);
          }
          return c.currentHandlerRole === role && !['completed', 'closed'].includes(c.status);
        })
        .sort((a, b) => {
          const priorityOrder: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
          const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
          if (pDiff !== 0) return pDiff;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
    },

    updateStatus: (id: string, status: ComplaintStatus, handlerRole: UserRole, handlerName: string): void => {
      const idx = complaints.findIndex((c) => c.id === id);
      if (idx !== -1) {
        complaints[idx].status = status;
        complaints[idx].currentHandlerRole = handlerRole;
        complaints[idx].currentHandlerName = handlerName;
        complaints[idx].updatedAt = new Date().toISOString();
      }
    },

    update: (id: string, data: Partial<CreateComplaintRequest>): void => {
      const idx = complaints.findIndex((c) => c.id === id);
      if (idx !== -1) {
        complaints[idx] = { ...complaints[idx], ...data, updatedAt: new Date().toISOString() };
      }
    },
  },

  actionLogs: {
    create: (complaintId: string, data: ActionRequest): ActionLog => {
      const log: ActionLog = {
        id: uuidv4(),
        complaintId,
        actionType: data.actionType,
        operatorRole: data.operatorRole,
        operatorName: data.operatorName,
        timestamp: new Date().toISOString(),
        remark: data.remark,
        rejectReason: data.rejectReason,
        supplementaryNote: data.supplementaryNote,
      };
      actionLogs.push(log);
      return { ...log };
    },

    findByComplaintId: (complaintId: string): ActionLog[] => {
      return actionLogs
        .filter((l) => l.complaintId === complaintId)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    },
  },

  compensations: {
    create: (complaintId: string, data: CreateCompensationRequest): Compensation => {
      const comp: Compensation = {
        id: uuidv4(),
        complaintId,
        type: data.type,
        amount: data.amount,
        description: data.description,
        status: 'pending',
        proposedBy: data.proposedBy,
        proposedAt: new Date().toISOString(),
      };
      compensations.push(comp);
      return { ...comp };
    },

    findByComplaintId: (complaintId: string): Compensation[] => {
      return compensations
        .filter((c) => c.complaintId === complaintId)
        .sort((a, b) => new Date(b.proposedAt).getTime() - new Date(a.proposedAt).getTime());
    },

    updateStatus: (id: string, status: 'approved' | 'rejected' | 'executed', approvedBy?: string, rejectReason?: string): void => {
      const idx = compensations.findIndex((c) => c.id === id);
      if (idx !== -1) {
        compensations[idx].status = status;
        if (status === 'approved' && approvedBy) {
          compensations[idx].approvedBy = approvedBy;
          compensations[idx].approvedAt = new Date().toISOString();
        }
        if (status === 'rejected' && rejectReason) {
          compensations[idx].rejectReason = rejectReason;
        }
      }
    },
  },
};
