import { Request, Response, Router } from 'express';
import * as XLSX from 'xlsx';
import { db } from './models/database';
import { CaseStatus, SettlementData, TodoItem, UserRole } from './types';
import { canTransition, getHandlerForStatus, ROLE_LABELS, STATUS_LABELS } from './utils/statusFlow';

const router = Router();

// 中间件：模拟用户身份
router.use((req: Request, res: Response, next) => {
  const role = req.headers['x-user-role'] as UserRole;
  const userId = req.headers['x-user-id'] as string;
  if (role) {
    (req as any).userRole = role;
    (req as any).userId = userId || 'anonymous';
  }
  next();
});

// 获取当前用户待办
router.get('/todos', (req: Request, res: Response) => {
  const role = (req as any).userRole as UserRole;
  if (!role) {
    return res.status(400).json({ error: 'Missing user role' });
  }
  
  const todos = db.todoItems.filter(t => t.role === role);
  res.json({ todos });
});

// 结案数据处理：提交结案数据（支持补录备注）
router.post('/cases/:caseId/submit-data', (req: Request, res: Response) => {
  const { caseId } = req.params;
  const { settlementData, supplementaryRemark } = req.body as { 
    settlementData: SettlementData;
    supplementaryRemark?: string;
  };
  const userRole = (req as any).userRole as UserRole;
  const userId = (req as any).userId as string;

  const caseRecord = db.caseRecords.find(c => c.id === caseId);
  if (!caseRecord) {
    return res.status(404).json({ error: 'Case not found' });
  }

  if (!canTransition(caseRecord.status, 'data_submitted', userRole)) {
    return res.status(403).json({ 
      error: 'Permission denied',
      allowedRoles: ['talent_agent']
    });
  }

  const now = new Date().toISOString();
  const fromStatus = caseRecord.status;
  caseRecord.settlementData = settlementData;
  caseRecord.dataSubmittedAt = now;
  caseRecord.dataSubmittedBy = userId;
  caseRecord.status = 'data_submitted';
  caseRecord.currentHandler = 'business';
  caseRecord.updatedAt = now;

  if (supplementaryRemark) {
    const prevRemark = caseRecord.supplementaryRemark;
    caseRecord.supplementaryRemark = prevRemark 
      ? `${prevRemark}\n[${new Date().toLocaleString()}] ${supplementaryRemark}`
      : supplementaryRemark;
    caseRecord.supplementaryAt = now;
  }

  db.statusLogs.push({
    id: db.generateId(),
    caseId,
    fromStatus,
    toStatus: 'data_submitted',
    operatorId: userId,
    operatorRole: userRole,
    remark: supplementaryRemark,
    createdAt: now
  });

  const todo: TodoItem = {
    id: db.generateId(),
    caseId,
    title: `审核结案数据：${caseRecord.id}`,
    description: '结案数据已提交，请商务审核',
    role: 'business',
    priority: 'high',
    createdAt: now
  };
  db.todoItems.push(todo);

  res.json({ case: caseRecord });
});

// 结案数据处理：审核结案数据（通过/驳回）
router.post('/cases/:caseId/review-data', (req: Request, res: Response) => {
  const { caseId } = req.params;
  const { approved, rejectReason } = req.body as { approved: boolean; rejectReason?: string };
  const userRole = (req as any).userRole as UserRole;
  const userId = (req as any).userId as string;

  const caseRecord = db.caseRecords.find(c => c.id === caseId);
  if (!caseRecord) {
    return res.status(404).json({ error: 'Case not found' });
  }

  if (!canTransition(caseRecord.status, approved ? 'pending_settlement' : 'data_rejected', userRole)) {
    return res.status(403).json({ 
      error: 'Permission denied',
      allowedRoles: ['business']
    });
  }

  const now = new Date().toISOString();
  const fromStatus = caseRecord.status;
  const newStatus: CaseStatus = approved ? 'pending_settlement' : 'data_rejected';
  
  caseRecord.status = newStatus;
  caseRecord.currentHandler = approved ? 'finance' : 'talent_agent';
  
  if (!approved && rejectReason) {
    const prevReject = caseRecord.rejectReason;
    caseRecord.rejectReason = prevReject 
      ? `${prevReject}\n[${new Date().toLocaleString()}] ${rejectReason}`
      : rejectReason;
    caseRecord.rejectAt = now;
    caseRecord.rejectBy = userId;
  }
  
  caseRecord.updatedAt = now;

  db.statusLogs.push({
    id: db.generateId(),
    caseId,
    fromStatus,
    toStatus: newStatus,
    operatorId: userId,
    operatorRole: userRole,
    remark: approved ? '数据审核通过' : rejectReason,
    createdAt: now
  });

  const handler = getHandlerForStatus(newStatus);
  if (handler) {
    const todo: TodoItem = {
      id: db.generateId(),
      caseId,
      title: approved ? `处理费用结算：${caseRecord.id}` : `补充结案数据：${caseRecord.id}`,
      description: approved ? '请财务进行费用结算' : `数据被驳回：${rejectReason}`,
      role: handler,
      priority: 'high',
      createdAt: now
    };
    db.todoItems.push(todo);
  }

  res.json({ case: caseRecord });
});

