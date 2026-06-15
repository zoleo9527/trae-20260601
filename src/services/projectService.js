const { store, generateId } = require('../data/store');
const {
  ROLES,
  PROJECT_STATUS,
  PROJECT_STATUS_LABELS
} = require('../data/init');
const AuthService = require('./authService');
const RecordService = require('./recordService');

class ProjectService {
  static getProject(projectId) {
    return store.projects.find(p => p.id === projectId);
  }

  static requireProject(projectId) {
    const project = this.getProject(projectId);
    if (!project) {
      const err = new Error(`项目不存在: ${projectId}`);
      err.status = 404;
      err.code = 'PROJECT_NOT_FOUND';
      throw err;
    }
    return project;
  }

  static listProjects(filters = {}) {
    let result = [...store.projects];
    if (filters.status) {
      result = result.filter(p => p.status === filters.status);
    }
    if (filters.currentHandler) {
      result = result.filter(p => p.currentHandler === filters.currentHandler);
    }
    if (filters.projectManagerId) {
      result = result.filter(p => p.projectManagerId === filters.projectManagerId);
    }
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(kw) ||
        p.code.toLowerCase().includes(kw) ||
        p.client.toLowerCase().includes(kw)
      );
    }
    return result.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  static createProject(params, operatorId) {
    AuthService.requireRole(operatorId, [ROLES.PROJECT_MANAGER]);

    const now = new Date().toISOString();
    const project = {
      id: 'PRJ_' + generateId().toUpperCase().substring(0, 9),
      name: params.name,
      code: params.code || 'PRJ-' + Date.now(),
      client: params.client,
      siteAddress: params.siteAddress,
      surveyDate: params.surveyDate,
      surveyPerson: params.surveyPerson,
      designFile: params.designFile || null,
      productionOrder: params.productionOrder || null,
      status: PROJECT_STATUS.DRAFT,
      statusLabel: PROJECT_STATUS_LABELS.DRAFT,
      currentHandler: operatorId,
      currentHandlerName: AuthService.getUser(operatorId).name,
      projectManagerId: operatorId,
      projectManagerName: AuthService.getUser(operatorId).name,
      productionMasterId: params.productionMasterId || 'USER_002',
      productionMasterName: AuthService.getUser(params.productionMasterId || 'USER_002').name,
      installLeaderId: params.installLeaderId || 'USER_003',
      installLeaderName: AuthService.getUser(params.installLeaderId || 'USER_003').name,
      createdAt: now,
      createdBy: operatorId,
      createdByName: AuthService.getUser(operatorId).name,
      updatedAt: now,
      remarks: []
    };

    if (params.initialRemark) {
      project.remarks.push({
        id: generateId(),
        content: params.initialRemark,
        author: AuthService.getUser(operatorId).name,
        authorId: operatorId,
        createdAt: now
      });
    }

    store.projects.unshift(project);

    RecordService.createRecord({
      projectId: project.id,
      type: 'PROJECT_CREATE',
      operator: operatorId,
      detail: `创建项目「${project.name}」，项目编号 ${project.code}`,
      fromStatus: null,
      toStatus: PROJECT_STATUS.DRAFT
    });

    return project;
  }

  static addRemark(projectId, params, operatorId) {
    const project = this.requireProject(projectId);
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

    project.remarks.push(remark);
    project.updatedAt = remark.createdAt;

    RecordService.createRecord({
      projectId,
      type: 'REMARK_ADD',
      operator: operatorId,
      detail: `添加备注：${params.content}`,
      fromStatus: project.status,
      toStatus: project.status
    });

    return remark;
  }

  static updateStatus(projectId, newStatus, operatorId, detail) {
    const project = this.requireProject(projectId);
    const oldStatus = project.status;

    project.status = newStatus;
    project.statusLabel = PROJECT_STATUS_LABELS[newStatus];
    project.updatedAt = new Date().toISOString();

    if (detail) {
      RecordService.createRecord({
        projectId,
        type: 'STATUS_CHANGE',
        operator: operatorId,
        detail,
        fromStatus: oldStatus,
        toStatus: newStatus
      });
    }

    return project;
  }

  static setCurrentHandler(projectId, handlerId, operatorId) {
    const project = this.requireProject(projectId);
    const handler = AuthService.requireUser(handlerId);

    project.currentHandler = handlerId;
    project.currentHandlerName = handler.name;
    project.updatedAt = new Date().toISOString();

    return project;
  }

  static getDetail(projectId) {
    const project = this.requireProject(projectId);
    const timeline = RecordService.getTimeline(projectId);
    return {
      ...project,
      timeline
    };
  }
}

module.exports = ProjectService;
