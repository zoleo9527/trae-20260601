const { store, generateId } = require('../data/store');
const {
  ROLES,
  PROJECT_STATUS,
  PROJECT_STATUS_LABELS,
  SCHEDULE_STATUS,
  SCHEDULE_STATUS_LABELS
} = require('../data/init');
const AuthService = require('./authService');
const RecordService = require('./recordService');
const ProjectService = require('./projectService');

class ScheduleService {
  static getSchedule(scheduleId) {
    return store.schedules.find(s => s.id === scheduleId);
  }

  static requireSchedule(scheduleId) {
    const schedule = this.getSchedule(scheduleId);
    if (!schedule) {
      const err = new Error(`生产排单不存在: ${scheduleId}`);
      err.status = 404;
      err.code = 'SCHEDULE_NOT_FOUND';
      throw err;
    }
    return schedule;
  }

  static getByProject(projectId) {
    return store.schedules.find(s => s.projectId === projectId);
  }

  static listByProject(projectId) {
    return store.schedules
      .filter(s => s.projectId === projectId)
      .sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));
  }

  static submitSchedule(projectId, params, operatorId) {
    AuthService.requireRole(operatorId, [ROLES.PRODUCTION_MASTER]);
    const project = ProjectService.requireProject(projectId);

    if (![PROJECT_STATUS.DRAWING_CONFIRMED, PROJECT_STATUS.PRODUCTION_PENDING].includes(project.status)) {
      const err = new Error(`当前项目状态「${project.statusLabel}」不允许提交生产排单，请先完成图纸确认`);
      err.status = 400;
      err.code = 'INVALID_STATUS';
      throw err;
    }

    if (project.productionMasterId !== operatorId) {
      const err = new Error('仅该项目指定的制作师傅可以提交生产排单');
      err.status = 403;
      err.code = 'PERMISSION_DENIED';
      throw err;
    }

    const now = new Date().toISOString();
    const oldStatus = project.status;
    const oldStatusLabel = project.statusLabel;
    let schedule = this.getByProject(projectId);

    if (!schedule) {
      schedule = {
        id: 'SCH_' + generateId(),
        projectId,
        projectName: project.name,
        status: SCHEDULE_STATUS.PENDING,
        statusLabel: SCHEDULE_STATUS_LABELS.PENDING,
        productionStartDate: null,
        productionEndDate: null,
        installStartDate: null,
        installEndDate: null,
        materialPlan: [],
        productionTasks: [],
        installPlan: [],
        submittedBy: null,
        submittedByName: null,
        submittedAt: null,
        confirmedBy: null,
        confirmedByName: null,
        confirmedAt: null,
        confirmRemark: null,
        remarks: []
      };
      store.schedules.unshift(schedule);
    }

    schedule.productionStartDate = params.productionStartDate;
    schedule.productionEndDate = params.productionEndDate;
    schedule.installStartDate = params.installStartDate;
    schedule.installEndDate = params.installEndDate;
    schedule.materialPlan = params.materialPlan || [];
    schedule.productionTasks = params.productionTasks || [];
    schedule.installPlan = params.installPlan || [];
    schedule.status = SCHEDULE_STATUS.PENDING;
    schedule.statusLabel = SCHEDULE_STATUS_LABELS.PENDING;
    schedule.submittedBy = operatorId;
    schedule.submittedByName = AuthService.getUser(operatorId).name;
    schedule.submittedAt = now;
    schedule.confirmedBy = null;
    schedule.confirmedByName = null;
    schedule.confirmedAt = null;
    schedule.confirmRemark = null;

    const materialSummary = schedule.materialPlan.length > 0
      ? `${schedule.materialPlan.length}类物料`
      : '无物料计划';
    const taskSummary = schedule.productionTasks.length > 0
      ? `${schedule.productionTasks.length}项生产任务`
      : '无生产任务';
    const installSummary = schedule.installPlan.length > 0
      ? `${schedule.installPlan.length}个安装区域`
      : '无安装计划';

    RecordService.createRecord({
      projectId,
      type: 'SCHEDULE_SUBMIT',
      operator: operatorId,
      detail: `提交生产排单：生产周期${params.productionStartDate || '待定'}-${params.productionEndDate || '待定'}，安装周期${params.installStartDate || '待定'}-${params.installEndDate || '待定'}，共${materialSummary}、${taskSummary}、${installSummary}`,
      fromStatus: oldStatus,
      toStatus: PROJECT_STATUS.PRODUCTION_PENDING,
      refId: schedule.id
    });

    project.status = PROJECT_STATUS.PRODUCTION_PENDING;
    project.statusLabel = PROJECT_STATUS_LABELS.PRODUCTION_PENDING;
    project.currentHandler = project.projectManagerId;
    project.currentHandlerName = project.projectManagerName;
    project.updatedAt = now;

    RecordService.createRecord({
      projectId,
      type: 'STATUS_CHANGE',
      operator: operatorId,
      detail: `项目状态从「${oldStatusLabel}」变更为「${PROJECT_STATUS_LABELS.PRODUCTION_PENDING}」，当前处理人：${project.projectManagerName}(项目专员)`,
      fromStatus: oldStatus,
      toStatus: PROJECT_STATUS.PRODUCTION_PENDING
    });

    return schedule;
  }

  static confirmSchedule(scheduleId, params, operatorId) {
    AuthService.requireRole(operatorId, [ROLES.PROJECT_MANAGER]);
    const schedule = this.requireSchedule(scheduleId);
    const project = ProjectService.requireProject(schedule.projectId);

    if (schedule.status !== SCHEDULE_STATUS.PENDING) {
      const err = new Error(`当前排单状态「${schedule.statusLabel}」不允许确认，仅待确认状态可操作`);
      err.status = 400;
      err.code = 'INVALID_STATUS';
      throw err;
    }

    if (project.projectManagerId !== operatorId) {
      const err = new Error('仅该项目的项目专员可以确认生产排单');
      err.status = 403;
      err.code = 'PERMISSION_DENIED';
      throw err;
    }

    const now = new Date().toISOString();
    const oldStatus = project.status;
    const oldStatusLabel = project.statusLabel;

    schedule.status = SCHEDULE_STATUS.CONFIRMED;
    schedule.statusLabel = SCHEDULE_STATUS_LABELS.CONFIRMED;
    schedule.confirmedBy = operatorId;
    schedule.confirmedByName = AuthService.getUser(operatorId).name;
    schedule.confirmedAt = now;
    schedule.confirmRemark = params.remark || '';

    RecordService.createRecord({
      projectId: schedule.projectId,
      type: 'SCHEDULE_CONFIRM',
      operator: operatorId,
      detail: `确认生产排单：${params.remark || '无备注'}`,
      fromStatus: oldStatus,
      toStatus: PROJECT_STATUS.PRODUCTION_CONFIRMED,
      refId: schedule.id
    });

    project.status = PROJECT_STATUS.PRODUCTION_CONFIRMED;
    project.statusLabel = PROJECT_STATUS_LABELS.PRODUCTION_CONFIRMED;
    project.currentHandler = project.installLeaderId;
    project.currentHandlerName = project.installLeaderName;
    project.updatedAt = now;

    RecordService.createRecord({
      projectId: schedule.projectId,
      type: 'STATUS_CHANGE',
      operator: operatorId,
      detail: `项目状态从「${oldStatusLabel}」变更为「${PROJECT_STATUS_LABELS.PRODUCTION_CONFIRMED}」，当前处理人：${project.installLeaderName}(安装负责人)`,
      fromStatus: oldStatus,
      toStatus: PROJECT_STATUS.PRODUCTION_CONFIRMED
    });

    return schedule;
  }

  static addRemark(scheduleId, params, operatorId) {
    const schedule = this.requireSchedule(scheduleId);
    const project = ProjectService.requireProject(schedule.projectId);
    const user = AuthService.requireUser(operatorId);

    if (!AuthService.canHandleProject(operatorId, project)) {
      const err = new Error('无权操作此项目');
      err.status = 403;
      err.code = 'PERMISSION_DENIED';
      throw err;
    }

    const remark = {
      id: generateId(),
      content: params.content,
      author: user.name,
      authorId: operatorId,
      createdAt: new Date().toISOString()
    };

    schedule.remarks.push(remark);
    return remark;
  }

  static getDetail(scheduleId) {
    const schedule = this.requireSchedule(scheduleId);
    const allRecords = RecordService.listByProject(schedule.projectId);

    let submitIdx = -1;
    let confirmIdx = -1;
    allRecords.forEach((r, idx) => {
      if (r.type === 'SCHEDULE_SUBMIT' && r.refId === scheduleId) {
        submitIdx = idx;
      }
      if (r.type === 'SCHEDULE_CONFIRM' && r.refId === scheduleId) {
        confirmIdx = idx;
      }
    });

    const startIdx = submitIdx >= 0 ? submitIdx : 0;
    const endIdx = confirmIdx >= 0 ? confirmIdx : allRecords.length - 1;
    const timeline = allRecords.filter((r, idx) => {
      if (r.type === 'SCHEDULE_SUBMIT' || r.type === 'SCHEDULE_CONFIRM') {
        return r.refId === scheduleId;
      }
      if (r.type === 'STATUS_CHANGE') {
        return idx >= startIdx && idx <= endIdx + 1;
      }
      if (r.type === 'REMARK_ADD') {
        return idx >= startIdx && idx <= endIdx;
      }
      return false;
    });

    return {
      ...schedule,
      auditTrail: RecordService._sortRecords(timeline, false)
    };
  }

  static getHistory(projectId) {
    return this.listByProject(projectId);
  }
}

module.exports = ScheduleService;
