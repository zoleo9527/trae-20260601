import cors from 'cors';
import express from 'express';
import routes from './routes';
import { db } from './models/database';
import { User, GroupTicket, TodoItem, StatusLog, GroupTicketStatus, UserRole } from './types';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const users: User[] = [
  { id: 'u1', name: '张伟', role: 'scheduling_manager' },
  { id: 'u2', name: '李娜', role: 'ticket_supervisor' },
  { id: 'u3', name: '王强', role: 'duty_manager' },
];

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function addStatusLog(
  ticketId: string,
  fromStatus: GroupTicketStatus | null,
  toStatus: GroupTicketStatus,
  operatorId: string,
  operatorRole: UserRole,
  operatorName: string,
  remark?: string
) {
  const log: StatusLog = {
    id: generateId(),
    ticketId,
    fromStatus,
    toStatus,
    operatorId,
    operatorRole,
    operatorName,
    remark,
    createdAt: new Date().toISOString(),
  };
  db.statusLogs.push(log);
}

function addTodo(
  ticketId: string,
  title: string,
  description: string,
  role: UserRole,
  slaDeadline?: string
) {
  const existingTodo = db.todos.find(t => t.ticketId === ticketId && t.role === role);
  if (existingTodo) {
    existingTodo.title = title;
    existingTodo.description = description;
    existingTodo.slaDeadline = slaDeadline;
    return;
  }
  const todo: TodoItem = {
    id: generateId(),
    ticketId,
    title,
    description,
    role,
    priority: 'high',
    slaDeadline,
    createdAt: new Date().toISOString(),
  };
  db.todos.push(todo);
}

function createCompletedTicket(): GroupTicket {
  const id = generateId();
  const now = new Date();
  const ticket: GroupTicket = {
    id,
    orderNo: 'GT20260601001',
    companyName: '华为技术有限公司',
    contactName: '陈经理',
    contactPhone: '13800138001',
    movieName: '流浪地球3',
    showDate: '2026-06-05',
    showTime: '19:00',
    hallName: '1号激光厅',
    ticketCount: 120,
    unitPrice: 45,
    totalAmount: 5400,
    status: 'completed',
    currentHandler: 'duty_manager',
    rejectRecords: [],
    createdAt: new Date(now.getTime() - 86400000 * 5).toISOString(),
    updatedAt: new Date(now.getTime() - 86400000).toISOString(),
    verificationData: {
      actualAttendance: 118,
      ticketUsed: 118,
      ticketRefunded: 2,
      remark: '2人因临时有事未到场，已办理退票',
    },
    verifiedAt: new Date(now.getTime() - 86400000 * 2).toISOString(),
    verifiedBy: 'u2',
    reviewedAt: new Date(now.getTime() - 86400000).toISOString(),
    reviewedBy: 'u3',
    reviewRemark: '核销数据准确，无误',
    slaDeadline: new Date(now.getTime() - 86400000 * 2).toISOString(),
    nextNodeTime: null,
  };

  addStatusLog(id, null, 'pending_scheduling', 'u1', 'scheduling_manager', '系统', '企业提交团体票预约');
  addStatusLog(id, 'pending_scheduling', 'scheduling_reviewing', 'u1', 'scheduling_manager', '张伟', '开始排片审核');
  addStatusLog(id, 'scheduling_reviewing', 'scheduling_approved', 'u1', 'scheduling_manager', '张伟', '排片审核通过，场次安排妥当');
  addStatusLog(id, 'scheduling_approved', 'pending_verification', 'u2', 'ticket_supervisor', '系统', '等待票务主管现场核销');
  addStatusLog(id, 'pending_verification', 'verifying', 'u2', 'ticket_supervisor', '李娜', '开始现场核销');
  addStatusLog(id, 'verifying', 'verification_pending_review', 'u2', 'ticket_supervisor', '李娜', '提交核销数据，待值班经理复核');
  addStatusLog(id, 'verification_pending_review', 'completed', 'u3', 'duty_manager', '王强', '核销复核通过，流程完成');

  return ticket;
}

