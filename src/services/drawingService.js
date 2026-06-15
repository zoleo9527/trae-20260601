const { store, generateId } = require('../data/store');
const {
  ROLES,
  PROJECT_STATUS,
  PROJECT_STATUS_LABELS,
  DRAWING_STATUS,
  DRAWING_STATUS_LABELS
} = require('../data/init');
const AuthService = require('./authService');
const RecordService = require('./recordService');
const ProjectService = require('./projectService');

class DrawingService {
  static getDrawing(drawingId) {
    return store.drawings.find(d => d.id === drawingId);
  }

  static requireDrawing(drawingId) {
    const drawing = this.getDrawing(drawingId);
    if (!drawing) {
      const err = new Error(`图纸不存在: ${drawingId}`);
      err.status = 404;
      err.code = 'DRAWING_NOT_FOUND';
      throw err;
    }
    return drawing;
  }

  static listByProject(projectId) {
    return store.drawings
      .filter(d => d.projectId === projectId)
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  }

  static submitDrawing(projectId, params, operatorId) {
    AuthService.requireRole(operatorId, [ROLES.PROJECT_MANAGER]);
    const project = ProjectService.requireProject(projectId);

    if (![PROJECT_STATUS.DRAFT, PROJECT_STATUS.DRAWING_PENDING].includes(project.status)) {
      const err = new Error(`当前项目状态「${project.statusLabel}」不允许提交图纸确认，请先回退状态`);
      err.status = 400;
      err.code = 'INVALID_STATUS';
      throw err;
    }

    const now = new Date().toISOString();
    const drawing = {
      id: 'DRW_' + generateId(),
      projectId,
      projectName: project.name,
      version: params.version || 'v1',
      fileName: params.fileName,
      fileUrl: params.fileUrl || null,
      status: DRAWING_STATUS.PENDING,
      statusLabel: DRAWING_STATUS_LABELS.PENDING,
      submittedBy: operatorId,
      submittedByName: AuthService.getUser(operatorId).name,
      submittedAt: now,
      confirmedBy: null,
      confirmedByName: null,
      confirmedAt: null,
      confirmRemark: null,
      changes: params.changes || []
    };

    store.drawings.unshift(drawing);

    project.designFile = params.fileName;
    project.updatedAt = now;

    if (project.status === PROJECT_STATUS.DRAFT) {
      project.status = PROJECT_STATUS.DRAWING_PENDING;
      project.statusLabel = PROJECT_STATUS_LABELS.DRAWING_PENDING;
      project.currentHandler = project.productionMasterId;
      project.currentHandlerName = project.productionMasterName;

      RecordService.createRecord({
        projectId,
        type: 'STATUS_CHANGE',
        operator: operatorId,
        detail: `项目状态从「${PROJECT_STATUS_LABELS.DRAFT}」变更为「${PROJECT_STATUS_LABELS.DRAWING_PENDING}」，当前处理人：${project.productionMasterName}(${PROJECT_STATUS_LABELS.DRAWING_PENDING === project.statusLabel ? '制作师傅' : '制作师傅'})`,
        fromStatus: PROJECT_STATUS.DRAFT,
        toStatus: PROJECT_STATUS.DRAWING_PENDING
      });
    }

    const changesText = drawing.changes && drawing.changes.length > 0
      ? `，主要变更：${drawing.changes.join('、')}`
      : '';

    RecordService.createRecord({
      projectId,
      type: 'DRAWING_SUBMIT',
      operator: operatorId,
      detail: `提交图纸确认：${drawing.fileName}，版本${drawing.version}${changesText}`,
      fromStatus: project.status,
      toStatus: project.status,
      refId: drawing.id
    });

    return drawing;
  }

