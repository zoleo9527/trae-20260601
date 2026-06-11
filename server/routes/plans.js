const router = require('express').Router();
const { db, addRemark, addAuditLog, successResponse, errorResponse, now } = require('../data/database');
const { requireRole } = require('../middleware/auth');

const ROLES_CAN_MANAGE_PLAN = ['PROJECT_MANAGER', 'CONSTRUCTION_LEADER'];
const ROLES_CAN_CONFIRM_PLAN = ['PROJECT_MANAGER'];

function canViewPlan(user, plan) {
  if (ROLES_CAN_MANAGE_PLAN.includes(user.role)) return true;
  if (plan.assignedTo && plan.assignedTo.id === user.id) return true;
  return false;
}

function canEditPlan(user, plan) {
  if (ROLES_CAN_MANAGE_PLAN.includes(user.role)) return true;
  if (plan.assignedTo && plan.assignedTo.id === user.id) return true;
  return false;
}

function canConfirmPlan(user) {
  return ROLES_CAN_CONFIRM_PLAN.includes(user.role);
}

function getHoursBetween(date1, date2) {
  return Math.floor((new Date(date2) - new Date(date1)) / (1000 * 60 * 60));
}

function convertToRemarkDTO(remark) {
  return {
    id: remark.id,
    content: remark.content,
    sourceType: remark.sourceType,
    sourceId: remark.sourceId,
    inherited: remark.inherited,
    createdBy: remark.createdBy?.username,
    createdByName: remark.createdBy?.realName,
    createdAt: remark.createdAt
  };
}

function convertToStuckItemDTO(plan) {
  return {
    id: plan.id,
    projectName: plan.projectName,
    projectCode: plan.projectCode,
    status: plan.status,
    stuckReason: plan.stuckReason,
    stuckAt: plan.stuckAt,
    updatedAt: plan.updatedAt,
    assignedTo: plan.assignedTo?.username,
    assignedToName: plan.assignedTo?.realName,
    stuckHours: plan.stuckAt ? getHoursBetween(plan.stuckAt, now()) : 0
  };
}

router.get('/', (req, res) => {
  let plans = [...db.plans];
  if (!ROLES_CAN_MANAGE_PLAN.includes(req.user.role)) {
    plans = plans.filter(p => p.assignedTo && p.assignedTo.id === req.user.id);
  }
  successResponse(res, plans);
});

router.get('/my', (req, res) => {
  const myPlans = db.plans.filter(p => p.assignedTo && p.assignedTo.id === req.user.id);
  successResponse(res, myPlans);
});

router.get('/stuck', (req, res) => {
  let stuckPlans = db.plans.filter(p => p.stuck);
  if (!ROLES_CAN_MANAGE_PLAN.includes(req.user.role)) {
    stuckPlans = stuckPlans.filter(p => p.assignedTo && p.assignedTo.id === req.user.id);
  }
  
  const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  let potentialStuck = db.plans.filter(p => 
    ['IN_PROGRESS', 'CUSTOMER_REVIEWING', 'REVISED'].includes(p.status) && 
    new Date(p.updatedAt) < new Date(threshold) && 
    !p.stuck
  );
  if (!ROLES_CAN_MANAGE_PLAN.includes(req.user.role)) {
    potentialStuck = potentialStuck.filter(p => p.assignedTo && p.assignedTo.id === req.user.id);
  }

  successResponse(res, {
    totalStuckPlans: stuckPlans.length,
    stuckPlans: stuckPlans.map(convertToStuckItemDTO),
    potentialStuckPlans: potentialStuck.length
  });
});

router.get('/:id', (req, res) => {
  const plan = db.plans.find(p => p.id === parseInt(req.params.id));
  if (!plan) return errorResponse(res, '方案确认单不存在', 404);

  if (!canViewPlan(req.user, plan)) {
    return errorResponse(res, '权限不足，无法查看此方案确认单', 403);
  }

  addAuditLog('VIEW', 'PLAN', plan.id, null, null, '查看详情', req.user);
  successResponse(res, plan);
});

router.get('/survey/:surveyId', (req, res) => {
  const plans = db.plans.filter(p => p.surveyId === parseInt(req.params.surveyId));
  if (!ROLES_CAN_MANAGE_PLAN.includes(req.user.role)) {
    const filtered = plans.filter(p => p.assignedTo && p.assignedTo.id === req.user.id);
    if (filtered.length === 0) return errorResponse(res, '无权限查看', 403);
    return successResponse(res, filtered);
  }
  successResponse(res, plans);
});