// 状态变更
router.post('/cases/:caseId/transition', (req: Request, res: Response) => {
  const { caseId } = req.params;
  const { targetStatus, remark } = req.body as { targetStatus: CaseStatus; remark?: string };
  const userRole = (req as any).userRole as UserRole;
  const userId = (req as any).userId as string;

  const caseRecord = db.caseRecords.find(c => c.id === caseId);
  if (!caseRecord) {
    return res.status(404).json({ error: 'Case not found' });
  }

  if (!canTransition(caseRecord.status, targetStatus, userRole)) {
    return res.status(403).json({ 
      error: 'Invalid state transition',
      currentStatus: caseRecord.status,
      targetStatus,
      userRole
    });
  }

  const now = new Date().toISOString();
  const fromStatus = caseRecord.status;
  caseRecord.status = targetStatus;
  caseRecord.currentHandler = getHandlerForStatus(targetStatus);
  caseRecord.updatedAt = now;

  if (targetStatus === 'delayed') {
    caseRecord.delayedDays = (caseRecord.delayedDays || 0) + 1;
    if (remark) {
      caseRecord.supplementaryRemark = remark;
      caseRecord.supplementaryAt = now;
    }
  }

  db.statusLogs.push({
    id: db.generateId(),
    caseId,
    fromStatus,
    toStatus: targetStatus,
    operatorId: userId,
    operatorRole: userRole,
    remark,
    createdAt: now
  });

  const handler = getHandlerForStatus(targetStatus);
  if (handler) {
    const todo: TodoItem = {
      id: db.generateId(),
      caseId,
      title: `状态变更：${STATUS_LABELS[targetStatus]}`,
      description: remark || `项目状态已变更为：${STATUS_LABELS[targetStatus]}`,
      role: handler,
      priority: 'medium',
      createdAt: now
    };
    db.todoItems.push(todo);
  }

  res.json({ case: caseRecord });
});