  static confirmDrawing(drawingId, params, operatorId) {
    AuthService.requireRole(operatorId, [ROLES.PRODUCTION_MASTER]);
    const drawing = this.requireDrawing(drawingId);
    const project = ProjectService.requireProject(drawing.projectId);

    if (drawing.status !== DRAWING_STATUS.PENDING) {
      const err = new Error(`当前图纸状态「${drawing.statusLabel}」不允许确认，仅待确认状态可操作`);
      err.status = 400;
      err.code = 'INVALID_STATUS';
      throw err;
    }

    if (project.productionMasterId !== operatorId) {
      const err = new Error('仅该项目指定的制作师傅可以确认图纸');
      err.status = 403;
      err.code = 'PERMISSION_DENIED';
      throw err;
    }

    const now = new Date().toISOString();
    drawing.status = DRAWING_STATUS.CONFIRMED;
    drawing.statusLabel = DRAWING_STATUS_LABELS.CONFIRMED;
    drawing.confirmedBy = operatorId;
    drawing.confirmedByName = AuthService.getUser(operatorId).name;
    drawing.confirmedAt = now;
    drawing.confirmRemark = params.remark || '';

    project.status = PROJECT_STATUS.DRAWING_CONFIRMED;
    project.statusLabel = PROJECT_STATUS_LABELS.DRAWING_CONFIRMED;
    project.updatedAt = now;

    RecordService.createRecord({
      projectId: drawing.projectId,
      type: 'DRAWING_CONFIRM',
      operator: operatorId,
      detail: `确认图纸${drawing.version}：${params.remark || '无备注'}`,
      fromStatus: PROJECT_STATUS.DRAWING_PENDING,
      toStatus: PROJECT_STATUS.DRAWING_CONFIRMED,
      refId: drawing.id
    });

    RecordService.createRecord({
      projectId: drawing.projectId,
      type: 'STATUS_CHANGE',
      operator: operatorId,
      detail: `项目状态从「${PROJECT_STATUS_LABELS.DRAWING_PENDING}」变更为「${PROJECT_STATUS_LABELS.DRAWING_CONFIRMED}」`,
      fromStatus: PROJECT_STATUS.DRAWING_PENDING,
      toStatus: PROJECT_STATUS.DRAWING_CONFIRMED
    });

    setTimeout(() => {
      project.status = PROJECT_STATUS.PRODUCTION_PENDING;
      project.statusLabel = PROJECT_STATUS_LABELS.PRODUCTION_PENDING;
      project.currentHandler = project.productionMasterId;
      project.currentHandlerName = project.productionMasterName;
      project.updatedAt = new Date().toISOString();

      RecordService.createRecord({
        projectId: drawing.projectId,
        type: 'STATUS_CHANGE',
        operator: 'SYSTEM',
        detail: `项目状态从「${PROJECT_STATUS_LABELS.DRAWING_CONFIRMED}」自动变更为「${PROJECT_STATUS_LABELS.PRODUCTION_PENDING}」，当前处理人：${project.productionMasterName}(制作师傅)`,
        fromStatus: PROJECT_STATUS.DRAWING_CONFIRMED,
        toStatus: PROJECT_STATUS.PRODUCTION_PENDING
      });
    }, 100);

    return drawing;
  }

  static rejectDrawing(drawingId, params, operatorId) {
    AuthService.requireRole(operatorId, [ROLES.PRODUCTION_MASTER]);
    const drawing = this.requireDrawing(drawingId);
    const project = ProjectService.requireProject(drawing.projectId);

    if (drawing.status !== DRAWING_STATUS.PENDING) {
      const err = new Error(`当前图纸状态「${drawing.statusLabel}」不允许驳回，仅待确认状态可操作`);
      err.status = 400;
      err.code = 'INVALID_STATUS';
      throw err;
    }

    if (project.productionMasterId !== operatorId) {
      const err = new Error('仅该项目指定的制作师傅可以驳回图纸');
      err.status = 403;
      err.code = 'PERMISSION_DENIED';
      throw err;
    }

    const now = new Date().toISOString();
    drawing.status = DRAWING_STATUS.REJECTED;
    drawing.statusLabel = DRAWING_STATUS_LABELS.REJECTED;
    drawing.confirmedBy = operatorId;
    drawing.confirmedByName = AuthService.getUser(operatorId).name;
    drawing.confirmedAt = now;
    drawing.confirmRemark = params.reason || '';

    project.currentHandler = project.projectManagerId;
    project.currentHandlerName = project.projectManagerName;
    project.updatedAt = now;

    RecordService.createRecord({
      projectId: drawing.projectId,
      type: 'DRAWING_REJECT',
      operator: operatorId,
      detail: `驳回图纸${drawing.version}：${params.reason || '无驳回原因'}`,
      fromStatus: PROJECT_STATUS.DRAWING_PENDING,
      toStatus: PROJECT_STATUS.DRAWING_PENDING,
      refId: drawing.id
    });

    return drawing;
  }

  static getHistory(projectId) {
    return this.listByProject(projectId);
  }
}

module.exports = DrawingService;