router.post('/', requireRole(...ROLES_CAN_MANAGE_PLAN), (req, res) => {
  const { surveyId, projectCode, projectName, planContent, equipmentList, estimatedCost, constructionDays, assignedToId, planDate, deadline, inheritRemarks, remarkContent } = req.body;
  
  if (!surveyId || !projectCode || !projectName) {
    return errorResponse(res, '关联勘察单ID、项目编号和名称不能为空');
  }

  const survey = db.surveys.find(s => s.id === surveyId);
  if (!survey) return errorResponse(res, '关联的勘察单不存在');
  if (survey.status !== 'APPROVED') {
    return errorResponse(res, '点位勘察单必须先通过审核才能创建方案确认');
  }

  let assignedTo = null;
  if (assignedToId) {
    assignedTo = db.users.find(u => u.id === assignedToId);
    if (!assignedTo) return errorResponse(res, '指定的处理人不存在');
  }

  const newPlan = {
    id: db.plans.length > 0 ? Math.max(...db.plans.map(p => p.id)) + 1 : 1,
    survey: { id: survey.id, projectCode: survey.projectCode, projectName: survey.projectName },
    surveyId: survey.id,
    projectCode,
    projectName,
    planContent: planContent || '',
    equipmentList: equipmentList || '',
    estimatedCost: estimatedCost || 0,
    constructionDays: constructionDays || 0,
    status: 'PENDING',
    assignedTo: assignedTo ? { id: assignedTo.id, username: assignedTo.username, realName: assignedTo.realName, role: assignedTo.role } : null,
    createdBy: { id: req.user.id, username: req.user.username, realName: req.user.realName, role: req.user.role },
    planDate: planDate || now(),
    deadline: deadline || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    confirmedAt: null,
    stuck: false,
    stuckReason: null,
    stuckAt: null,
    createdAt: now(),
    updatedAt: now()
  };

  db.plans.push(newPlan);

  if (inheritRemarks !== false) {
    const surveyRemarks = db.remarks.filter(r => r.sourceType === 'SURVEY' && r.sourceId === surveyId);
    surveyRemarks.forEach(sr => {
      addRemark('PLAN', newPlan.id, `[继承自勘察] ${sr.content}`, sr.createdBy, true, new Date(new Date(sr.createdAt).getTime() + 60 * 60 * 1000).toISOString());
    });
    addAuditLog('UPDATE', 'PLAN', newPlan.id, null, `已继承 ${surveyRemarks.length} 条勘察备注`, '继承点位勘察备注', req.user);
  }

  if (remarkContent && remarkContent.trim()) {
    addRemark('PLAN', newPlan.id, remarkContent, req.user, false, now());
    addAuditLog('ADD_REMARK', 'PLAN', newPlan.id, null, remarkContent, '添加备注', req.user);
  }

  addAuditLog('CREATE', 'PLAN', newPlan.id, null, projectName, '创建方案确认单', req.user);

  successResponse(res, newPlan, '方案确认单创建成功');
});

router.put('/:id', requireRole(...ROLES_CAN_MANAGE_PLAN), (req, res) => {
  const plan = db.plans.find(p => p.id === parseInt(req.params.id));
  if (!plan) return errorResponse(res, '方案确认单不存在', 404);

  if (!canEditPlan(req.user, plan)) {
    return errorResponse(res, '权限不足，无法修改此方案确认单', 403);
  }

  const oldValue = JSON.stringify(plan);
  const { projectCode, projectName, planContent, equipmentList, estimatedCost, constructionDays, assignedToId, planDate, deadline, remarkContent } = req.body;

  plan.projectCode = projectCode || plan.projectCode;
  plan.projectName = projectName || plan.projectName;
  plan.planContent = planContent !== undefined ? planContent : plan.planContent;
  plan.equipmentList = equipmentList !== undefined ? equipmentList : plan.equipmentList;
  plan.estimatedCost = estimatedCost !== undefined ? estimatedCost : plan.estimatedCost;
  plan.constructionDays = constructionDays !== undefined ? constructionDays : plan.constructionDays;
  plan.planDate = planDate || plan.planDate;
  plan.deadline = deadline || plan.deadline;
  plan.updatedAt = now();

  if (assignedToId !== undefined) {
    if (assignedToId === null || assignedToId === '') {
      const oldAssignee = plan.assignedTo;
      plan.assignedTo = null;
      addAuditLog('ASSIGN', 'PLAN', plan.id, oldAssignee?.realName, null, '取消分配', req.user);
    } else {
      const newAssignee = db.users.find(u => u.id === assignedToId);
      if (!newAssignee) return errorResponse(res, '指定的处理人不存在');
      const oldAssignee = plan.assignedTo;
      plan.assignedTo = { id: newAssignee.id, username: newAssignee.username, realName: newAssignee.realName, role: newAssignee.role };
      addAuditLog('ASSIGN', 'PLAN', plan.id, oldAssignee?.realName, newAssignee.realName, '分配处理人', req.user);
    }
  }

  if (remarkContent && remarkContent.trim()) {
    addRemark('PLAN', plan.id, remarkContent, req.user, false, now());
    addAuditLog('ADD_REMARK', 'PLAN', plan.id, null, remarkContent, '添加备注', req.user);
  }

  addAuditLog('UPDATE', 'PLAN', plan.id, oldValue, JSON.stringify(plan), '更新方案确认单信息', req.user);

  successResponse(res, plan, '方案确认单更新成功');
});