function createVerificationPendingReviewTicket(): GroupTicket {
  const id = generateId();
  const now = new Date();
  const ticket: GroupTicket = {
    id,
    orderNo: 'GT20260601002',
    companyName: '阿里巴巴集团',
    contactName: '刘总监',
    contactPhone: '13800138002',
    movieName: '复仇者联盟5',
    showDate: '2026-06-06',
    showTime: '20:00',
    hallName: '3号IMAX厅',
    ticketCount: 80,
    unitPrice: 80,
    totalAmount: 6400,
    status: 'verification_pending_review',
    currentHandler: 'duty_manager',
    rejectRecords: [],
    createdAt: new Date(now.getTime() - 86400000 * 3).toISOString(),
    updatedAt: new Date(now.getTime() - 3600000).toISOString(),
    verificationData: {
      actualAttendance: 78,
      ticketUsed: 78,
      ticketRefunded: 2,
    },
    verifiedAt: new Date(now.getTime() - 3600000).toISOString(),
    verifiedBy: 'u2',
    slaDeadline: new Date(now.getTime() - 3600000).toISOString(),
    stuckReason: '值班经理正在处理其他紧急事务，核销复核延后',
    nextNodeTime: new Date(now.getTime() + 3600000).toISOString(),
  };

  addStatusLog(id, null, 'pending_scheduling', 'u1', 'scheduling_manager', '系统', '企业提交团体票预约');
  addStatusLog(id, 'pending_scheduling', 'scheduling_reviewing', 'u1', 'scheduling_manager', '张伟', '开始排片审核');
  addStatusLog(id, 'scheduling_reviewing', 'scheduling_approved', 'u1', 'scheduling_manager', '张伟', '排片审核通过');
  addStatusLog(id, 'scheduling_approved', 'pending_verification', 'u2', 'ticket_supervisor', '系统', '等待票务主管现场核销');
  addStatusLog(id, 'pending_verification', 'verifying', 'u2', 'ticket_supervisor', '李娜', '开始现场核销');
  addStatusLog(id, 'verifying', 'verification_pending_review', 'u2', 'ticket_supervisor', '李娜', '提交核销数据，待值班经理复核');

  addTodo(id, '核销复核', '阿里巴巴集团80人团体票核销数据待复核', 'duty_manager', new Date(now.getTime() - 3600000).toISOString());

  return ticket;
}

function createVerificationRejectedTicket(): GroupTicket {
  const id = generateId();
  const now = new Date();
  const ticket: GroupTicket = {
    id,
    orderNo: 'GT20260601003',
    companyName: '腾讯科技有限公司',
    contactName: '赵主管',
    contactPhone: '13800138003',
    movieName: '哪吒之魔童闹海',
    showDate: '2026-06-06',
    showTime: '15:00',
    hallName: '2号杜比厅',
    ticketCount: 150,
    unitPrice: 50,
    totalAmount: 7500,
    status: 'verification_rejected',
    currentHandler: 'ticket_supervisor',
    rejectRecords: [
      {
        reason: '核销数据缺少签到明细，实际到场人数与票根数量不符，请重新核对',
        rejectedBy: 'u3',
        rejectedAt: new Date(now.getTime() - 7200000).toISOString(),
        role: 'duty_manager',
      },
    ],
    createdAt: new Date(now.getTime() - 86400000 * 4).toISOString(),
    updatedAt: new Date(now.getTime() - 7200000).toISOString(),
    verificationData: {
      actualAttendance: 145,
      ticketUsed: 142,
      ticketRefunded: 8,
    },
    verifiedAt: new Date(now.getTime() - 10800000).toISOString(),
    verifiedBy: 'u2',
    slaDeadline: new Date(now.getTime() - 10800000).toISOString(),
    stuckReason: '核销被驳回，票务主管正在重新整理签到记录',
    nextNodeTime: new Date(now.getTime() + 7200000).toISOString(),
  };

  addStatusLog(id, null, 'pending_scheduling', 'u1', 'scheduling_manager', '系统', '企业提交团体票预约');
  addStatusLog(id, 'pending_scheduling', 'scheduling_reviewing', 'u1', 'scheduling_manager', '张伟', '开始排片审核');
  addStatusLog(id, 'scheduling_reviewing', 'scheduling_approved', 'u1', 'scheduling_manager', '张伟', '排片审核通过');
  addStatusLog(id, 'scheduling_approved', 'pending_verification', 'u2', 'ticket_supervisor', '系统', '等待票务主管现场核销');
  addStatusLog(id, 'pending_verification', 'verifying', 'u2', 'ticket_supervisor', '李娜', '开始现场核销');
  addStatusLog(id, 'verifying', 'verification_pending_review', 'u2', 'ticket_supervisor', '李娜', '提交核销数据');
  addStatusLog(id, 'verification_pending_review', 'verification_rejected', 'u3', 'duty_manager', '王强', '核销数据驳回：缺少签到明细');

  addTodo(id, '核销数据重新提交', '腾讯科技150人团体票核销被驳回，请重新核对数据后提交', 'ticket_supervisor', new Date(now.getTime() + 7200000).toISOString());

  return ticket;
}

