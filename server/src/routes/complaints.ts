import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { store } from '../data-store.js';
import { requireRole } from '../auth.js';
import type { Complaint, AssignTarget, ComplaintType, Severity, CompensationType, ComplaintStatus } from '../types.js';

const router = Router();

const VALID_TRANSITIONS: Record<ComplaintStatus, ComplaintStatus[]> = {
  registered: ['assigned'],
  assigned: ['processing'],
  processing: ['compensating'],
  compensating: ['closed'],
  closed: ['registered'],
};

function hoursFromNow(h: number) {
  return new Date(Date.now() + h * 3600000).toISOString();
}

router.get('/', (req, res) => {
  const user = req.currentUser!;
  let complaints = store.getComplaintsByRole(user.id, user.role);

  const statusFilter = req.query.status as string | undefined;
  if (statusFilter) {
    complaints = complaints.filter(c => c.status === statusFilter);
  }

  if (req.query.overdue === 'true') {
    const now = new Date().toISOString();
    complaints = complaints.filter(c => c.dueDate && c.status !== 'closed' && c.dueDate < now);
  }

  complaints.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  res.json(complaints);
});

router.get('/:id', (req, res) => {
  const complaint = store.getComplaint(req.params.id);
  if (!complaint) {
    res.status(404).json({ error: '投诉不存在' });
    return;
  }
  res.json(complaint);
});

router.post('/', requireRole('operator'), (req, res) => {
  const { title, description, tourGroup, complaintType, severity } = req.body;
  if (!title || !description || !tourGroup || !complaintType || !severity) {
    res.status(400).json({ error: '缺少必填字段：title, description, tourGroup, complaintType, severity' });
    return;
  }

  const validTypes: ComplaintType[] = ['service', 'transport', 'accommodation', 'food', 'schedule', 'other'];
  const validSeverities: Severity[] = ['low', 'medium', 'high', 'urgent'];
  if (!validTypes.includes(complaintType)) {
    res.status(400).json({ error: `complaintType 必须为: ${validTypes.join(', ')}` });
    return;
  }
  if (!validSeverities.includes(severity)) {
    res.status(400).json({ error: `severity 必须为: ${validSeverities.join(', ')}` });
    return;
  }

  const user = req.currentUser!;
  const dueDate = (severity === 'high' || severity === 'urgent')
    ? hoursFromNow(48)
    : hoursFromNow(72);

  const complaint = store.createComplaint({
    title,
    description,
    tourGroup,
    complaintType,
    severity,
    createdBy: user.id,
    createdByName: user.name,
    dueDate,
  });

  store.addTimelineEvent(complaint.id, {
    type: 'created',
    role: user.role,
    authorName: user.name,
    content: `创建投诉：${title}，严重等级为${severity === 'low' ? '低' : severity === 'medium' ? '中' : severity === 'high' ? '高' : '紧急'}`,
  });

  const result = store.getComplaint(complaint.id);
  res.status(201).json(result);
});

router.patch('/:id/assign', requireRole('operator'), (req, res) => {
  const { assignedRole, assignedTo } = req.body;
  if (!assignedRole || !assignedTo) {
    res.status(400).json({ error: '缺少必填字段：assignedRole, assignedTo' });
    return;
  }

  const validRoles: AssignTarget[] = ['guide', 'fleet'];
  if (!validRoles.includes(assignedRole)) {
    res.status(400).json({ error: `assignedRole 必须为: ${validRoles.join(', ')}` });
    return;
  }

  const assignee = store.getUser(assignedTo);
  if (!assignee) {
    res.status(400).json({ error: `用户 ${assignedTo} 不存在` });
    return;
  }
  if (assignee.role !== assignedRole) {
    res.status(400).json({ error: `用户 ${assignee.name} 的角色为 ${assignee.role}，与指派角色 ${assignedRole} 不匹配` });
    return;
  }

  const complaint = store.getComplaint(req.params.id);
  if (!complaint) {
    res.status(404).json({ error: '投诉不存在' });
    return;
  }
  if (complaint.status !== 'registered') {
    res.status(400).json({ error: `当前状态为 ${complaint.status}，只有 registered 状态才能指派` });
    return;
  }

  store.updateComplaint(complaint.id, {
    assignedTo: assignedTo,
    assignedToName: assignee.name,
    assignedRole: assignedRole,
    status: 'assigned',
  });

  const roleLabel = assignedRole === 'guide' ? '导游' : '车队调度';
  store.addTimelineEvent(complaint.id, {
    type: 'assigned',
    role: req.currentUser!.role,
    authorName: req.currentUser!.name,
    content: `指派给${roleLabel} ${assignee.name} 处理`,
  });

  const result = store.getComplaint(complaint.id);
  res.json(result);
});

