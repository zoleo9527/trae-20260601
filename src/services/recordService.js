const { store, generateId, nextSequence } = require('../data/store');
const {
  RECORD_TYPES,
  RECORD_TYPE_LABELS,
  ROLE_LABELS
} = require('../data/init');
const AuthService = require('./authService');

const RECORD_TYPE_ORDER_WEIGHT = {
  PROJECT_CREATE: 10,
  REMARK_ADD: 20,
  DRAWING_SUBMIT: 30,
  DRAWING_REJECT: 40,
  DRAWING_CONFIRM: 50,
  SCHEDULE_SUBMIT: 60,
  SCHEDULE_CONFIRM: 70,
  STATUS_CHANGE: 100
};

class RecordService {
  static createRecord(params) {
    const {
      projectId,
      type,
      operator,
      detail,
      fromStatus = null,
      toStatus = null,
      refId = null,
      actionTime = null
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
      actionTime: actionTime || new Date().toISOString(),
      actionTimestamp: Date.now(),
      sequence: nextSequence(),
      typeOrderWeight: RECORD_TYPE_ORDER_WEIGHT[type] || 50,
      detail,
      fromStatus,
      toStatus,
      refId
    };

    store.records.unshift(record);
    return record;
  }

  static _sortRecords(records, descending = false) {
    return [...records].sort((a, b) => {
      const timeDiff = new Date(a.actionTime) - new Date(b.actionTime);
      if (timeDiff !== 0) {
        return descending ? -timeDiff : timeDiff;
      }
      const seqDiff = a.sequence - b.sequence;
      if (seqDiff !== 0) {
        return descending ? -seqDiff : seqDiff;
      }
      const typeDiff = a.typeOrderWeight - b.typeOrderWeight;
      return descending ? -typeDiff : typeDiff;
    });
  }

  static listByProject(projectId) {
    const records = store.records.filter(r => r.projectId === projectId);
    return this._sortRecords(records, false);
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
    return this._sortRecords(result, true);
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