function createSchedulingApprovedWithRemarkTicket(): GroupTicket {
  const id = generateId();
  const now = new Date();
  const ticket: GroupTicket = {
    id,
    orderNo: 'GT20260601004',
    companyName: '字节跳动',
    contactName: '孙经理',
    contactPhone: '13800138004',
    movieName: '功夫熊猫4',
    showDate: '2026-06-07',
    showTime: '10:00',
    hallName: '5号亲子厅',
    ticketCount: 60,
    unitPrice: 35,
    totalAmount: 2100,
    status: 'scheduling_approved',
    currentHandler: 'ticket_supervisor',
    rejectRecords: [],
    supplementaryRemark: '企业要求提供3D眼镜60副，现场请提前准备',
    supplementaryAt: new Date(now.getTime() - 86400000).toISOString(),
    createdAt: new Date(now.getTime() - 86400000 * 2).toISOString(),
    updatedAt: new Date(now.getTime() - 86400000).toISOString(),
    slaDeadline: new Date(now.getTime() + 86400000).toISOString(),
    nextNodeTime: new Date(now.getTime() + 82800000).toISOString(),
  };

  addStatusLog(id, null, 'pending_scheduling', 'u1', 'scheduling_manager', '系统', '企业提交团体票预约');
  addStatusLog(id, 'pending_scheduling', 'scheduling_reviewing', 'u1', 'scheduling_manager', '张伟', '开始排片审核');
  addStatusLog(id, 'scheduling_reviewing', 'scheduling_approved', 'u1', 'scheduling_manager', '张伟', '排片审核通过，注意需提供3D眼镜');
  addStatusLog(id, 'scheduling_approved', 'scheduling_approved', 'u1', 'scheduling_manager', '张伟', '补充备注：企业要求提供3D眼镜60副');

  addTodo(id, '待核销准备', '字节跳动60人团体票明日放映，请提前准备3D眼镜', 'ticket_supervisor', new Date(now.getTime() + 82800000).toISOString());

  return ticket;
}

function createSchedulingRejectedTicket(): GroupTicket {
  const id = generateId();
  const now = new Date();
  const ticket: GroupTicket = {
    id,
    orderNo: 'GT20260601005',
    companyName: '美团点评',
    contactName: '周经理',
    contactPhone: '13800138005',
    movieName: '速度与激情11',
    showDate: '2026-06-08',
    showTime: '19:30',
    hallName: 'VIP贵宾厅',
    ticketCount: 30,
    unitPrice: 120,
    totalAmount: 3600,
    status: 'scheduling_rejected',
    currentHandler: 'scheduling_manager',
    rejectRecords: [
      {
        reason: '6月8日19:30 VIP厅已被包场，建议调整至6月9日同时段或选择其他影厅',
        rejectedBy: 'u1',
        rejectedAt: new Date(now.getTime() - 43200000).toISOString(),
        role: 'scheduling_manager',
      },
    ],
    createdAt: new Date(now.getTime() - 86400000 * 2).toISOString(),
    updatedAt: new Date(now.getTime() - 43200000).toISOString(),
    slaDeadline: new Date(now.getTime() - 7200000).toISOString(),
    stuckReason: '排片被驳回，等待企业确认是否调整场次',
    nextNodeTime: new Date(now.getTime() + 14400000).toISOString(),
  };

  addStatusLog(id, null, 'pending_scheduling', 'u1', 'scheduling_manager', '系统', '企业提交团体票预约');
  addStatusLog(id, 'pending_scheduling', 'scheduling_reviewing', 'u1', 'scheduling_manager', '张伟', '开始排片审核');
  addStatusLog(id, 'scheduling_reviewing', 'scheduling_rejected', 'u1', 'scheduling_manager', '张伟', '排片驳回：VIP厅已被包场');

  addTodo(id, '排片方案重新确认', '美团点评30人团体票排片被驳回，请联系企业调整场次', 'scheduling_manager', new Date(now.getTime() + 14400000).toISOString());

  return ticket;
}