router.post('/:id/notes', (req, res) => {
  const { content } = req.body;
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    res.status(400).json({ error: '缺少必填字段：content' });
    return;
  }

  const complaint = store.getComplaint(req.params.id);
  if (!complaint) {
    res.status(404).json({ error: '投诉不存在' });
    return;
  }

  const user = req.currentUser!;

  if (complaint.status === 'assigned' && complaint.assignedTo === user.id) {
    store.updateComplaint(complaint.id, { status: 'processing' });
    store.addTimelineEvent(complaint.id, {
      type: 'status_change',
      role: user.role,
      authorName: user.name,
      content: `状态变更为：处理中 (processing)`,
    });
  }

  store.addTimelineEvent(complaint.id, {
    type: 'note',
    role: user.role,
    authorName: user.name,
    content: content.trim(),
  });

  const result = store.getComplaint(complaint.id);
  res.json(result);
});

router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  if (!status) {
    res.status(400).json({ error: '缺少必填字段：status' });
    return;
  }

  const validStatuses: ComplaintStatus[] = ['registered', 'assigned', 'processing', 'compensating', 'closed'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: `status 必须为: ${validStatuses.join(', ')}` });
    return;
  }

  const complaint = store.getComplaint(req.params.id);
  if (!complaint) {
    res.status(404).json({ error: '投诉不存在' });
    return;
  }

  const allowed = VALID_TRANSITIONS[complaint.status];
  if (!allowed.includes(status)) {
    res.status(400).json({
      error: `不允许从 ${complaint.status} 变更为 ${status}，允许的转变为：${allowed.join(', ')}`,
    });
    return;
  }

  if (status === 'compensating' && !['operator', 'supervisor'].includes(req.currentUser!.role)) {
    res.status(403).json({ error: '只有计调或主管可以将状态变为补偿中' });
    return;
  }
  if (status === 'closed' && req.currentUser!.role !== 'supervisor') {
    res.status(403).json({ error: '只有主管可以关闭投诉' });
    return;
  }
  if (status === 'registered' && req.currentUser!.role !== 'supervisor') {
    res.status(403).json({ error: '只有主管可以重新打开投诉' });
    return;
  }

  const eventType = status === 'registered' ? 'reopened' : status === 'closed' ? 'closed' : 'status_change';
  const statusLabel: Record<string, string> = {
    registered: '已登记',
    assigned: '已指派',
    processing: '处理中',
    compensating: '补偿中',
    closed: '已关闭',
  };

  store.updateComplaint(complaint.id, { status });
  store.addTimelineEvent(complaint.id, {
    type: eventType,
    role: req.currentUser!.role,
    authorName: req.currentUser!.name,
    content: status === 'registered'
      ? `投诉已被重新打开`
      : `状态变更为：${statusLabel[status] || status} (${status})`,
  });

  if (status === 'registered') {
    store.updateComplaint(complaint.id, {
      assignedTo: undefined,
      assignedToName: undefined,
      assignedRole: undefined,
    });
  }

  const result = store.getComplaint(complaint.id);
  res.json(result);
});