router.patch('/:id/assign', requireRole(...ROLES_CAN_MANAGE_PLAN), (req, res) => {
  const plan = db.plans.find(p => p.id === parseInt(req.params.id));
  if (!plan) return errorResponse(res, '方案确认单不存在', 404);

  const { assignedToId } = req.body;
  const oldAssignee = plan.assignedTo;
  
  if (assignedToId) {
    const newAssignee = db.users.find(u => u.id === assignedToId);
    if (!newAssignee) return errorResponse(res, '指定的处理人不存在');
    plan.assignedTo = { id: newAssignee.id, username: newAssignee.username, realName: newAssignee.realName, role: newAssignee.role };
    addAuditLog('ASSIGN', 'PLAN', plan.id, oldAssignee?.realName, newAssignee.realName, '分配处理人', req.user);
  } else {
    plan.assignedTo = null;
    addAuditLog('ASSIGN', 'PLAN', plan.id, oldAssignee?.realName, null, '取消分配', req.user);
  }
  
  plan.updatedAt = now();
  successResponse(res, plan, '分配成功');
});

router.post('/:id/submit', (req, res) => {
  const plan = db.plans.find(p => p.id === parseInt(req.params.id));
  if (!plan) return errorResponse(res, '方案确认单不存在', 404);

  if (!canEditPlan(req.user, plan)) {
    return errorResponse(res, '权限不足，无法提交此方案确认单', 403);
  }

  if (!['PENDING', 'IN_PROGRESS', 'REJECTED', 'REVISED'].includes(plan.status)) {
    return errorResponse(res, '当前状态不允许提交');
  }

  const { remark } = req.body || {};
  const oldStatus = plan.status;
  plan.status = 'SUBMITTED';
  plan.updatedAt = now();

  if (remark && remark.trim()) {
    addRemark('PLAN', plan.id, remark, req.user, false, now());
  }

  addAuditLog('STATUS_CHANGE', 'PLAN', plan.id, oldStatus, 'SUBMITTED', '提交客户确认', req.user);
  addAuditLog('SUBMIT', 'PLAN', plan.id, null, null, '提交客户确认', req.user);

  successResponse(res, plan, '已提交客户确认');
});

router.post('/:id/confirm', requireRole(...ROLES_CAN_CONFIRM_PLAN), (req, res) => {
  const plan = db.plans.find(p => p.id === parseInt(req.params.id));
  if (!plan) return errorResponse(res, '方案确认单不存在', 404);

  if (!['SUBMITTED', 'CUSTOMER_REVIEWING'].includes(plan.status)) {
    return errorResponse(res, '当前状态不允许确认');
  }

  const { remark } = req.body || {};
  const oldStatus = plan.status;
  plan.status = 'CONFIRMED';
  plan.confirmedAt = now();
  plan.updatedAt = now();

  if (remark && remark.trim()) {
    addRemark('PLAN', plan.id, remark, req.user, false, now());
  }

  addAuditLog('STATUS_CHANGE', 'PLAN', plan.id, oldStatus, 'CONFIRMED', '客户确认方案', req.user);
  addAuditLog('APPROVE', 'PLAN', plan.id, null, null, '客户确认方案', req.user);

  successResponse(res, plan, '客户已确认方案');
});

router.post('/:id/reject', requireRole(...ROLES_CAN_CONFIRM_PLAN), (req, res) => {
  const plan = db.plans.find(p => p.id === parseInt(req.params.id));
  if (!plan) return errorResponse(res, '方案确认单不存在', 404);

  if (!['SUBMITTED', 'CUSTOMER_REVIEWING'].includes(plan.status)) {
    return errorResponse(res, '当前状态不允许拒绝');
  }

  const { reason, remark } = req.body;
  if (!reason) return errorResponse(res, '请说明拒绝原因');

  const oldStatus = plan.status;
  plan.status = 'REJECTED';
  plan.updatedAt = now();

  if (remark && remark.trim()) {
    addRemark('PLAN', plan.id, remark, req.user, false, now());
  }

  addAuditLog('STATUS_CHANGE', 'PLAN', plan.id, oldStatus, 'REJECTED', `客户拒绝: ${reason}`, req.user);
  addAuditLog('REJECT', 'PLAN', plan.id, null, reason, `客户拒绝: ${reason}`, req.user);

  successResponse(res, plan, '客户已拒绝方案');
});

