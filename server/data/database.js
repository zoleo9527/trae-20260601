const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const db = {
  users: [],
  surveys: [],
  plans: [],
  remarks: [],
  auditLogs: []
};

let idCounter = 1;
function nextId() {
  return idCounter++;
}

function now() {
  return new Date().toISOString();
}

function hoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function daysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function formatDate(date) {
  return new Date(date).toISOString();
}

function initDatabase() {
  if (db.users.length > 0) return;

  const pm = {
    id: nextId(),
    username: 'pm',
    password: bcrypt.hashSync('123456', 10),
    realName: '张明-项目经理',
    role: 'PROJECT_MANAGER',
    phone: '13800138001',
    department: '项目部',
    enabled: true,
    createdAt: daysAgo(30),
    updatedAt: daysAgo(30)
  };

  const leader = {
    id: nextId(),
    username: 'leader',
    password: bcrypt.hashSync('123456', 10),
    realName: '李强-施工队长',
    role: 'CONSTRUCTION_LEADER',
    phone: '13800138002',
    department: '施工部',
    enabled: true,
    createdAt: daysAgo(30),
    updatedAt: daysAgo(30)
  };

  const engineer = {
    id: nextId(),
    username: 'engineer',
    password: bcrypt.hashSync('123456', 10),
    realName: '王工-售后工程师',
    role: 'AFTER_SALES_ENGINEER',
    phone: '13800138003',
    department: '售后部',
    enabled: true,
    createdAt: daysAgo(30),
    updatedAt: daysAgo(30)
  };

  db.users.push(pm, leader, engineer);

  const surveys = [
    createSurvey('AX-2026-001', '安信大厦智能监控系统', '安信地产', '北京市朝阳区建国路88号', 45, 'APPROVED', pm, leader, daysAgo(7), daysAgo(5), false, null, null),
    createSurvey('AX-2026-002', '恒基商业广场安防升级', '恒基商业', '上海市浦东新区世纪大道100号', 78, 'IN_PROGRESS', pm, engineer, daysAgo(3), hoursAgo(2), false, null, null),
    createSurvey('AX-2026-003', '绿城小区门禁改造', '绿城物业', '广州市天河区体育西路200号', 32, 'STUCK', leader, engineer, daysAgo(5), daysAgo(2), true, '业主方临时变更需求，点位增加20个，需重新评估', daysAgo(2)),
    createSurvey('AX-2026-004', '金融中心周界报警系统', '金控集团', '深圳市南山区科技园路1号', 56, 'SUBMITTED', pm, leader, daysAgo(4), daysAgo(1), false, null, null),
    createSurvey('AX-2026-005', '物流园区监控全覆盖', '顺丰物流', '杭州市余杭区良渚物流园', 120, 'REVIEWING', leader, engineer, daysAgo(6), daysAgo(3), false, null, null),
    createSurvey('AX-2026-006', '医院病房呼叫系统', '协和医院', '成都市武侯区国学巷37号', 200, 'REJECTED', pm, leader, daysAgo(10), daysAgo(7), false, null, null),
    createSurvey('AX-2026-007', '学校校园一卡通', '实验中学', '武汉市洪山区珞喻路100号', 85, 'STUCK', pm, engineer, daysAgo(8), daysAgo(4), true, '暑假施工窗口有限，需协调教育局审批', daysAgo(4))
  ];

  db.surveys.push(...surveys);

  addSurveyRemarks(surveys[0], pm, leader);
  addSurveyRemarks(surveys[1], leader, engineer);
  addSurveyRemarks(surveys[2], engineer, pm);
  addSurveyRemarks(surveys[3], pm, leader);
  addSurveyRemarks(surveys[4], leader, engineer);
  addSurveyRemarks(surveys[5], engineer, pm);
  addSurveyRemarks(surveys[6], pm, engineer);

  createPlanWithRemarks(surveys[0], pm, leader, 'CONFIRMED', false, null, null);
  createPlanWithRemarks(surveys[1], leader, engineer, 'CUSTOMER_REVIEWING', false, null, null);
  createPlanWithRemarks(surveys[4], engineer, pm, 'STUCK', true, '客户对设备选型有异议，要求改用海康威视高端机型', hoursAgo(8));
  createPlanWithRemarks(surveys[5], pm, leader, 'REJECTED', false, null, null);

  console.log('✅ 数据库初始化完成');
  console.log(`   - ${db.users.length} 个用户`);
  console.log(`   - ${db.surveys.length} 个勘察单`);
  console.log(`   - ${db.plans.length} 个方案单`);
  console.log(`   - ${db.remarks.length} 条备注`);
  console.log(`   - ${db.auditLogs.length} 条审计日志`);
}

