const router = require('express').Router();
const { db, addRemark, addAuditLog, successResponse, errorResponse, now } = require('../data/database');
const { requireRole } = require('../middleware/auth');

const ROLES_CAN_MANAGE_SURVEY = ['PROJECT_MANAGER', 'CONSTRUCTION_LEADER'];
const ROLES_CAN_APPROVE_SURVEY = ['PROJECT_MANAGER'];

function canViewSurvey(user, survey) {
  if (ROLES_CAN_MANAGE_SURVEY.includes(user.role)) return true;
  if (survey.assignedTo && survey.assignedTo.id === user.id) return true;
  return false;
}

function canEditSurvey(user, survey) {
  if (ROLES_CAN_MANAGE_SURVEY.includes(user.role)) return true;
  if (survey.assignedTo && survey.assignedTo.id === user.id) return true;
  return false;
}

function canApproveSurvey(user) {
  return ROLES_CAN_APPROVE_SURVEY.includes(user.role);
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

function convertToStuckItemDTO(survey) {
  return {
    id: survey.id,
    projectName: survey.projectName,
    projectCode: survey.projectCode,
    status: survey.status,
    stuckReason: survey.stuckReason,
    stuckAt: survey.stuckAt,
    updatedAt: survey.updatedAt,
    assignedTo: survey.assignedTo?.username,
    assignedToName: survey.assignedTo?.realName,
    stuckHours: survey.stuckAt ? getHoursBetween(survey.stuckAt, now()) : 0
  };
}

router.get('/', (req, res) => {
  let surveys = [...db.surveys];
  if (!ROLES_CAN_MANAGE_SURVEY.includes(req.user.role)) {
    surveys = surveys.filter(s => s.assignedTo && s.assignedTo.id === req.user.id);
  }
  successResponse(res, surveys);
});

router.get('/my', (req, res) => {
  const mySurveys = db.surveys.filter(s => s.assignedTo && s.assignedTo.id === req.user.id);
  successResponse(res, mySurveys);
});

router.get('/stuck', (req, res) => {
  let stuckSurveys = db.surveys.filter(s => s.stuck);
  if (!ROLES_CAN_MANAGE_SURVEY.includes(req.user.role)) {
    stuckSurveys = stuckSurveys.filter(s => s.assignedTo && s.assignedTo.id === req.user.id);
  }
  
  const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  let potentialStuck = db.surveys.filter(s => 
    ['IN_PROGRESS', 'REVIEWING'].includes(s.status) && 
    new Date(s.updatedAt) < new Date(threshold) && 
    !s.stuck
  );
  if (!ROLES_CAN_MANAGE_SURVEY.includes(req.user.role)) {
    potentialStuck = potentialStuck.filter(s => s.assignedTo && s.assignedTo.id === req.user.id);
  }

  successResponse(res, {
    totalStuckSurveys: stuckSurveys.length,
    stuckSurveys: stuckSurveys.map(convertToStuckItemDTO),
    potentialStuckSurveys: potentialStuck.length
  });
});

router.get('/:id', (req, res) => {
  const survey = db.surveys.find(s => s.id === parseInt(req.params.id));
  if (!survey) return errorResponse(res, '勘察单不存在', 404);
  
  if (!canViewSurvey(req.user, survey)) {
    return errorResponse(res, '权限不足，无法查看此勘察单', 403);
  }

  addAuditLog('VIEW', 'SURVEY', survey.id, null, null, '查看详情', req.user);
  successResponse(res, survey);
});

router.post('/', requireRole(...ROLES_CAN_MANAGE_SURVEY), (req, res) => {
  const { projectCode, projectName, customerName, address, pointDescription, pointCount, assignedToId, surveyDate, deadline, remarkContent } = req.body;
  
  if (!projectCode || !projectName) {
    return errorResponse(res, '项目编号和名称不能为空');
  }

  let assignedTo = null;
  if (assignedToId) {
    assignedTo = db.users.find(u => u.id === assignedToId);
    if (!assignedTo) return errorResponse(res, '指定的处理人不存在');
  }

  const newSurvey = {
    id: db.surveys.length > 0 ? Math.max(...db.surveys.map(s => s.id)) + 1 : 1,
    projectCode,
    projectName,
    customerName: customerName || '',
    address: address || '',
    pointDescription: pointDescription || '',
    pointCount: pointCount || 0,
    status: 'PENDING',
    assignedTo: assignedTo ? { id: assignedTo.id, username: assignedTo.username, realName: assignedTo.realName, role: assignedTo.role } : null,
    createdBy: { id: req.user.id, username: req.user.username, realName: req.user.realName, role: req.user.role },
    surveyDate: surveyDate || now(),
    deadline: deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    stuck: false,
    stuckReason: null,
    stuckAt: null,
    createdAt: now(),
    updatedAt: now()
  };

  db.surveys.push(newSurvey);

  if (remarkContent && remarkContent.trim()) {
    addRemark('SURVEY', newSurvey.id, remarkContent, req.user, false, now());
    addAuditLog('ADD_REMARK', 'SURVEY', newSurvey.id, null, remarkContent, '添加备注', req.user);
  }

  addAuditLog('CREATE', 'SURVEY', newSurvey.id, null, projectName, '创建点位勘察单', req.user);

  successResponse(res, newSurvey, '勘察单创建成功');
});

router.put('/:id', requireRole(...ROLES_CAN_MANAGE_SURVEY), (req, res) => {
  const survey = db.surveys.find(s => s.id === parseInt(req.params.id));
  if (!survey) return errorResponse(res, '勘察单不存在', 404);

  if (!canEditSurvey(req.user, survey)) {
    return errorResponse(res, '权限不足，无法修改此勘察单', 403);
  }

  const oldValue = JSON.stringify(survey);
  const { projectCode, projectName, customerName, address, pointDescription, pointCount, assignedToId, surveyDate, deadline, remarkContent } = req.body;

  survey.projectCode = projectCode || survey.projectCode;
  survey.projectName = projectName || survey.projectName;
  survey.customerName = customerName !== undefined ? customerName : survey.customerName;
  survey.address = address !== undefined ? address : survey.address;
  survey.pointDescription = pointDescription !== undefined ? pointDescription : survey.pointDescription;
  survey.pointCount = pointCount !== undefined ? pointCount : survey.pointCount;
  survey.surveyDate = surveyDate || survey.surveyDate;
  survey.deadline = deadline || survey.deadline;
  survey.updatedAt = now();

  if (assignedToId !== undefined) {
    if (assignedToId === null || assignedToId === '') {
      const oldAssignee = survey.assignedTo;
      survey.assignedTo = null;
      addAuditLog('ASSIGN', 'SURVEY', survey.id, oldAssignee?.realName, null, '取消分配', req.user);
    } else {
      const newAssignee = db.users.find(u => u.id === assignedToId);
      if (!newAssignee) return errorResponse(res, '指定的处理人不存在');
      const oldAssignee = survey.assignedTo;
      survey.assignedTo = { id: newAssignee.id, username: newAssignee.username, realName: newAssignee.realName, role: newAssignee.role };
      addAuditLog('ASSIGN', 'SURVEY', survey.id, oldAssignee?.realName, newAssignee.realName, '分配处理人', req.user);
    }
  }

  if (remarkContent && remarkContent.trim()) {
    addRemark('SURVEY', survey.id, remarkContent, req.user, false, now());
    addAuditLog('ADD_REMARK', 'SURVEY', survey.id, null, remarkContent, '添加备注', req.user);
  }

  addAuditLog('UPDATE', 'SURVEY', survey.id, oldValue, JSON.stringify(survey), '更新勘察单信息', req.user);

  successResponse(res, survey, '勘察单更新成功');
});

router.patch('/:id/assign', requireRole(...ROLES_CAN_MANAGE_SURVEY), (req, res) => {
  const survey = db.surveys.find(s => s.id === parseInt(req.params.id));
  if (!survey) return errorResponse(res, '勘察单不存在', 404);

  const { assignedToId } = req.body;
  const oldAssignee = survey.assignedTo;
  
  if (assignedToId) {
    const newAssignee = db.users.find(u => u.id === assignedToId);
    if (!newAssignee) return errorResponse(res, '指定的处理人不存在');
    survey.assignedTo = { id: newAssignee.id, username: newAssignee.username, realName: newAssignee.realName, role: newAssignee.role };
    addAuditLog('ASSIGN', 'SURVEY', survey.id, oldAssignee?.realName, newAssignee.realName, '分配处理人', req.user);
  } else {
    survey.assignedTo = null;
    addAuditLog('ASSIGN', 'SURVEY', survey.id, oldAssignee?.realName, null, '取消分配', req.user);
  }
  
  survey.updatedAt = now();
  successResponse(res, survey, '分配成功');
});

router.patch('/:id/status', (req, res) => {
  const survey = db.surveys.find(s => s.id === parseInt(req.params.id));
  if (!survey) return errorResponse(res, '勘察单不存在', 404);

  if (!canEditSurvey(req.user, survey)) {
    return errorResponse(res, '权限不足，无法修改此勘察单状态', 403);
  }

  const { status, remark, reason } = req.body;
  if (!status) return errorResponse(res, '状态不能为空');

  const oldStatus = survey.status;

  if (status === 'STUCK') {
    survey.stuck = true;
    survey.stuckReason = reason;
    survey.stuckAt = now();
  } else if (oldStatus === 'STUCK' && status !== 'STUCK') {
    survey.stuck = false;
    survey.stuckReason = null;
    survey.stuckAt = null;
  }

  survey.status = status;
  survey.updatedAt = now();

  if (remark && remark.trim()) {
    addRemark('SURVEY', survey.id, remark, req.user, false, now());
    addAuditLog('ADD_REMARK', 'SURVEY', survey.id, null, remark, '添加备注', req.user);
  }

  let detail = `状态从 ${oldStatus} 变更为 ${status}`;
  if (reason) detail += `，原因: ${reason}`;
  addAuditLog('STATUS_CHANGE', 'SURVEY', survey.id, oldStatus, status, detail, req.user);

  successResponse(res, survey, '状态更新成功');
});

router.post('/:id/submit', (req, res) => {
  const survey = db.surveys.find(s => s.id === parseInt(req.params.id));
  if (!survey) return errorResponse(res, '勘察单不存在', 404);

  if (!canEditSurvey(req.user, survey)) {
    return errorResponse(res, '权限不足，无法提交此勘察单', 403);
  }

  if (!['PENDING', 'IN_PROGRESS', 'REJECTED'].includes(survey.status)) {
    return errorResponse(res, '当前状态不允许提交');
  }

  const { remark } = req.body || {};
  const oldStatus = survey.status;
  survey.status = 'SUBMITTED';
  survey.updatedAt = now();

  if (remark && remark.trim()) {
    addRemark('SURVEY', survey.id, remark, req.user, false, now());
  }

  addAuditLog('STATUS_CHANGE', 'SURVEY', survey.id, oldStatus, 'SUBMITTED', '提交审核', req.user);
  addAuditLog('SUBMIT', 'SURVEY', survey.id, null, null, '提交审核', req.user);

  successResponse(res, survey, '提交成功');
});

router.post('/:id/approve', requireRole(...ROLES_CAN_APPROVE_SURVEY), (req, res) => {
  const survey = db.surveys.find(s => s.id === parseInt(req.params.id));
  if (!survey) return errorResponse(res, '勘察单不存在', 404);

  if (!['SUBMITTED', 'REVIEWING'].includes(survey.status)) {
    return errorResponse(res, '当前状态不允许审批通过');
  }

  const { remark } = req.body || {};
  const oldStatus = survey.status;
  survey.status = 'APPROVED';
  survey.updatedAt = now();

  if (remark && remark.trim()) {
    addRemark('SURVEY', survey.id, remark, req.user, false, now());
  }

  addAuditLog('STATUS_CHANGE', 'SURVEY', survey.id, oldStatus, 'APPROVED', '审核通过', req.user);
  addAuditLog('APPROVE', 'SURVEY', survey.id, null, null, '审核通过', req.user);

  successResponse(res, survey, '审核通过');
});

router.post('/:id/reject', requireRole(...ROLES_CAN_APPROVE_SURVEY), (req, res) => {
  const survey = db.surveys.find(s => s.id === parseInt(req.params.id));
  if (!survey) return errorResponse(res, '勘察单不存在', 404);

  if (!['SUBMITTED', 'REVIEWING'].includes(survey.status)) {
    return errorResponse(res, '当前状态不允许拒绝');
  }

  const { reason, remark } = req.body;
  if (!reason) return errorResponse(res, '请说明拒绝原因');

  const oldStatus = survey.status;
  survey.status = 'REJECTED';
  survey.updatedAt = now();

  if (remark && remark.trim()) {
    addRemark('SURVEY', survey.id, remark, req.user, false, now());
  }

  addAuditLog('STATUS_CHANGE', 'SURVEY', survey.id, oldStatus, 'REJECTED', `拒绝: ${reason}`, req.user);
  addAuditLog('REJECT', 'SURVEY', survey.id, null, reason, `拒绝: ${reason}`, req.user);

  successResponse(res, survey, '已拒绝');
});

router.post('/:id/stuck', (req, res) => {
  const survey = db.surveys.find(s => s.id === parseInt(req.params.id));
  if (!survey) return errorResponse(res, '勘察单不存在', 404);

  if (!canEditSurvey(req.user, survey)) {
    return errorResponse(res, '权限不足', 403);
  }

  if (survey.stuck) return errorResponse(res, '此勘察单已处于卡住状态');

  const { reason } = req.body;
  if (!reason) return errorResponse(res, '请说明卡住原因');

  const oldStatus = survey.status;
  survey.status = 'STUCK';
  survey.stuck = true;
  survey.stuckReason = reason;
  survey.stuckAt = now();
  survey.updatedAt = now();

  addAuditLog('STATUS_CHANGE', 'SURVEY', survey.id, oldStatus, 'STUCK', `标记为卡住: ${reason}`, req.user);
  addAuditLog('MARK_STUCK', 'SURVEY', survey.id, null, reason, '标记为卡住', req.user);

  successResponse(res, survey, '已标记为卡住');
});

router.post('/:id/unstick', (req, res) => {
  const survey = db.surveys.find(s => s.id === parseInt(req.params.id));
  if (!survey) return errorResponse(res, '勘察单不存在', 404);

  if (!canEditSurvey(req.user, survey)) {
    return errorResponse(res, '权限不足', 403);
  }

  if (!survey.stuck) return errorResponse(res, '此勘察单未处于卡住状态');

  const { remark } = req.body || {};
  const oldStatus = survey.status;
  survey.status = 'IN_PROGRESS';
  survey.stuck = false;
  survey.stuckReason = null;
  survey.stuckAt = null;
  survey.updatedAt = now();

  if (remark && remark.trim()) {
    addRemark('SURVEY', survey.id, remark, req.user, false, now());
  }

  addAuditLog('STATUS_CHANGE', 'SURVEY', survey.id, oldStatus, 'IN_PROGRESS', '解除卡住状态', req.user);
  addAuditLog('UNSTICK', 'SURVEY', survey.id, null, null, '解除卡住状态', req.user);

  successResponse(res, survey, '已解除卡住状态');
});

router.post('/:id/remarks', (req, res) => {
  const survey = db.surveys.find(s => s.id === parseInt(req.params.id));
  if (!survey) return errorResponse(res, '勘察单不存在', 404);

  if (!canViewSurvey(req.user, survey)) {
    return errorResponse(res, '权限不足', 403);
  }

  const { remark } = req.body;
  if (!remark || !remark.trim()) return errorResponse(res, '备注内容不能为空');

  addRemark('SURVEY', survey.id, remark, req.user, false, now());
  addAuditLog('ADD_REMARK', 'SURVEY', survey.id, null, remark, '添加备注', req.user);

  successResponse(res, null, '备注添加成功');
});

router.get('/:id/remarks', (req, res) => {
  const survey = db.surveys.find(s => s.id === parseInt(req.params.id));
  if (!survey) return errorResponse(res, '勘察单不存在', 404);

  if (!canViewSurvey(req.user, survey)) {
    return errorResponse(res, '权限不足', 403);
  }

  const remarks = db.remarks
    .filter(r => r.sourceType === 'SURVEY' && r.sourceId === survey.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(convertToRemarkDTO);

  successResponse(res, remarks);
});

module.exports = { surveysRouter: router };