router.post('/:id/revise', (req, res) => {
  const plan = db.plans.find(p => p.id === parseInt(req.params.id));
  if (!plan) return errorResponse(res, '方案确认单不存在', 404);

  if (!canEditPlan(req.user, plan)) {
    return errorResponse(res, '权限不足，无法修改此方案确认单', 403);
  }

  if (!['REJECTED', 'SUBMITTED'].includes(plan.status)) {
    return errorResponse(res, '当前状态不允许修改后重新提交');
  }

  const { remark } = req.body || {};
  const oldStatus = plan.status;
  plan.status = 'REVISED';
  plan.updatedAt = now();

  if (remark && remark.trim()) {
    addRemark('PLAN', plan.id, remark, req.user, false, now());
  }

  addAuditLog('STATUS_CHANGE', 'PLAN', plan.id, oldStatus, 'REVISED', '修改后重新提交', req.user);
  addAuditLog('SUBMIT', 'PLAN', plan.id, oldStatus, 'REVISED', '修改后重新提交', req.user);

  successResponse(res, plan, '已修改并重新提交');
});

router.post('/:id/stuck', (req, res) => {
  const plan = db.plans.find(p => p.id === parseInt(req.params.id));
  if (!plan) return errorResponse(res, '方案确认单不存在', 404);

  if (!canEditPlan(req.user, plan)) {
    return errorResponse(res, '权限不足', 403);
  }

  if (plan.stuck) return errorResponse(res, '此方案单已处于卡住状态');

  const { reason } = req.body;
  if (!reason) return errorResponse(res, '请说明卡住原因');

  const oldStatus = plan.status;
  plan.status = 'STUCK';
  plan.stuck = true;
  plan.stuckReason = reason;
  plan.stuckAt = now();
  plan.updatedAt = now();

  addAuditLog('STATUS_CHANGE', 'PLAN', plan.id, oldStatus, 'STUCK', `标记为卡住: ${reason}`, req.user);
  addAuditLog('MARK_STUCK', 'PLAN', plan.id, null, reason, '标记为卡住', req.user);

  successResponse(res, plan, '已标记为卡住');
});

router.post('/:id/unstick', (req, res) => {
  const plan = db.plans.find(p => p.id === parseInt(req.params.id));
  if (!plan) return errorResponse(res, '方案确认单不存在', 404);

  if (!canEditPlan(req.user, plan)) {
    return errorResponse(res, '权限不足', 403);
  }

  if (!plan.stuck) return errorResponse(res, '此方案单未处于卡住状态');

  const { remark } = req.body || {};
  const oldStatus = plan.status;
  plan.status = 'IN_PROGRESS';
  plan.stuck = false;
  plan.stuckReason = null;
  plan.stuckAt = null;
  plan.updatedAt = now();

  if (remark && remark.trim()) {
    addRemark('PLAN', plan.id, remark, req.user, false, now());
  }

  addAuditLog('STATUS_CHANGE', 'PLAN', plan.id, oldStatus, 'IN_PROGRESS', '解除卡住状态', req.user);
  addAuditLog('UNSTICK', 'PLAN', plan.id, null, null, '解除卡住状态', req.user);

  successResponse(res, plan, '已解除卡住状态');
});

router.post('/:id/remarks', (req, res) => {
  const plan = db.plans.find(p => p.id === parseInt(req.params.id));
  if (!plan) return errorResponse(res, '方案确认单不存在', 404);

  if (!canViewPlan(req.user, plan)) {
    return errorResponse(res, '权限不足', 403);
  }

  const { remark } = req.body;
  if (!remark || !remark.trim()) return errorResponse(res, '备注内容不能为空');

  addRemark('PLAN', plan.id, remark, req.user, false, now());
  addAuditLog('ADD_REMARK', 'PLAN', plan.id, null, remark, '添加备注', req.user);

  successResponse(res, null, '备注添加成功');
});

router.get('/:id/remarks', (req, res) => {
  const plan = db.plans.find(p => p.id === parseInt(req.params.id));
  if (!plan) return errorResponse(res, '方案确认单不存在', 404);

  if (!canViewPlan(req.user, plan)) {
    return errorResponse(res, '权限不足', 403);
  }

  const remarks = db.remarks
    .filter(r => r.sourceType === 'PLAN' && r.sourceId === plan.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(convertToRemarkDTO);

  successResponse(res, remarks);
});

router.get('/:id/remarks/inherited', (req, res) => {
  const plan = db.plans.find(p => p.id === parseInt(req.params.id));
  if (!plan) return errorResponse(res, '方案确认单不存在', 404);

  if (!canViewPlan(req.user, plan)) {
    return errorResponse(res, '权限不足', 403);
  }

  const remarks = db.remarks
    .filter(r => r.sourceType === 'PLAN' && r.sourceId === plan.id && r.inherited)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(convertToRemarkDTO);

  successResponse(res, remarks);
});

module.exports = { plansRouter: router };
