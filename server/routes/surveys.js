const router = require('express').Router();
const { db, addRemark, addAuditLog, successResponse, errorResponse, now } = require('../data/database');
const { requireRole } = require('../middleware/auth');

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
  successResponse(res, db.surveys);
});

router.get('/my', (req, res) => {
  const mySurveys = db.surveys.filter(s => s.assignedTo.id === req.user.id);
  successResponse(res, mySurveys);
});

router.get('/stuck', (req, res) => {
  const stuckSurveys = db.surveys.filter(s => s.stuck);
  const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const potentialStuck = db.surveys.filter(s => 
    ['IN_PROGRESS', 'REVIEWING'].includes(s.status) && 
    new Date(s.updatedAt) < new Date(threshold) && 
    !s.stuck
  );

  successResponse(res, {
    totalStuckSurveys: stuckSurveys.length,
    totalStuckPlans: 0,
    stuckSurveys: stuckSurveys.map(convertToStuckItemDTO),
    stuckPlans: [],
    potentialStuckSurveys: potentialStuck.length,
    potentialStuckPlans: 0
  });
});

router.get('/:id', (req, res) => {
  const survey = db.surveys.find(s => s.id === parseInt(req.params.id));
  if (!survey) return errorResponse(res, '勘察单不存在', 404);

  addAuditLog('VIEW', 'SURVEY', survey.id, null, null, '查看详情', req.user);
  successResponse(res, survey);
});

router.post('/', requireRole('PROJECT_MANAGER', 'CONSTRUCTION_LEADER'), (req, res) => {
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

router.put('/:id', requireRole('PROJECT_MANAGER', 'CONSTRUCTION_LEADER'), (req, res) => {
  const survey = db.surveys.find(s => s.id === parseInt(req.params.id));
  if (!survey) return errorResponse(res, '勘察单不存在', 404);

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

  if (assignedToId) {
    const newAssignee = db.users.find(u => u.id === assignedToId);
    if (!newAssignee) return errorResponse(res, '指定的处理人不存在');
    const oldAssignee = survey.assignedTo;
    survey.assignedTo = { id: newAssignee.id, username: newAssignee.username, realName: newAssignee.realName, role: newAssignee.role };
    addAuditLog('ASSIGN', 'SURVEY', survey.id, oldAssignee?.realName, newAssignee.realName, '分配处理人', req.user);
  }

  if (remarkContent && remarkContent.trim()) {
    addRemark('SURVEY', survey.id, remarkContent, req.user, false, now());
    addAuditLog('ADD_REMARK', 'SURVEY', survey.id, null, remarkContent, '添加备注', req.user);
  }

  addAuditLog('UPDATE', 'SURVEY', survey.id, oldValue, JSON.stringify(survey), '更新勘察单信息', req.user);

  successResponse(res, survey, '勘察单更新成功');
});

router.patch('/:id/status', (req, res) => {
  const survey = db.surveys.find(s => s.id === parseInt(req.params.id));
  if (!survey) return errorResponse(res, '勘察单不存在', 404);

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

router.post('/:id/submit', requireRole('PROJECT_MANAGER', 'CONSTRUCTION_LEADER'), (req, res) => {
  const survey = db.surveys.find(s => s.id === parseInt(req.params.id));
  if (!survey) return errorResponse(res, '勘察单不存在', 404);

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

router.post('/:id/approve', requireRole('PROJECT_MANAGER'), (req, res) => {
  const survey = db.surveys.find(s => s.id === parseInt(req.params.id));
  if (!survey) return errorResponse(res, '勘察单不存在', 404);

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

router.post('/:id/reject', requireRole('PROJECT_MANAGER'), (req, res) => {
  const survey = db.surveys.find(s => s.id === parseInt(req.params.id));
  if (!survey) return errorResponse(res, '勘察单不存在', 404);

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

  const { reason } = req.body;
  if (!reason) return errorResponse(res, '请说明卡住原因');

  const oldStatus = survey.status;
  survey.status = 'STUCK';
  survey.stuck = true;
  survey.stuckReason = reason;
  survey.stuckAt = now();
  survey.updatedAt = now();

  addAuditLog('STATUS_CHANGE', 'SURVEY', survey.id, oldStatus, 'STUCK', `标记为卡住: ${reason}`, req.user);

  successResponse(res, survey, '已标记为卡住');
});

router.post('/:id/unstick', (req, res) => {
  const survey = db.surveys.find(s => s.id === parseInt(req.params.id));
  if (!survey) return errorResponse(res, '勘察单不存在', 404);

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

  successResponse(res, survey, '已解除卡住状态');
});

router.post('/:id/remarks', (req, res) => {
  const survey = db.surveys.find(s => s.id === parseInt(req.params.id));
  if (!survey) return errorResponse(res, '勘察单不存在', 404);

  const { remark } = req.body;
  if (!remark || !remark.trim()) return errorResponse(res, '备注内容不能为空');

  addRemark('SURVEY', survey.id, remark, req.user, false, now());
  addAuditLog('ADD_REMARK', 'SURVEY', survey.id, null, remark, '添加备注', req.user);

  successResponse(res, null, '备注添加成功');
});

router.get('/:id/remarks', (req, res) => {
  const surveyId = parseInt(req.params.id);
  const remarks = db.remarks
    .filter(r => r.sourceType === 'SURVEY' && r.sourceId === surveyId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(convertToRemarkDTO);

  successResponse(res, remarks);
});

module.exports = { surveysRouter: router };