// 费用结算处理（支持提交、复核通过、复核驳回、重新提交、付款）
router.post('/cases/:caseId/settlement', (req: Request, res: Response) => {
  const { caseId } = req.params;
  const { action, approved, remark, rejectReason, supplementaryRemark } = req.body as {
    action: 'submit' | 'review' | 'resubmit' | 'pay';
    approved?: boolean;
    remark?: string;
    rejectReason?: string;
    supplementaryRemark?: string;
  };
  const userRole = (req as any).userRole as UserRole;
  const userId = (req as any).userId as string;

  const caseRecord = db.caseRecords.find(c => c.id === caseId);
  if (!caseRecord) {
    return res.status(404).json({ error: 'Case not found' });
  }

  const now = new Date().toISOString();
  let targetStatus: CaseStatus | null = null;
  let logRemark = remark;

  if (action === 'submit' && userRole === 'finance') {
    if (!canTransition(caseRecord.status, 'settlement_pending_review', userRole)) {
      return res.status(400).json({ error: 'Invalid status for settlement submission' });
    }
    targetStatus = 'settlement_pending_review';
    caseRecord.settlementReviewedAt = now;
    caseRecord.settlementReviewedBy = userId;
    logRemark = '财务提交结算复核';
  } else if (action === 'review' && userRole === 'business') {
    if (caseRecord.status !== 'settlement_pending_review') {
      return res.status(400).json({ error: 'Invalid status for settlement review' });
    }
    if (approved === true) {
      if (!canTransition(caseRecord.status, 'completed', userRole)) {
        return res.status(403).json({ error: 'Permission denied' });
      }
      targetStatus = 'completed';
      caseRecord.settlementRemark = remark;
      logRemark = remark || '结算复核通过';
    } else {
      if (!canTransition(caseRecord.status, 'settlement_rejected', userRole)) {
        return res.status(403).json({ error: 'Permission denied' });
      }
      targetStatus = 'settlement_rejected';
      const prevReject = caseRecord.rejectReason;
      caseRecord.rejectReason = prevReject 
        ? `${prevReject}\n[结算驳回 ${new Date().toLocaleString()}] ${rejectReason || '结算复核不通过'}`
        : `[结算驳回 ${new Date().toLocaleString()}] ${rejectReason || '结算复核不通过'}`;
      caseRecord.rejectAt = now;
      caseRecord.rejectBy = userId;
      logRemark = rejectReason || '结算复核不通过';
    }
  } else if (action === 'resubmit' && userRole === 'finance') {
    if (!canTransition(caseRecord.status, 'settlement_pending_review', userRole)) {
      return res.status(400).json({ error: 'Invalid status for settlement resubmission' });
    }
    targetStatus = 'settlement_pending_review';
    caseRecord.settlementReviewedAt = now;
    caseRecord.settlementReviewedBy = userId;
    if (supplementaryRemark) {
      const prevRemark = caseRecord.supplementaryRemark;
      caseRecord.supplementaryRemark = prevRemark 
        ? `${prevRemark}\n[结算补充 ${new Date().toLocaleString()}] ${supplementaryRemark}`
        : `[结算补充 ${new Date().toLocaleString()}] ${supplementaryRemark}`;
      caseRecord.supplementaryAt = now;
    }
    logRemark = supplementaryRemark || '财务重新提交结算';
  } else if (action === 'pay' && userRole === 'finance') {
    if (caseRecord.status !== 'completed') {
      return res.status(400).json({ error: 'Invalid status for payment' });
    }
    caseRecord.paidAt = now;
    caseRecord.paidAmount = caseRecord.settlementData?.talentFee || 0;
    logRemark = `已付款 ¥${caseRecord.paidAmount.toLocaleString()}`;
  }

  if (targetStatus) {
    const fromStatus = caseRecord.status;
    caseRecord.status = targetStatus;
    caseRecord.currentHandler = getHandlerForStatus(targetStatus);
    caseRecord.updatedAt = now;

    db.statusLogs.push({
      id: db.generateId(),
      caseId,
      fromStatus,
      toStatus: targetStatus,
      operatorId: userId,
      operatorRole: userRole,
      remark: logRemark,
      createdAt: now
    });

    const handler = getHandlerForStatus(targetStatus);
    if (handler) {
      const todo: TodoItem = {
        id: db.generateId(),
        caseId,
        title: targetStatus === 'settlement_rejected' 
          ? `结算被驳回，请修改：${caseRecord.id}`
          : targetStatus === 'completed'
            ? `结算完成，待付款：${caseRecord.id}`
            : `结算待复核：${caseRecord.id}`,
        description: logRemark || `结算状态变更为：${STATUS_LABELS[targetStatus]}`,
        role: handler,
        priority: targetStatus === 'settlement_rejected' ? 'high' : 'medium',
        createdAt: now
      };
      db.todoItems.push(todo);
    }
  }

  res.json({ case: caseRecord });
});

// 费用结算回看 - 获取单条记录详情（包含所有关联信息）
router.get('/cases/:caseId', (req: Request, res: Response) => {
  const { caseId } = req.params;
  
  const caseRecord = db.caseRecords.find(c => c.id === caseId);
  if (!caseRecord) {
    return res.status(404).json({ error: 'Case not found' });
  }

  const demand = db.brandDemands.find(d => d.id === caseRecord.demandId);
  const talent = db.talents.find(t => t.id === caseRecord.talentId);
  const script = db.scriptVersions.find(s => s.id === caseRecord.scriptId);
  const statusLogs = db.statusLogs.filter(l => l.caseId === caseId).sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const business = db.users.find(u => u.id === demand?.businessId);
  const agent = db.users.find(u => u.id === talent?.agentId);

  res.json({
    case: caseRecord,
    demand,
    talent,
    script,
    statusLogs,
    relatedUsers: { business, agent }
  });
});

