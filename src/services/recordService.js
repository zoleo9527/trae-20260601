const { store, generateId } = require('../data/store');
const {
  RECORD_TYPES,
  RECORD_TYPE_LABELS,
  ROLE_LABELS
} = require('../data/init');
const AuthService = require('./authService');

class RecordService {
  static createRecord(params) {
    const {
      projectId,
      type,
      operator,
      detail,
      fromStatus = null,
      toStatus = null,
      refId = null
    } = params;

    const user = AuthService.getUser(operator);
    const operatorName = user ? user.name : (operator === 'SYSTEM' ? '系统' : '未知');
    const operatorRole = user ? user.roleLabel : (operator === 'SYSTEM' ? '系统' : '未知');

    const record = {
      id: 'REC_' + generateId(),
      projectId,
      type,
      typeLabel: RECORD_TYPE_LABELS[type] || type,
      operator,
      operatorName,
      operatorRole,
      actionTime: new Date().toISOString(),
      detail,
      fromStatus,
      toStatus,
      refId
    };

    store.records.unshift(record);
    return record;
  }

  static listByProject(projectId) {
    return store.records
      .filter(r => r.projectId === projectId)
      .sort((a, b) => new Date(a.actionTime) - new Date(b.actionTime));
  }

  static listAll(filters = {}) {
    let result = [...store.records];
    if (filters.projectId) {
      result = result.filter(r => r.projectId === filters.projectId);
    }
    if (filters.operator) {
      result = result.filter(r => r.operator === filters.operator);
    }
    if (filters.type) {
      result = result.filter(r => r.type === filters.type);
    }
    if (filters.startTime) {
      result = result.filter(r => new Date(r.actionTime) >= new Date(filters.startTime));
    }
    if (filters.endTime) {
      result = result.filter(r => new Date(r.actionTime) <= new Date(filters.endTime));
    }
    return result.sort((a, b) => new Date(b.actionTime) - new Date(a.actionTime));
  }

  static getTimeline(projectId) {
    const records = this.listByProject(projectId);
    return records.map(r => ({
      time: r.actionTime,
      operator: r.operatorName,
      role: r.operatorRole,
      action: r.typeLabel,
      detail: r.detail,
      statusChange: r.fromStatus && r.toStatus ? `${r.fromStatus} → ${r.toStatus}` : null
    }));
  }
}

module.exports = RecordService;