router.post('/:id/compensation', requireRole('operator', 'supervisor'), (req, res) => {
  const { type, amount, description } = req.body;
  if (!type || amount === undefined || !description) {
    res.status(400).json({ error: '缺少必填字段：type, amount, description' });
    return;
  }

  const validTypes: CompensationType[] = ['refund', 'discount', 'gift', 'upgrade', 'apology_letter', 'other'];
  if (!validTypes.includes(type)) {
    res.status(400).json({ error: `type 必须为: ${validTypes.join(', ')}` });
    return;
  }

  const complaint = store.getComplaint(req.params.id);
  if (!complaint) {
    res.status(404).json({ error: '投诉不存在' });
    return;
  }

  if (complaint.status !== 'processing' && complaint.status !== 'compensating') {
    res.status(400).json({ error: `当前状态为 ${complaint.status}，只有 processing 或 compensating 状态才能提出补偿方案` });
    return;
  }

  if (complaint.compensation && complaint.compensation.status === 'proposed') {
    res.status(400).json({ error: '已存在待审批的补偿方案' });
    return;
  }

  const user = req.currentUser!;
  const compensation = {
    id: uuidv4(),
    type,
    amount: Number(amount),
    description,
    status: 'proposed' as const,
    proposedBy: user.id,
    proposedByName: user.name,
    proposedAt: new Date().toISOString(),
  };

  store.updateComplaint(complaint.id, {
    compensation,
    status: 'compensating',
  });

  store.addTimelineEvent(complaint.id, {
    type: 'compensation_proposed',
    role: user.role,
    authorName: user.name,
    content: `提出补偿方案：${compensation.description}，金额 ${compensation.amount} 元`,
  });

  const result = store.getComplaint(complaint.id);
  res.json(result);
});

router.patch('/:id/compensation', requireRole('supervisor'), (req, res) => {
  const { action, rejectionReason } = req.body;
  if (!action || !['approve', 'reject'].includes(action)) {
    res.status(400).json({ error: '缺少必填字段：action (approve 或 reject)' });
    return;
  }

  const complaint = store.getComplaint(req.params.id);
  if (!complaint) {
    res.status(404).json({ error: '投诉不存在' });
    return;
  }

  if (!complaint.compensation) {
    res.status(400).json({ error: '该投诉尚未提出补偿方案' });
    return;
  }

  if (complaint.compensation.status !== 'proposed') {
    res.status(400).json({ error: `补偿方案当前状态为 ${complaint.compensation.status}，只有 proposed 状态才能审批` });
    return;
  }

  const user = req.currentUser!;

  if (action === 'approve') {
    complaint.compensation.status = 'approved';
    complaint.compensation.approvedBy = user.id;
    complaint.compensation.approvedByName = user.name;
    complaint.compensation.approvedAt = new Date().toISOString();
    store.updateComplaint(complaint.id, { compensation: complaint.compensation });

    store.addTimelineEvent(complaint.id, {
      type: 'compensation_approved',
      role: user.role,
      authorName: user.name,
      content: `补偿方案已批准：${complaint.compensation.description}`,
    });
  } else {
    if (!rejectionReason) {
      res.status(400).json({ error: '驳回补偿方案时必须提供 rejectionReason' });
      return;
    }
    complaint.compensation.status = 'rejected';
    complaint.compensation.approvedBy = user.id;
    complaint.compensation.approvedByName = user.name;
    complaint.compensation.approvedAt = new Date().toISOString();
    complaint.compensation.rejectionReason = rejectionReason;
    store.updateComplaint(complaint.id, { compensation: complaint.compensation });

    store.addTimelineEvent(complaint.id, {
      type: 'compensation_rejected',
      role: user.role,
      authorName: user.name,
      content: `补偿方案已驳回，原因：${rejectionReason}`,
    });
  }

  const result = store.getComplaint(complaint.id);
  res.json(result);
});

router.post('/:id/compensation/execute', requireRole('operator'), (req, res) => {
  const complaint = store.getComplaint(req.params.id);
  if (!complaint) {
    res.status(404).json({ error: '投诉不存在' });
    return;
  }

  if (!complaint.compensation) {
    res.status(400).json({ error: '该投诉尚未提出补偿方案' });
    return;
  }

  if (complaint.compensation.status !== 'approved') {
    res.status(400).json({ error: `补偿方案当前状态为 ${complaint.compensation.status}，只有 approved 状态才能执行` });
    return;
  }

  const user = req.currentUser!;

  complaint.compensation.status = 'executed';
  complaint.compensation.executedAt = new Date().toISOString();
  store.updateComplaint(complaint.id, {
    compensation: complaint.compensation,
    status: 'closed',
  });

  store.addTimelineEvent(complaint.id, {
    type: 'compensation_executed',
    role: user.role,
    authorName: user.name,
    content: `补偿已执行完成：${complaint.compensation.description}，金额 ${complaint.compensation.amount} 元`,
  });

  store.addTimelineEvent(complaint.id, {
    type: 'closed',
    role: user.role,
    authorName: user.name,
    content: '投诉已关闭',
  });

  const result = store.getComplaint(complaint.id);
  res.json(result);
});

export default router;