function createPendingSchedulingTicket(): GroupTicket {
  const id = generateId();
  const now = new Date();
  const ticket: GroupTicket = {
    id,
    orderNo: 'GT20260601006',
    companyName: '京东集团',
    contactName: '吴总',
    contactPhone: '13800138006',
    movieName: '封神第三部',
    showDate: '2026-06-09',
    showTime: '18:00',
    hallName: '1号激光厅',
    ticketCount: 200,
    unitPrice: 50,
    totalAmount: 10000,
    status: 'pending_scheduling',
    currentHandler: 'scheduling_manager',
    rejectRecords: [],
    createdAt: new Date(now.getTime() - 3600000 * 5).toISOString(),
    updatedAt: new Date(now.getTime() - 3600000 * 5).toISOString(),
    slaDeadline: new Date(now.getTime() + 43200000).toISOString(),
    nextNodeTime: new Date(now.getTime() + 28800000).toISOString(),
  };

  addStatusLog(id, null, 'pending_scheduling', 'u1', 'scheduling_manager', '系统', '企业提交团体票预约');

  addTodo(id, '排片审核', '京东集团200人团体票待排片审核', 'scheduling_manager', new Date(now.getTime() + 28800000).toISOString());

  return ticket;
}

function createPendingVerificationTicket(): GroupTicket {
  const id = generateId();
  const now = new Date();
  const ticket: GroupTicket = {
    id,
    orderNo: 'GT20260601007',
    companyName: '小米科技',
    contactName: '郑主管',
    contactPhone: '13800138007',
    movieName: '地下城与勇士',
    showDate: '2026-06-06',
    showTime: '21:00',
    hallName: '4号厅',
    ticketCount: 100,
    unitPrice: 45,
    totalAmount: 4500,
    status: 'pending_verification',
    currentHandler: 'ticket_supervisor',
    rejectRecords: [],
    createdAt: new Date(now.getTime() - 86400000 * 2).toISOString(),
    updatedAt: new Date(now.getTime() - 86400000).toISOString(),
    slaDeadline: new Date(now.getTime() + 3600000 * 3).toISOString(),
    nextNodeTime: new Date(now.getTime() + 3600000 * 2).toISOString(),
  };

  addStatusLog(id, null, 'pending_scheduling', 'u1', 'scheduling_manager', '系统', '企业提交团体票预约');
  addStatusLog(id, 'pending_scheduling', 'scheduling_reviewing', 'u1', 'scheduling_manager', '张伟', '开始排片审核');
  addStatusLog(id, 'scheduling_reviewing', 'scheduling_approved', 'u1', 'scheduling_manager', '张伟', '排片审核通过');
  addStatusLog(id, 'scheduling_approved', 'pending_verification', 'u2', 'ticket_supervisor', '系统', '等待票务主管现场核销');

  addTodo(id, '现场核销', '小米科技100人团体票今日21:00放映，请到场核销', 'ticket_supervisor', new Date(now.getTime() + 3600000 * 2).toISOString());

  return ticket;
}

function createSchedulingReviewingTicket(): GroupTicket {
  const id = generateId();
  const now = new Date();
  const ticket: GroupTicket = {
    id,
    orderNo: 'GT20260601008',
    companyName: '百度公司',
    contactName: '冯经理',
    contactPhone: '13800138008',
    movieName: '大护法2',
    showDate: '2026-06-10',
    showTime: '14:00',
    hallName: '2号杜比厅',
    ticketCount: 90,
    unitPrice: 40,
    totalAmount: 3600,
    status: 'scheduling_reviewing',
    currentHandler: 'scheduling_manager',
    rejectRecords: [],
    createdAt: new Date(now.getTime() - 86400000).toISOString(),
    updatedAt: new Date(now.getTime() - 1800000).toISOString(),
    slaDeadline: new Date(now.getTime() + 7200000).toISOString(),
    nextNodeTime: new Date(now.getTime() + 3600000).toISOString(),
  };

  addStatusLog(id, null, 'pending_scheduling', 'u1', 'scheduling_manager', '系统', '企业提交团体票预约');
  addStatusLog(id, 'pending_scheduling', 'scheduling_reviewing', 'u1', 'scheduling_manager', '张伟', '开始排片审核');

  addTodo(id, '排片审核', '百度公司90人团体票排片审核中，请确认场次', 'scheduling_manager', new Date(now.getTime() + 7200000).toISOString());

  return ticket;
}

function seedData() {
  db.users = [...users];
  db.tickets = [];
  db.todos = [];
  db.statusLogs = [];

  db.tickets.push(createCompletedTicket());
  db.tickets.push(createVerificationPendingReviewTicket());
  db.tickets.push(createVerificationRejectedTicket());
  db.tickets.push(createSchedulingApprovedWithRemarkTicket());
  db.tickets.push(createSchedulingRejectedTicket());
  db.tickets.push(createPendingSchedulingTicket());
  db.tickets.push(createPendingVerificationTicket());
  db.tickets.push(createSchedulingReviewingTicket());
}

seedData();

app.use('/api', routes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '影院团体票预约与核销复核系统 API 运行正常' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API 地址: http://localhost:${PORT}/api`);
});