function createSurvey(code, name, customer, address, pointCount, status, createdBy, assignedTo, createdAt, updatedAt, stuck, stuckReason, stuckAt) {
  return {
    id: nextId(),
    projectCode: code,
    projectName: name,
    customerName: customer,
    address,
    pointDescription: generatePointDescription(name, pointCount),
    pointCount,
    status,
    assignedTo: { id: assignedTo.id, username: assignedTo.username, realName: assignedTo.realName, role: assignedTo.role },
    createdBy: { id: createdBy.id, username: createdBy.username, realName: createdBy.realName, role: createdBy.role },
    surveyDate: new Date(createdAt).toISOString().split('T')[0] + 'T00:00:00.000Z',
    deadline: new Date(new Date(updatedAt).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    stuck,
    stuckReason,
    stuckAt,
    createdAt,
    updatedAt
  };
}

function addSurveyRemarks(survey, user1, user2) {
  addRemark('SURVEY', survey.id, 
    `现场勘察完成，共发现 ${survey.pointCount} 个点位需要布控，包含出入口、电梯厅、走廊、停车场等区域`,
    user1, false, hoursAgo(48));

  if (survey.status === 'STUCK') {
    addRemark('SURVEY', survey.id, `【卡住】${survey.stuckReason}`, user2, false, hoursAgo(24));
  }
  if (survey.status === 'REJECTED') {
    addRemark('SURVEY', survey.id, '图纸点位标注不清晰，特别是负二层停车场区域，请重新勘察后提交', user1, false, hoursAgo(12));
  }
  if (survey.status === 'APPROVED') {
    addRemark('SURVEY', survey.id, '点位勘察完整，覆盖了所有重要区域，同意进入方案阶段', user1, false, hoursAgo(6));
  }
  if (survey.status === 'SUBMITTED' || survey.status === 'REVIEWING') {
    addRemark('SURVEY', survey.id, '已完成现场测量，摄像头点位图已上传，请项目经理审核', user2, false, hoursAgo(3));
  }

  addRemark('SURVEY', survey.id, '补充：弱电井位置已确认，走线方案可行，无需额外开槽', user2, false, hoursAgo(1));
}

function createPlanWithRemarks(survey, createdBy, assignedTo, status, stuck, stuckReason, stuckAt) {
  const plan = {
    id: nextId(),
    survey: { id: survey.id, projectCode: survey.projectCode, projectName: survey.projectName },
    surveyId: survey.id,
    projectCode: survey.projectCode,
    projectName: survey.projectName,
    planContent: generatePlanContent(survey),
    equipmentList: generateEquipmentList(survey.pointCount),
    estimatedCost: survey.pointCount * 3500,
    constructionDays: Math.ceil(survey.pointCount / 10) + 5,
    status,
    assignedTo: { id: assignedTo.id, username: assignedTo.username, realName: assignedTo.realName, role: assignedTo.role },
    createdBy: { id: createdBy.id, username: createdBy.username, realName: createdBy.realName, role: createdBy.role },
    planDate: now(),
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    confirmedAt: status === 'CONFIRMED' ? now() : null,
    stuck,
    stuckReason,
    stuckAt,
    createdAt: now(),
    updatedAt: now()
  };

  db.plans.push(plan);

  const surveyRemarks = db.remarks.filter(r => r.sourceType === 'SURVEY' && r.sourceId === survey.id);
  surveyRemarks.forEach(sr => {
    addRemark('PLAN', plan.id, `[继承自勘察] ${sr.content}`, sr.createdBy, true, new Date(new Date(sr.createdAt).getTime() + 60 * 60 * 1000).toISOString());
  });

  addRemark('PLAN', plan.id, '方案初稿完成，设备选型采用海康威视主流产品，性价比最优', createdBy, false, hoursAgo(2));

  if (status === 'CONFIRMED') {
    addRemark('PLAN', plan.id, '客户已确认方案，预计下周进场施工', assignedTo, false, hoursAgo(1));
  }
  if (status === 'CUSTOMER_REVIEWING') {
    addRemark('PLAN', plan.id, '方案已发送客户，预计3个工作日内反馈', assignedTo, false, hoursAgo(1));
  }
  if (status === 'STUCK') {
    addRemark('PLAN', plan.id, `【卡住】${stuckReason}`, assignedTo, false, hoursAgo(8));
  }
  if (status === 'REJECTED') {
    addRemark('PLAN', plan.id, '客户认为报价偏高，希望降低10%预算，同时保留原有设备档次', createdBy, false, hoursAgo(5));
    addRemark('PLAN', plan.id, '已与供应商沟通，批量采购可降低5%成本，需要求客户增加合同量', assignedTo, false, hoursAgo(3));
  }

  return plan;
}

function addRemark(sourceType, sourceId, content, createdBy, inherited, createdAt) {
  const remark = {
    id: nextId(),
    content,
    sourceType,
    sourceId,
    inherited: inherited || false,
    createdBy: { id: createdBy.id, username: createdBy.username, realName: createdBy.realName, role: createdBy.role },
    createdAt: createdAt || now()
  };
  db.remarks.push(remark);
  return remark;
}

function addAuditLog(action, targetType, targetId, oldValue, newValue, detail, performedBy) {
  const log = {
    id: nextId(),
    action,
    targetType,
    targetId,
    oldValue,
    newValue,
    detail,
    performedBy: performedBy ? { id: performedBy.id, username: performedBy.username, realName: performedBy.realName, role: performedBy.role } : null,
    performedAt: now(),
    ipAddress: null
  };
  db.auditLogs.push(log);
  return log;
}

function generatePointDescription(projectName, count) {
  return `${projectName}点位分布：\n` +
    `- 主出入口：4个球机\n` +
    `- 地下车库：${Math.floor(count / 3)}个枪机\n` +
    `- 电梯厅/轿厢：${Math.floor(count / 5)}个半球\n` +
    `- 走廊通道：${Math.floor(count / 4)}个枪机\n` +
    `- 机房/配电室：${Math.floor(count / 10)}个半球\n` +
    `- 周界围墙：${Math.floor(count / 6)}个球机\n` +
    `- 其他区域：${count - Math.floor(count/3) - Math.floor(count/5) - Math.floor(count/4) - Math.floor(count/10) - Math.floor(count/6)}个点位`;
}

function generatePlanContent(survey) {
  return `一、项目概况\n` +
    `${survey.projectName}安防系统建设方案，共${survey.pointCount}个监控点位。\n\n` +
    `二、设计依据\n` +
    `1. GB50348-2018《安全防范工程技术标准》\n` +
    `2. 现场勘察记录及业主要求\n\n` +
    `三、系统架构\n` +
    `采用高清网络视频监控系统，前端摄像头通过光纤汇聚到机房NVR，统一存储管理。\n\n` +
    `四、施工方案\n` +
    `1. 管路敷设：采用镀锌钢管暗敷\n` +
    `2. 设备安装：摄像头离地2.8米，护罩防水\n` +
    `3. 系统调试：逐点测试图像质量、存储回放`;
}

function generateEquipmentList(count) {
  return `主要设备清单：\n` +
    `1. 400万像素红外球机：${Math.floor(count / 4)}台\n` +
    `2. 400万像素红外枪机：${Math.floor(count / 2)}台\n` +
    `3. 400万像素电梯半球：${Math.floor(count / 5)}台\n` +
    `4. 64路NVR录像机：${Math.floor(count / 60) + 1}台\n` +
    `5. 4T监控硬盘：${(Math.floor(count / 60) + 1) * 8}块\n` +
    `6. 24口千兆交换机：${Math.floor(count / 24) + 1}台\n` +
    `7. 光纤收发器：若干\n` +
    `8. 监控管理平台：1套`;
}

function successResponse(res, data, message = '操作成功') {
  res.json({ success: true, message, data });
}

function errorResponse(res, message, status = 400) {
  res.status(status).json({ success: false, message, data: null });
}

module.exports = {
  db,
  initDatabase,
  addRemark,
  addAuditLog,
  successResponse,
  errorResponse,
  nextId,
  now,
  formatDate
};
