import express from 'express';
import { db, getTicketById, getTodosByRole, getStatusLogsByTicketId, getUserById } from './models/database';
import { filterGroupTickets, enrichGroupTicket } from './utils/caseHelper';
import { getHandlerForStatus } from './utils/statusFlow';
import { FilterParams, StatusLog, TodoItem, UserRole } from './types';

const router = express.Router();

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function addStatusLog(
  ticketId: string,
  fromStatus: string | null,
  toStatus: string,
  operatorId: string,
  operatorRole: UserRole,
  operatorName: string,
  remark?: string
) {
  const log: StatusLog = {
    id: generateId(),
    ticketId,
    fromStatus: fromStatus as any,
    toStatus: toStatus as any,
    operatorId,
    operatorRole,
    operatorName,
    remark,
    createdAt: new Date().toISOString(),
  };
  db.statusLogs.push(log);
}

function addTodo(ticketId: string, title: string, description: string, role: UserRole, slaDeadline?: string) {
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

function removeTodo(ticketId: string, role: UserRole) {
  db.todos = db.todos.filter(t => !(t.ticketId === ticketId && t.role === role));
}

router.get('/tickets', (req, res) => {
  const params: FilterParams = {
    status: req.query.status as any,
    handler: req.query.handler as any,
    hasReject: req.query.hasReject ? req.query.hasReject === 'true' : undefined,
    hasSupplementary: req.query.hasSupplementary ? req.query.hasSupplementary === 'true' : undefined,
    isOverdue: req.query.isOverdue ? req.query.isOverdue === 'true' : undefined,
    isUrgent: req.query.isUrgent ? req.query.isUrgent === 'true' : undefined,
    keyword: req.query.keyword as string,
  };

  let tickets = filterGroupTickets(db.tickets, params);
  const enriched = tickets.map(t => enrichGroupTicket(t));

  res.json({
    success: true,
    data: enriched,
    total: enriched.length,
  });
});

router.get('/tickets/:id', (req, res) => {
  const ticket = getTicketById(req.params.id);
  if (!ticket) {
    return res.status(404).json({ success: false, message: '团体票记录不存在' });
  }

  const enriched = enrichGroupTicket(ticket);
  const logs = getStatusLogsByTicketId(ticket.id);

  res.json({
    success: true,
    data: {
      ticket: enriched,
      logs,
    },
  });
});

router.get('/tickets/:id/logs', (req, res) => {
  const ticket = getTicketById(req.params.id);
  if (!ticket) {
    return res.status(404).json({ success: false, message: '团体票记录不存在' });
  }

  const logs = getStatusLogsByTicketId(ticket.id);
  res.json({
    success: true,
    data: logs,
  });
});

router.get('/todos', (req, res) => {
  const role = req.header('X-User-Role') as UserRole;
  if (!role) {
    return res.status(400).json({ success: false, message: '缺少角色信息' });
  }

  const todos = getTodosByRole(role);
  const todosWithTicket = todos.map(todo => {
    const ticket = getTicketById(todo.ticketId);
    return {
      ...todo,
      ticket: ticket ? enrichGroupTicket(ticket) : null,
    };
  });

  res.json({
    success: true,
    data: todosWithTicket,
  });
});

router.post('/tickets/:id/start-scheduling', (req, res) => {
  const role = req.header('X-User-Role') as UserRole;
  const userId = req.header('X-User-Id') || 'u1';
  const user = getUserById(userId);

  const ticket = getTicketById(req.params.id);
  if (!ticket) {
    return res.status(404).json({ success: false, message: '团体票记录不存在' });
  }

  if (ticket.status !== 'pending_scheduling') {
    return res.status(400).json({ success: false, message: '当前状态不允许开始排片审核' });
  }

  const fromStatus = ticket.status;
  ticket.status = 'scheduling_reviewing';
  ticket.currentHandler = getHandlerForStatus(ticket.status);
  ticket.updatedAt = new Date().toISOString();

  addStatusLog(ticket.id, fromStatus, ticket.status, userId, role, (user && user.name) || '排片经理', '开始排片审核');

  res.json({
    success: true,
    data: enrichGroupTicket(ticket),
  });
});

router.post('/tickets/:id/scheduling-review', (req, res) => {
  const role = req.header('X-User-Role') as UserRole;
  const userId = req.header('X-User-Id') || 'u1';
  const user = getUserById(userId);

  const { approved, reason, supplementaryRemark } = req.body;

  const ticket = getTicketById(req.params.id);
  if (!ticket) {
    return res.status(404).json({ success: false, message: '团体票记录不存在' });
  }

  if (ticket.status !== 'scheduling_reviewing') {
    return res.status(400).json({ success: false, message: '当前状态不允许排片审核' });
  }

  const fromStatus = ticket.status;

  if (approved) {
    ticket.status = 'scheduling_approved';
    ticket.currentHandler = getHandlerForStatus(ticket.status);

    addStatusLog(ticket.id, fromStatus, ticket.status, userId, role, (user && user.name) || '排片经理', '排片审核通过');

    if (supplementaryRemark) {
      ticket.supplementaryRemark = supplementaryRemark;
      ticket.supplementaryAt = new Date().toISOString();
      addStatusLog(ticket.id, ticket.status, ticket.status, userId, role, (user && user.name) || '排片经理', '补充备注：' + supplementaryRemark);
    }

    addTodo(ticket.id, '待核销准备', ticket.companyName + ticket.ticketCount + '人团体票待现场核销准备', 'ticket_supervisor');
  } else {
    ticket.status = 'scheduling_rejected';
    ticket.currentHandler = getHandlerForStatus(ticket.status);
    ticket.rejectRecords.push({
      reason: reason || '排片未通过',
      rejectedBy: userId,
      rejectedAt: new Date().toISOString(),
      role,
    });

    addStatusLog(ticket.id, fromStatus, ticket.status, userId, role, (user && user.name) || '排片经理', '排片驳回：' + (reason || '未说明原因'));
    addTodo(ticket.id, '排片方案重新确认', ticket.companyName + ticket.ticketCount + '人团体票排片被驳回，请联系企业调整', 'scheduling_manager');
  }

  ticket.updatedAt = new Date().toISOString();

  res.json({
    success: true,
    data: enrichGroupTicket(ticket),
  });
});

router.post('/tickets/:id/start-verification', (req, res) => {
  const role = req.header('X-User-Role') as UserRole;
  const userId = req.header('X-User-Id') || 'u2';
  const user = getUserById(userId);

  const ticket = getTicketById(req.params.id);
  if (!ticket) {
    return res.status(404).json({ success: false, message: '团体票记录不存在' });
  }

  if (ticket.status !== 'pending_verification' && ticket.status !== 'scheduling_approved') {
    return res.status(400).json({ success: false, message: '当前状态不允许开始核销' });
  }

  const fromStatus = ticket.status;
  ticket.status = 'verifying';
  ticket.currentHandler = getHandlerForStatus(ticket.status);
  ticket.updatedAt = new Date().toISOString();

  removeTodo(ticket.id, 'ticket_supervisor');
  addStatusLog(ticket.id, fromStatus, ticket.status, userId, role, (user && user.name) || '票务主管', '开始现场核销');

  res.json({
    success: true,
    data: enrichGroupTicket(ticket),
  });
});

router.post('/tickets/:id/submit-verification', (req, res) => {
  const role = req.header('X-User-Role') as UserRole;
  const userId = req.header('X-User-Id') || 'u2';
  const user = getUserById(userId);

  const { actualAttendance, ticketUsed, ticketRefunded, remark } = req.body;

  const ticket = getTicketById(req.params.id);
  if (!ticket) {
    return res.status(404).json({ success: false, message: '团体票记录不存在' });
  }

  if (ticket.status !== 'verifying' && ticket.status !== 'verification_rejected') {
    return res.status(400).json({ success: false, message: '当前状态不允许提交核销数据' });
  }

  const fromStatus = ticket.status;
  ticket.status = 'verification_pending_review';
  ticket.currentHandler = getHandlerForStatus(ticket.status);
  ticket.verificationData = {
    actualAttendance,
    ticketUsed,
    ticketRefunded,
    remark,
  };
  ticket.verifiedAt = new Date().toISOString();
  ticket.verifiedBy = userId;
  ticket.updatedAt = new Date().toISOString();

  removeTodo(ticket.id, 'ticket_supervisor');
  addStatusLog(ticket.id, fromStatus, ticket.status, userId, role, (user && user.name) || '票务主管', '提交核销数据，待值班经理复核');
  addTodo(ticket.id, '核销复核', ticket.companyName + ticket.ticketCount + '人团体票核销数据待复核', 'duty_manager');

  res.json({
    success: true,
    data: enrichGroupTicket(ticket),
  });
});

router.post('/tickets/:id/review-verification', (req, res) => {
  const role = req.header('X-User-Role') as UserRole;
  const userId = req.header('X-User-Id') || 'u3';
  const user = getUserById(userId);

  const { approved, reason, reviewRemark } = req.body;

  const ticket = getTicketById(req.params.id);
  if (!ticket) {
    return res.status(404).json({ success: false, message: '团体票记录不存在' });
  }

  if (ticket.status !== 'verification_pending_review') {
    return res.status(400).json({ success: false, message: '当前状态不允许核销复核' });
  }

  const fromStatus = ticket.status;

  if (approved) {
    ticket.status = 'completed';
    ticket.currentHandler = getHandlerForStatus(ticket.status);
    ticket.reviewedAt = new Date().toISOString();
    ticket.reviewedBy = userId;
    ticket.reviewRemark = reviewRemark;

    removeTodo(ticket.id, 'duty_manager');
    addStatusLog(ticket.id, fromStatus, ticket.status, userId, role, (user && user.name) || '值班经理', '核销复核通过：' + (reviewRemark || '数据无误'));
  } else {
    ticket.status = 'verification_rejected';
    ticket.currentHandler = getHandlerForStatus(ticket.status);
    ticket.rejectRecords.push({
      reason: reason || '核销数据有误',
      rejectedBy: userId,
      rejectedAt: new Date().toISOString(),
      role,
    });

    removeTodo(ticket.id, 'duty_manager');
    addStatusLog(ticket.id, fromStatus, ticket.status, userId, role, (user && user.name) || '值班经理', '核销驳回：' + (reason || '未说明原因'));
    addTodo(ticket.id, '核销数据重新提交', ticket.companyName + ticket.ticketCount + '人团体票核销被驳回，请重新核对', 'ticket_supervisor');
  }

  ticket.updatedAt = new Date().toISOString();

  res.json({
    success: true,
    data: enrichGroupTicket(ticket),
  });
});

router.get('/export/tickets', (req, res) => {
  const params: FilterParams = {
    status: req.query.status as any,
    handler: req.query.handler as any,
    hasReject: req.query.hasReject ? req.query.hasReject === 'true' : undefined,
    hasSupplementary: req.query.hasSupplementary ? req.query.hasSupplementary === 'true' : undefined,
    keyword: req.query.keyword as string,
  };

  let tickets = filterGroupTickets(db.tickets, params);

  let csv = '\ufeff';
  csv += '订单号,企业名称,联系人,联系电话,影片名称,放映日期,放映时间,影厅,票数,单价,总金额,当前状态,当前责任人,是否有驳回,是否有补充备注,创建时间,更新时间\n';

  tickets.forEach(t => {
    csv += t.orderNo + ',' + t.companyName + ',' + t.contactName + ',' + t.contactPhone + ',' + t.movieName + ',' + t.showDate + ',' + t.showTime + ',' + t.hallName + ',' + t.ticketCount + ',' + t.unitPrice + ',' + t.totalAmount + ',' + t.status + ',' + t.currentHandler + ',' + (t.rejectRecords.length > 0 ? '是' : '否') + ',' + (t.supplementaryRemark ? '是' : '否') + ',' + t.createdAt + ',' + t.updatedAt + '\n';
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=group_tickets.csv');
  res.send(csv);
});

export default router;
