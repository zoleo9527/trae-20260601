const db = require('../database/db');
const { getRoleName } = require('../utils/roles');

const writeLog = ({
  leaseId = null,
  deductionRuleId = null,
  operator,
  action,
  actionDetail = null,
  fromStatus = null,
  toStatus = null,
  ip = null,
}) => {
  const stmt = db.prepare(`
    INSERT INTO operation_logs 
    (lease_id, deduction_rule_id, operator_id, operator_name, operator_role, 
     action, action_detail, from_status, to_status, ip)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const detail = typeof actionDetail === 'object'
    ? JSON.stringify(actionDetail)
    : actionDetail;

  return stmt.run(
    leaseId,
    deductionRuleId,
    operator.id,
    operator.name,
    operator.role,
    action,
    detail,
    fromStatus,
    toStatus,
    ip
  );
};

const LOG_ACTIONS = {
  LEASE_CREATE: 'LEASE_CREATE',
  LEASE_EDIT: 'LEASE_EDIT',
  LEASE_SUBMIT: 'LEASE_SUBMIT',
  LEASE_CONFIRM: 'LEASE_CONFIRM',
  LEASE_REJECT: 'LEASE_REJECT',
  LEASE_REACTIVATE: 'LEASE_REACTIVATE',
  DEDUCTION_CREATE: 'DEDUCTION_CREATE',
  DEDUCTION_EDIT: 'DEDUCTION_EDIT',
  DEDUCTION_CONFIRM: 'DEDUCTION_CONFIRM',
  DEDUCTION_MARK_LIABILITY: 'DEDUCTION_MARK_LIABILITY',
  DEDUCTION_CLEAR_LIABILITY: 'DEDUCTION_CLEAR_LIABILITY',
  DEDUCTION_VERSION_UPDATE: 'DEDUCTION_VERSION_UPDATE',
  EXPORT_CREATE: 'EXPORT_CREATE',
  EXPORT_COMPLETE: 'EXPORT_COMPLETE',
};

module.exports = { writeLog, LOG_ACTIONS };