// 获取所有案例列表（带筛选）
router.get('/cases', (req: Request, res: Response) => {
  const { status, role } = req.query;
  
  let cases = [...db.caseRecords];
  
  if (status) {
    cases = cases.filter(c => c.status === status);
  }
  
  if (role) {
    cases = cases.filter(c => c.currentHandler === role);
  }

  const enriched = cases.map(c => {
    const demand = db.brandDemands.find(d => d.id === c.demandId);
    const talent = db.talents.find(t => t.id === c.talentId);
    return {
      ...c,
      brandName: demand?.brandName,
      productName: demand?.productName,
      talentName: talent?.name
    };
  });

  res.json({ cases: enriched });
});

// 导出任务 - 导出Excel
router.get('/export/cases', (req: Request, res: Response) => {
  const { status } = req.query;
  
  let cases = [...db.caseRecords];
  if (status) {
    cases = cases.filter(c => c.status === status);
  }

  const exportData = cases.map(c => {
    const demand = db.brandDemands.find(d => d.id === c.demandId);
    const talent = db.talents.find(t => t.id === c.talentId);
    const business = db.users.find(u => u.id === demand?.businessId);
    const agent = db.users.find(u => u.id === talent?.agentId);

    return {
      '案例ID': c.id,
      '品牌名称': demand?.brandName || '',
      '产品名称': demand?.productName || '',
      '达人名称': talent?.name || '',
      '平台': talent?.platform || '',
      '当前状态': STATUS_LABELS[c.status],
      '当前处理人': c.currentHandler ? ROLE_LABELS[c.currentHandler] : '-',
      '商务对接人': business?.name || '',
      '达人经纪': agent?.name || '',
      '播放量': c.settlementData?.views || '-',
      '点赞数': c.settlementData?.likes || '-',
      '评论数': c.settlementData?.comments || '-',
      '转发数': c.settlementData?.shares || '-',
      '实际费用': c.settlementData?.actualFee || '-',
      '平台服务费': c.settlementData?.platformFee || '-',
      '达人费用': c.settlementData?.talentFee || '-',
      '驳回原因': c.rejectReason || '-',
      '补充备注': c.supplementaryRemark || '-',
      '创建时间': c.createdAt,
      '更新时间': c.updatedAt,
      '是否延期': c.delayedDays ? `是（${c.delayedDays}天）` : '否'
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportData);
  XLSX.utils.book_append_sheet(wb, ws, '结案记录');
  
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=mcn_cases_${Date.now()}.xlsx`);
  res.send(buffer);
});

// 导出任务 - 导出待办
router.get('/export/todos', (req: Request, res: Response) => {
  const role = (req as any).userRole as UserRole;
  
  let todos = [...db.todoItems];
  if (role) {
    todos = todos.filter(t => t.role === role);
  }

  const exportData = todos.map(t => {
    const caseRecord = db.caseRecords.find(c => c.id === t.caseId);
    const demand = db.brandDemands.find(d => d.id === caseRecord?.demandId);

    return {
      '待办ID': t.id,
      '标题': t.title,
      '描述': t.description,
      '关联案例': t.caseId,
      '品牌': demand?.brandName || '',
      '处理角色': ROLE_LABELS[t.role],
      '优先级': t.priority === 'high' ? '高' : t.priority === 'medium' ? '中' : '低',
      '截止日期': t.dueDate || '-',
      '创建时间': t.createdAt
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportData);
  XLSX.utils.book_append_sheet(wb, ws, '待办事项');
  
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=mcn_todos_${Date.now()}.xlsx`);
  res.send(buffer);
});

// 获取状态日志
router.get('/cases/:caseId/logs', (req: Request, res: Response) => {
  const { caseId } = req.params;
  
  const logs = db.statusLogs
    .filter(l => l.caseId === caseId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(l => ({
      ...l,
      fromStatusLabel: l.fromStatus ? STATUS_LABELS[l.fromStatus] : '-',
      toStatusLabel: STATUS_LABELS[l.toStatus],
      operatorRoleLabel: ROLE_LABELS[l.operatorRole]
    }));

  res.json({ logs });
});

// 获取用户列表
router.get('/users', (req: Request, res: Response) => {
  res.json({ users: db.users });
});

// 获取达人列表
router.get('/talents', (req: Request, res: Response) => {
  res.json({ talents: db.talents });
});

// 获取品牌需求列表
router.get('/demands', (req: Request, res: Response) => {
  res.json({ demands: db.brandDemands });
});

export default router;
