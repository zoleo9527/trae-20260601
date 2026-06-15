const { store } = require('../data/store');
const {
  ROLES,
  ROLE_LABELS,
  PROJECT_STATUS,
  PROJECT_STATUS_LABELS,
  RECORD_TYPES,
  RECORD_TYPE_LABELS
} = require('../data/init');
const { generateId } = require('../data/store');

class AuthService {
  static getUser(userId) {
    return store.users.find(u => u.id === userId);
  }

  static requireUser(userId) {
    const user = this.getUser(userId);
    if (!user) {
      const err = new Error(`用户不存在: ${userId}`);
      err.status = 401;
      err.code = 'USER_NOT_FOUND';
      throw err;
    }
    return user;
  }

  static requireRole(userId, allowedRoles) {
    const user = this.requireUser(userId);
    if (!allowedRoles.includes(user.role)) {
      const roleLabels = allowedRoles.map(r => ROLE_LABELS[r]).join('、');
      const err = new Error(`权限不足，需要${roleLabels}角色，当前用户为${user.roleLabel}`);
      err.status = 403;
      err.code = 'PERMISSION_DENIED';
      throw err;
    }
    return user;
  }

  static isProjectManager(userId) {
    const user = this.getUser(userId);
    return user && user.role === ROLES.PROJECT_MANAGER;
  }

  static isProductionMaster(userId) {
    const user = this.getUser(userId);
    return user && user.role === ROLES.PRODUCTION_MASTER;
  }

  static isInstallLeader(userId) {
    const user = this.getUser(userId);
    return user && user.role === ROLES.INSTALL_LEADER;
  }

  static canHandleProject(userId, project) {
    const user = this.requireUser(userId);
    if (project.currentHandler === userId) return true;
    if (user.role === ROLES.PROJECT_MANAGER && project.projectManagerId === userId) return true;
    if (user.role === ROLES.PRODUCTION_MASTER && project.productionMasterId === userId) return true;
    if (user.role === ROLES.INSTALL_LEADER && project.installLeaderId === userId) return true;
    return false;
  }

  static listUsers() {
    return store.users;
  }
}

module.exports = AuthService;
